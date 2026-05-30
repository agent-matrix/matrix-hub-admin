import { query, queryOne, withTransaction } from './db';
import { generateToken, hashToken, hashPassword } from './auth/crypto';

export type Role = 'owner' | 'admin' | 'member' | 'viewer';
export type UserStatus = 'active' | 'invited' | 'suspended' | 'deleted';

export interface UserRow {
  id: string;
  email: string;
  email_verified: boolean;
  password_hash: string | null;
  full_name: string | null;
  status: UserStatus;
  is_superadmin: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface TenantRow {
  id: string;
  slug: string;
  name: string;
  plan: string;
  created_at: string;
}

export interface MemberRow {
  user_id: string;
  email: string;
  full_name: string | null;
  email_verified: boolean;
  status: UserStatus;
  role: Role;
  last_login_at: string | null;
  created_at: string;
}

const VERIFY_TTL_HOURS = 24;
const INVITE_TTL_HOURS = 72;

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || `tenant-${Date.now().toString(36)}`
  );
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return queryOne<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
}

export async function getMembership(
  userId: string,
  tenantId: string
): Promise<{ role: Role } | null> {
  return queryOne<{ role: Role }>(
    'SELECT role FROM memberships WHERE user_id = $1 AND tenant_id = $2',
    [userId, tenantId]
  );
}

/** Primary (first) tenant membership for a user, used to scope a session. */
export async function getPrimaryMembership(
  userId: string
): Promise<{ tenant_id: string; role: Role; name: string; slug: string } | null> {
  return queryOne(
    `SELECT m.tenant_id, m.role, t.name, t.slug
       FROM memberships m JOIN tenants t ON t.id = m.tenant_id
      WHERE m.user_id = $1
      ORDER BY m.created_at ASC
      LIMIT 1`,
    [userId]
  );
}

/**
 * First-run bootstrap: create the single ROOT admin (superadmin + tenant owner)
 * and its workspace, in one transaction. The root is created already verified
 * and active so an on-prem operator is never locked out when email isn't wired
 * up. The caller must guard this to run only when zero users exist.
 */
export async function registerOwner(params: {
  email: string;
  password: string;
  fullName?: string | null;
  tenantName?: string | null;
}): Promise<{ user: UserRow; tenant: TenantRow }> {
  const password_hash = await hashPassword(params.password);
  const tenantName = (params.tenantName || params.email.split('@')[0] || 'workspace').trim();

  return withTransaction(async (client) => {
    // unique slug
    const base = slugify(tenantName);
    let slug = base;
    for (let i = 2; ; i += 1) {
      const exists = await client.query('SELECT 1 FROM tenants WHERE slug = $1', [slug]);
      if (exists.rowCount === 0) break;
      slug = `${base}-${i}`;
    }

    const tenant = (
      await client.query<TenantRow>(
        'INSERT INTO tenants (slug, name) VALUES ($1, $2) RETURNING *',
        [slug, tenantName]
      )
    ).rows[0];

    const user = (
      await client.query<UserRow>(
        `INSERT INTO users (email, password_hash, full_name, status, email_verified, is_superadmin)
         VALUES ($1, $2, $3, 'active', true, true) RETURNING *`,
        [params.email, password_hash, params.fullName ?? null]
      )
    ).rows[0];

    await client.query(
      `INSERT INTO memberships (tenant_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [tenant.id, user.id]
    );

    return { user, tenant };
  });
}

/** Total number of users — used to gate first-run bootstrap. */
export async function countUsers(): Promise<number> {
  const row = await queryOne<{ n: string }>('SELECT count(*) AS n FROM users');
  return Number(row?.n ?? 0);
}

/**
 * Admin-driven user creation (on-prem: only admins create users). Creates the
 * user with an admin-set password (unverified), attaches a tenant membership,
 * and returns a verification token to email. If the user already exists, the
 * membership is added/updated and a fresh verification token is issued only
 * when they are still unverified.
 */
export async function createUserByAdmin(params: {
  tenantId: string;
  email: string;
  password: string;
  fullName?: string | null;
  role: Role;
}): Promise<{ user: UserRow; verifyToken: string | null; created: boolean }> {
  const password_hash = await hashPassword(params.password);
  return withTransaction(async (client) => {
    let user = (
      await client.query<UserRow>('SELECT * FROM users WHERE email = $1', [params.email])
    ).rows[0];
    let created = false;

    if (!user) {
      user = (
        await client.query<UserRow>(
          `INSERT INTO users (email, password_hash, full_name, status, email_verified)
           VALUES ($1, $2, $3, 'invited', false) RETURNING *`,
          [params.email, password_hash, params.fullName ?? null]
        )
      ).rows[0];
      created = true;
    } else {
      // Existing account: (re)set the password the admin provided.
      user = (
        await client.query<UserRow>(
          `UPDATE users SET password_hash = $2, full_name = COALESCE($3, full_name) WHERE id = $1 RETURNING *`,
          [user.id, password_hash, params.fullName ?? null]
        )
      ).rows[0];
    }

    await client.query(
      `INSERT INTO memberships (tenant_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [params.tenantId, user.id, params.role]
    );

    let verifyToken: string | null = null;
    if (!user.email_verified) {
      verifyToken = generateToken();
      await client.query(
        `INSERT INTO email_verification_tokens (user_id, token_hash, email, expires_at)
         VALUES ($1, $2, $3, now() + ($4 || ' hours')::interval)`,
        [user.id, hashToken(verifyToken), params.email, String(VERIFY_TTL_HOURS)]
      );
    }

    return { user, verifyToken, created };
  });
}

/** Issue a fresh verification token for an existing unverified user. */
export async function createVerificationToken(user: UserRow): Promise<string> {
  const raw = generateToken();
  await query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, email, expires_at)
     VALUES ($1, $2, $3, now() + ($4 || ' hours')::interval)`,
    [user.id, hashToken(raw), user.email, String(VERIFY_TTL_HOURS)]
  );
  return raw;
}

/** Consume a verification token → mark the user verified + active. */
export async function consumeVerificationToken(
  rawToken: string
): Promise<{ ok: boolean; reason?: string; userId?: string }> {
  return withTransaction(async (client) => {
    const row = (
      await client.query<{ id: string; user_id: string; expires_at: string; consumed_at: string | null }>(
        'SELECT id, user_id, expires_at, consumed_at FROM email_verification_tokens WHERE token_hash = $1',
        [hashToken(rawToken)]
      )
    ).rows[0];

    if (!row) return { ok: false, reason: 'invalid' };
    if (row.consumed_at) return { ok: false, reason: 'used' };
    if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: 'expired' };

    await client.query('UPDATE email_verification_tokens SET consumed_at = now() WHERE id = $1', [
      row.id,
    ]);
    await client.query(
      `UPDATE users SET email_verified = true, status = 'active' WHERE id = $1`,
      [row.user_id]
    );
    return { ok: true, userId: row.user_id };
  });
}

export async function recordLogin(userId: string): Promise<void> {
  await query('UPDATE users SET last_login_at = now() WHERE id = $1', [userId]);
}

/** List all members of a tenant (for the Users admin view). */
export async function listTenantMembers(tenantId: string): Promise<MemberRow[]> {
  const r = await query<MemberRow>(
    `SELECT u.id AS user_id, u.email, u.full_name, u.email_verified, u.status,
            m.role, u.last_login_at, m.created_at
       FROM memberships m JOIN users u ON u.id = m.user_id
      WHERE m.tenant_id = $1
      ORDER BY m.created_at ASC`,
    [tenantId]
  );
  return r.rows;
}

/**
 * Invite an email into a tenant. Creates the user (status=invited) if needed,
 * adds a membership, and returns a raw invite token for emailing.
 */
export async function inviteMember(params: {
  tenantId: string;
  email: string;
  role: Role;
  invitedBy: string | null;
}): Promise<{ raw: string; created: boolean }> {
  return withTransaction(async (client) => {
    let user = (
      await client.query<UserRow>('SELECT * FROM users WHERE email = $1', [params.email])
    ).rows[0];
    let created = false;
    if (!user) {
      user = (
        await client.query<UserRow>(
          `INSERT INTO users (email, status, email_verified) VALUES ($1, 'invited', false) RETURNING *`,
          [params.email]
        )
      ).rows[0];
      created = true;
    }

    await client.query(
      `INSERT INTO memberships (tenant_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [params.tenantId, user.id, params.role]
    );

    const raw = generateToken();
    await client.query(
      `INSERT INTO invitations (tenant_id, email, role, token_hash, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, now() + ($6 || ' hours')::interval)
       ON CONFLICT (tenant_id, email)
       DO UPDATE SET token_hash = EXCLUDED.token_hash, role = EXCLUDED.role,
                     status = 'pending', expires_at = EXCLUDED.expires_at`,
      [params.tenantId, params.email, params.role, hashToken(raw), params.invitedBy, String(INVITE_TTL_HOURS)]
    );

    return { raw, created };
  });
}

/** Remove a user from a tenant (membership only; the global identity remains). */
export async function removeMember(tenantId: string, userId: string): Promise<boolean> {
  const r = await query('DELETE FROM memberships WHERE tenant_id = $1 AND user_id = $2', [
    tenantId,
    userId,
  ]);
  return (r.rowCount ?? 0) > 0;
}

export async function updateMemberRole(
  tenantId: string,
  userId: string,
  role: Role
): Promise<boolean> {
  const r = await query(
    'UPDATE memberships SET role = $3 WHERE tenant_id = $1 AND user_id = $2',
    [tenantId, userId, role]
  );
  return (r.rowCount ?? 0) > 0;
}

export async function countOwners(tenantId: string): Promise<number> {
  const row = await queryOne<{ n: string }>(
    `SELECT count(*) AS n FROM memberships WHERE tenant_id = $1 AND role = 'owner'`,
    [tenantId]
  );
  return Number(row?.n ?? 0);
}
