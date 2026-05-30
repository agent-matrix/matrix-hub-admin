// MatrixHub database migration runner.
//
//   DATABASE_URL=postgres://... node scripts/migrate.mjs
//   npm run db:migrate
//
// Applies every *.sql file in /migrations in lexical order, exactly once,
// tracking applied files in a `schema_migrations` table. Re-running is safe.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// The Neon serverless driver talks to the DB over a WebSocket. Node < 21 has no
// global WebSocket (e.g. the Node 20 GitHub Actions runner), so provide one.
neonConfig.webSocketConstructor = globalThis.WebSocket ?? ws;

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('✗ DATABASE_URL is not set. Export it (Neon connection string) and retry.');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const applied = new Set(
      (await client.query('SELECT filename FROM schema_migrations')).rows.map((r) => r.filename)
    );

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`• skip   ${file} (already applied)`);
        continue;
      }
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
      process.stdout.write(`→ apply  ${file} ... `);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log('done');
        ran += 1;
      } catch (err) {
        await client.query('ROLLBACK');
        console.log('FAILED');
        throw err;
      }
    }
    console.log(`\n✓ Migrations complete (${ran} applied, ${files.length - ran} skipped).`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('\n✗ Migration error:', err.message || err);
  process.exit(1);
});
