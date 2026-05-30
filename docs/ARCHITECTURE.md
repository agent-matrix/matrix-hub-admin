# Architecture

Technical reference for the MatrixHub Admin Console. For setup and deployment,
see the [Installation Guide](INSTALLATION.md).

## Overview

The console is a [Next.js](https://nextjs.org) (Pages Router) application. It
never talks to the database or the Matrix Hub admin API from the browser —
every privileged call goes through a **server-side route** that injects secrets.

```
Browser ──► Next.js (admin console)
              ├─ /api/hub/*    ─► Matrix Hub backend   (HUB_API_TOKEN injected server-side)
              ├─ /api/auth/*   ─┐
              └─ /api/users/*  ─┴► Neon Postgres        (users, tenants, sessions)
                                  Resend                (verification email)
```

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (Pages Router), React 18, TypeScript |
| Styling | Tailwind CSS, lucide-react icons |
| Database | Postgres (Neon) via `@neondatabase/serverless` (+ `ws` for Node runtimes) |
| Auth | `jose` (HS256 JWT) in `httpOnly` cookies, `bcryptjs` password hashing |
| Email | `resend` (transactional verification / invitations) |

## API surface

### `/api/hub/*` — Matrix Hub proxy (server-side)
| Route | Upstream | Notes |
|---|---|---|
| `catalog`, `search`, `entity` | `GET /catalog*` | Read catalog + entity detail. |
| `remotes` | `GET/POST/DELETE /remotes` | Manage upstream indexes. |
| `sync`, `sync-status` | `POST /remotes/sync`, `GET /remotes/sync/{id}` | Trigger + poll sync. |
| `registry` | `POST /registry/mcp` | Register (publish) an MCP server. |
| `install` | `POST /catalog/install` | Publish/install an entity from a manifest. |
| `gateways` | `GET/DELETE/POST /gateways/pending*` | Inspect and remove registered servers. |
| `ingest` | `POST /ingest` | Ingest from a remote. |

The bearer token (`HUB_API_TOKEN`) is attached only on the server.

### `/api/auth/*` — authentication
`login`, `logout`, `me`, `register` (first-run root bootstrap only),
`verify`, `resend-verification`, `setup-status`.

### `/api/users/*` — tenant-scoped user management (role-gated)
`GET /api/users` (list members), `POST /api/users` (create user, admin+),
`PATCH/DELETE /api/users/[id]` (role change / remove, admin+).

## Data model

Created by `migrations/0001_init_users_multitenant.sql`:

| Table | Purpose |
|---|---|
| `tenants` | Workspaces — the unit of multitenancy. |
| `users` | Global identities (one row per email, verified flag, bcrypt hash). |
| `memberships` | user ↔ tenant with a role (`owner`/`admin`/`member`/`viewer`). |
| `email_verification_tokens` / `password_reset_tokens` | Single-use, hashed tokens. |
| `invitations` | Pending tenant invites. |
| `sessions` | Issued sessions (revocation + audit). |
| `audit_log` | Tenant-scoped operator activity. |

UUID primary keys, `citext` emails, `updated_at` triggers, and indexes are
included. Commented Row-Level Security policies ship in the migration for
hard per-tenant isolation.

## Authentication model

- **On-prem, single root.** Public signup is disabled. The first run (zero
  users) creates one root admin (superadmin + owner), auto-verified and signed
  in immediately. `POST /api/auth/register` returns `signup_disabled` thereafter.
- **Admin-provisioned users.** Admins create accounts from the Users page;
  each new user must verify their email before first sign-in.
- **Sessions.** Stateless HS256 JWT in an `httpOnly`, `Secure`, `SameSite=Lax`
  cookie signed with `AUTH_SECRET`. Roles rank `owner` > `admin` > `member` > `viewer`.
- **Fallback.** With no `DATABASE_URL`, a local `admin / admin` login keeps the
  UI usable for previews/demos.

## Project structure

```
matrix-hub-admin/
├─ migrations/                 # SQL migrations (idempotent)
├─ scripts/                    # migrate.mjs, seed-admin.mjs
├─ .github/workflows/          # db-migrate, db-seed-admin
├─ docs/                       # INSTALLATION.md, ARCHITECTURE.md, assets/
└─ src/
   ├─ components/
   │  ├─ layout/               # Sidebar, Topbar, UserMenu, MatrixBackground, nav
   │  ├─ ui/                   # Button, Card, Badge, MetricCard, PageHeader
   │  ├─ views/                # Overview, Search, Remotes, Gateway, Entities,
   │  │                        #   Health, Users, Settings, EnvVarsManager
   │  └─ ops/                  # Publish / remove dialogs (OpsProvider)
   ├─ contexts/AuthContext.tsx # DB-backed auth with legacy fallback
   ├─ lib/                     # db, email, users, hubProxy, auth/{crypto,session,guard}
   └─ pages/
      ├─ api/{auth,users,hub}/ # server routes
      ├─ overview · catalog · remotes · gateway · entities · health · users · settings
      └─ login · verify
```

## Scripts

```bash
npm run dev            # development server (http://localhost:3000)
npm run build          # production build
npm run start          # serve the production build
npm run lint           # ESLint
npm run db:migrate     # apply database migrations (idempotent)
npm run db:seed-admin  # seed the single root admin (no-op if users exist)
```

## Security notes

- Secrets are server-only; nothing privileged is shipped to the browser, and
  `NEXT_PUBLIC_*` is never used for secrets.
- The Neon driver connects over WebSocket; `ws` is provided for Node runtimes
  (e.g. Node 20 CI) that lack a global `WebSocket`.
- `.env.local` is git-ignored. Rotate any credential that has been shared.
