-- =====================================================================
-- MatrixHub — Users & Multitenancy schema
-- Migration: 0001_init_users_multitenant
--
-- Target: Neon Postgres (https://neon.tech). Idempotent: safe to re-run.
-- Apply with:  npm run db:migrate
--
-- Model
--   tenants        : an organization / workspace (the unit of multitenancy)
--   users          : a global identity (one row per email, email-verified)
--   memberships    : which user belongs to which tenant, and with what role
--   invitations    : pending email invites into a tenant
--   *_tokens       : single-use, hashed tokens for email verification / reset
--   sessions       : issued auth sessions (for revocation + audit)
--   audit_log      : tenant-scoped operator activity trail
-- =====================================================================

-- Extensions -----------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive email

-- Enum types (guarded so re-runs don't error) --------------------------
DO $$ BEGIN
  CREATE TYPE membership_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'invited', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper: keep updated_at current --------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tenants --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        citext NOT NULL UNIQUE,
  name        text NOT NULL,
  plan        text NOT NULL DEFAULT 'free',
  settings    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_tenants_updated ON tenants;
CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Users (global identity) ---------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           citext NOT NULL UNIQUE,
  email_verified  boolean NOT NULL DEFAULT false,
  password_hash   text,                       -- null until set (e.g. invite flow)
  full_name       text,
  avatar_url      text,
  status          user_status NOT NULL DEFAULT 'invited',
  is_superadmin   boolean NOT NULL DEFAULT false,
  last_login_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Memberships (user <-> tenant) ---------------------------------------
CREATE TABLE IF NOT EXISTS memberships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  role        membership_role NOT NULL DEFAULT 'member',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user   ON memberships(user_id);

DROP TRIGGER IF EXISTS trg_memberships_updated ON memberships;
CREATE TRIGGER trg_memberships_updated BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Email verification tokens -------------------------------------------
-- Only the SHA-256 hash of the token is stored; the raw token is emailed.
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL,
  email       citext NOT NULL,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evt_user ON email_verification_tokens(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_evt_token ON email_verification_tokens(token_hash);

-- Password reset tokens ------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prt_user ON password_reset_tokens(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_prt_token ON password_reset_tokens(token_hash);

-- Invitations (invite an email into a tenant) -------------------------
CREATE TABLE IF NOT EXISTS invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       citext NOT NULL,
  role        membership_role NOT NULL DEFAULT 'member',
  token_hash  text NOT NULL,
  status      invitation_status NOT NULL DEFAULT 'pending',
  invited_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  expires_at  timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON invitations(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_invitations_token ON invitations(token_hash);

-- Sessions (issued auth sessions; enables server-side revocation) ------
CREATE TABLE IF NOT EXISTS sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id   uuid REFERENCES tenants(id) ON DELETE SET NULL,
  token_hash  text NOT NULL,
  user_agent  text,
  ip          inet,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sessions_token ON sessions(token_hash);

-- Audit log (tenant-scoped operator activity) -------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES tenants(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id)   ON DELETE SET NULL,
  action        text NOT NULL,
  target        text,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_log(tenant_id, created_at DESC);

-- ---------------------------------------------------------------------
-- Row-Level Security (optional, recommended for true tenant isolation).
-- Enable per table and set `app.tenant_id` / `app.user_id` from your
-- connection. Left commented so the admin's pooled service role keeps
-- working out of the box; uncomment when wiring per-tenant DB roles.
-- ---------------------------------------------------------------------
-- ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation ON memberships
--   USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
