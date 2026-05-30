# MatrixHub Admin — Installation Guide

This guide covers installing and operating the **MatrixHub Admin Console** as an
on-prem, single-root deployment with:

- **Postgres (Neon)** for users + multitenancy
- **Email verification** via **Resend**
- A custom domain (e.g. **`https://admin.matrixhub.io`**)
- First-run **root admin** bootstrap (public signup disabled)

The console is a **Next.js** app. It can run on Vercel or any Node host, and it
talks to your Matrix Hub backend (default `https://api.matrixhub.io`) through
server-side proxy routes that inject the admin token.

---

## 1. Prerequisites

- **Node.js ≥ 18** (CI/Vercel use Node 20)
- A **Neon Postgres** database (or any Postgres reachable by a connection string)
- A **Resend** account + verified sending domain (for verification emails)
- A running **Matrix Hub** backend (for catalog / gateway operations)
- DNS control for your domain (examples below use **Cloudflare**)

---

## 2. Environment variables

Copy `.env.local.example` → `.env.local` and fill in the values. The same
variables are set in the Vercel dashboard for a hosted deploy.

| Variable | Required | Scope | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | server | Neon **pooled** connection string (`...-pooler...?sslmode=require`). |
| `AUTH_SECRET` | ✅ | server | Secret that signs session JWTs. Generate with `openssl rand -base64 48`. |
| `APP_URL` | ✅ | server | Public URL of the admin, e.g. `https://admin.matrixhub.io`. Used in email links. |
| `RESEND_API_KEY` | ▲ | server | Resend API key (`re_…`). If unset, verification links are logged, not emailed. |
| `RESEND_FROM` | ▲ | server | Verified sender, e.g. `MatrixHub <noreply@matrixhub.io>`. |
| `HUB_URL` | ▲ | server | Matrix Hub base URL. Default `https://api.matrixhub.io`. |
| `HUB_API_TOKEN` | ○ | server | Bearer token for write-side hub endpoints on private hubs. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` / `ADMIN_TENANT` | ○ | seed only | Used by `npm run db:seed-admin` / the seed workflow to create the root headlessly. |

✅ required · ▲ required for that feature · ○ optional

> **Never** put secrets in `NEXT_PUBLIC_*` variables — those are exposed to the
> browser. `POSTGRES_URL` and `NEXTAUTH_SECRET` are accepted as fallbacks for
> `DATABASE_URL` / `AUTH_SECRET`.

---

## 3. Create the database tables

The migration is **idempotent** (`CREATE TABLE IF NOT EXISTS` + a
`schema_migrations` ledger), so it's safe to run repeatedly.

```bash
export DATABASE_URL='postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
npm ci
npm run db:migrate
```

This creates: `tenants`, `users`, `memberships`, `email_verification_tokens`,
`password_reset_tokens`, `invitations`, `sessions`, `audit_log`.

You can also run it from CI — see [§7](#7-github-actions).

---

## 4. Create the ROOT admin (first run)

This is an **on-prem, single-root** deployment: **public signup is disabled.**
The very first run (zero users) creates exactly one root administrator; after
that the signup UI never appears again, and the root admin provisions all other
users (each must verify their email).

Choose **one** of:

**A. Web first-run setup (recommended)**
1. Start the app and open it (`/login`).
2. Because there are no users yet, you'll see **"Create root admin"**.
3. Submit name / email / password. The root is created verified + active and
   signed in immediately.

**B. Headless seed (CI or terminal)**
```bash
ADMIN_EMAIL=root@matrixhub.io \
ADMIN_PASSWORD='a-strong-password' \
ADMIN_NAME='Root Administrator' \
ADMIN_TENANT='MatrixHub' \
npm run db:seed-admin
```
This is a no-op if any user already exists.

After this, sign in at `/login`. Manage members from **Users** in the sidebar.

---

## 5. Run locally

```bash
npm ci
npm run dev      # http://localhost:3000
# production-style:
npm run build && npm run start
```

If `DATABASE_URL` is **not** set, the console falls back to a legacy
`admin / admin` local login so you can preview the UI without a database.

---

## 6. Deploy on Vercel with a custom domain

### 6.1 Project + env vars
1. Import the repo into Vercel (Framework preset: **Next.js**).
2. **Settings → Environment Variables** → add, for **Production**:
   `DATABASE_URL`, `AUTH_SECRET`, `APP_URL=https://admin.matrixhub.io`,
   `RESEND_API_KEY`, `RESEND_FROM`, `HUB_URL` (+ `HUB_API_TOKEN` if needed).
   Mark `DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `HUB_API_TOKEN` as
   **Sensitive**.
3. Deploy.

### 6.2 Add the domain
**Vercel → Project → Settings → Domains → Add Domain**
- Domain: `admin.matrixhub.io`
- Connect to environment: **Production**
- Redirect: **No Redirect**

Vercel shows a **CNAME** target (usually `cname.vercel-dns.com`, or a
project-specific `<hash>.vercel-dns-017.com`). Note it for the next step.

### 6.3 DNS (Cloudflare)
Add **one** record (leave existing `matrixhub.io`, `www`, `api`, and Resend
records as they are):

| Type | Name | Target | Proxy | TTL |
|---|---|---|---|---|
| `CNAME` | `admin` | *(the value Vercel showed, e.g. `cname.vercel-dns.com`)* | **DNS only** | Auto |

> ⚠️ Use **DNS only** (grey cloud), matching your existing `www` record. The
> Cloudflare orange-cloud proxy interferes with Vercel's TLS issuance and can
> cause redirect loops. Vercel will auto-verify and issue the certificate once
> the CNAME resolves.

### 6.4 Finalize
- Confirm the domain reads **"Valid Configuration"** in Vercel.
- Ensure `APP_URL=https://admin.matrixhub.io` so verification emails link
  correctly. Redeploy if you changed it.
- Open `https://admin.matrixhub.io` and complete the root-admin first-run.

### Reference: example matrixhub.io DNS layout
| Record | Type | Points to | Proxy |
|---|---|---|---|
| `api.matrixhub.io` | A | Matrix Hub backend | Proxied |
| `matrixhub.io` | A | marketing site / Vercel | DNS only |
| `www.matrixhub.io` | CNAME | `*.vercel-dns-017.com` | DNS only |
| **`admin.matrixhub.io`** | **CNAME** | **Vercel (admin project)** | **DNS only** |
| `send.matrixhub.io` | MX/TXT | Resend (SES) | DNS only |
| `resend._domainkey` | TXT | Resend DKIM | DNS only |

---

## 7. GitHub Actions

Two workflows automate the database (require repo secrets under
**Settings → Secrets and variables → Actions**):

- **`Database migrate`** (`.github/workflows/db-migrate.yml`) — runs
  `npm run db:migrate` on manual dispatch and when `migrations/**` change.
  Creates tables only if missing. Needs secret **`DATABASE_URL`**.
- **`Seed root admin`** (`.github/workflows/db-seed-admin.yml`) — manual; runs
  migrations then seeds the single root from inputs + secret **`ADMIN_PASSWORD`**.
  No-op if a user already exists.

| Secret | Required for | Value |
|---|---|---|
| `DATABASE_URL` | both | Neon pooled connection string |
| `ADMIN_PASSWORD` | seed workflow | Initial root password (≥ 8 chars) |

---

## 8. Email (Resend)

1. Verify your sending domain in Resend (the `send.matrixhub.io` MX/SPF and
   `resend._domainkey` TXT records).
2. Set `RESEND_API_KEY` and `RESEND_FROM` (e.g. `MatrixHub <noreply@matrixhub.io>`).
3. Test: create a user from **Users** → the new user receives a verification
   email and cannot sign in until they click the link (`/verify?token=…`).

Without `RESEND_API_KEY`, the app still works — verification links are written
to the server logs instead of being emailed (handy for air-gapped setups).

---

## 9. Roles & multitenancy

- **Roles:** `owner` > `admin` > `member` > `viewer`. Creating/removing users
  and changing roles requires **admin** or higher.
- **Tenants (workspaces):** every user belongs to one or more tenants via
  `memberships`. The session is scoped to the user's primary tenant; the Users
  page manages members of that tenant.
- The schema ships commented **Row-Level Security** policies — enable them and
  set `app.tenant_id` per connection for hard DB-level isolation.

---

## 10. Security checklist

- [ ] `AUTH_SECRET` is long and random, and unique per environment.
- [ ] `DATABASE_URL`, `RESEND_API_KEY`, `HUB_API_TOKEN` are marked **Sensitive**.
- [ ] No secrets committed (use `.env.local` locally — it is git-ignored).
- [ ] Rotate any credential that was ever shared in plaintext.
- [ ] Custom domain served over HTTPS (Vercel-managed cert); cookies are
      `Secure` + `httpOnly` + `SameSite=Lax` in production.
- [ ] Root admin password stored in a password manager.

---

## 11. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Users page says "database not configured" | `DATABASE_URL` missing in the runtime env. |
| "Create root admin" never appears | A user already exists, or DB unreachable. Check `GET /api/auth/setup-status`. |
| Verification email not received | `RESEND_API_KEY`/`RESEND_FROM` unset or domain unverified; check server logs for the link. |
| Domain stuck "Invalid Configuration" in Vercel | CNAME not propagated, or Cloudflare proxy is **on** — switch to **DNS only**. |
| Verification links point to `localhost` | Set `APP_URL=https://admin.matrixhub.io` and redeploy. |
| Login works with `admin/admin` unexpectedly | `DATABASE_URL` not set, so legacy fallback is active. Configure the DB. |
