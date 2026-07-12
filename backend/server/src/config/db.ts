import { Pool, PoolClient, QueryResultRow } from 'pg';
import { env, isProd } from './env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err);
});

/** Parameterized query helper — the ONLY way SQL is executed (SQL-injection safe). */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const start = Date.now();
  const result = await pool.query<T>(text, params as never[]);
  if (!isProd && Date.now() - start > 200) {
    console.warn(`[db] slow query (${Date.now() - start}ms):`, text.slice(0, 120));
  }
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Run a set of statements atomically. Used by every multi-table workflow
 * (allocation, transfer, maintenance, audit) so state can never be half-written.
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
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
