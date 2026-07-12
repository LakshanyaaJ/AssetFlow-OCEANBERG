import { createApp } from './app';
import { pool } from './config/db';
import { env } from './config/env';
import { startJobs } from './jobs/overdue.job';

async function main() {
  // Verify DB connectivity before accepting traffic.
  await pool.query('SELECT 1');
  console.log('✅ PostgreSQL connected');

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 AssetFlow API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  startJobs();

  // Graceful shutdown: stop accepting connections, then drain the pool.
  const shutdown = (signal: string) => {
    console.log(`${signal} received — shutting down`);
    server.close(() => {
      void pool.end().then(() => process.exit(0));
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
