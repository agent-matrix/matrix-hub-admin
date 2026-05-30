// Seed the single ROOT admin for an on-prem MatrixHub instance.
//
//   ADMIN_EMAIL=root@matrixhub.io ADMIN_PASSWORD='strongpass' \
//   ADMIN_NAME='Root' ADMIN_TENANT='MatrixHub' npm run db:seed-admin
//
// No-op (refuses) if any user already exists — there is only ever one root.
// Use this when you'd rather not expose the first-run web setup screen.

import { Pool, neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import ws from 'ws';

// Provide a WebSocket implementation for Node runtimes that lack a global one.
neonConfig.webSocketConstructor = globalThis.WebSocket ?? ws;

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('✗ DATABASE_URL is not set.');
  process.exit(1);
}

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || 'Root Administrator';
const tenantName = process.env.ADMIN_TENANT || 'MatrixHub';

if (!email || !password) {
  console.error('✗ Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars).');
  process.exit(1);
}
if (password.length < 8) {
  console.error('✗ ADMIN_PASSWORD must be at least 8 characters.');
  process.exit(1);
}

const slug =
  tenantName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'matrixhub';

const pool = new Pool({ connectionString });

async function main() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT count(*)::int AS n FROM users');
    if (rows[0].n > 0) {
      console.error('✗ A user already exists — root admin can only be seeded on a fresh instance.');
      process.exit(2);
    }

    const password_hash = await bcrypt.hash(password, 12);
    await client.query('BEGIN');
    const tenant = (
      await client.query('INSERT INTO tenants (slug, name) VALUES ($1, $2) RETURNING id', [
        slug,
        tenantName,
      ])
    ).rows[0];
    const user = (
      await client.query(
        `INSERT INTO users (email, password_hash, full_name, status, email_verified, is_superadmin)
         VALUES ($1, $2, $3, 'active', true, true) RETURNING id`,
        [email, password_hash, name]
      )
    ).rows[0];
    await client.query(
      `INSERT INTO memberships (tenant_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [tenant.id, user.id]
    );
    await client.query('COMMIT');
    console.log(`✓ Root admin created: ${email} (workspace "${tenantName}").`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('✗ Seed error:', err.message || err);
  process.exit(1);
});
