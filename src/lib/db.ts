import {
  Pool,
  neonConfig,
  type PoolClient,
  type QueryResult,
  type QueryResultRow,
} from '@neondatabase/serverless';
import ws from 'ws';

// The Neon serverless Pool uses a WebSocket for sessions/transactions. Provide
// a constructor for Node runtimes without a global WebSocket (Node < 21). Run
// simple (non-transactional) queries over HTTP fetch where possible.
if (!neonConfig.webSocketConstructor) {
  neonConfig.webSocketConstructor = (globalThis as { WebSocket?: unknown }).WebSocket ?? ws;
}
neonConfig.poolQueryViaFetch = true;

/**
 * Neon Postgres connection pool (singleton across hot reloads / serverless
 * invocations). Uses the pooled connection string from DATABASE_URL.
 */
declare global {
  // eslint-disable-next-line no-var
  var __matrixHubPool: Pool | undefined;
}

function makePool(): Pool {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not configured. Set the Neon connection string in your environment.'
    );
  }
  return new Pool({ connectionString });
}

export function getPool(): Pool {
  if (!global.__matrixHubPool) {
    global.__matrixHubPool = makePool();
  }
  return global.__matrixHubPool;
}

/** True when a database connection string is configured. */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

/** Run a parameterized query and return the rows. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params as never[]);
}

/** Convenience: first row or null. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const r = await query<T>(text, params);
  return r.rows[0] ?? null;
}

/** Run a set of statements inside a single transaction. */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
