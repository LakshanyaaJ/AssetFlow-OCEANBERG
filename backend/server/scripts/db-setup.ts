/**
 * One-command database bootstrap:
 *   npm run db:setup   — apply schema + indexes + seed to an empty database
 *   npm run db:reset   — drop everything first, then re-apply
 */
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DB_DIR = path.resolve(__dirname, '..', '..', 'database');
const RESET = process.argv.includes('--reset');

function readSql(file: string): string {
  return fs.readFileSync(path.join(DB_DIR, file), 'utf8');
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set (copy .env.example to .env)');

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    if (RESET) {
      console.log('⚠️  Dropping public schema…');
      await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    }
    console.log('Applying schema.sql…');
    await client.query(readSql('schema.sql'));
    console.log('Applying indexes.sql…');
    await client.query(readSql('indexes.sql'));
    console.log('Applying seed.sql…');
    await client.query(readSql('seed.sql'));
    console.log('✅ Database ready. Demo logins use password: Password@123');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ db-setup failed:', err.message);
  process.exit(1);
});
