import fs from 'fs';
import path from 'path';
import { getPool } from '../config/database.js';

async function run() {
  const pool = getPool();
  const sqlPath = path.resolve('./src/db/init.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('init.sql not found at', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, { encoding: 'utf8' });

  try {
    console.log('Running migration SQL (split statements)...');
    // Split statements by semicolon and execute sequentially to allow ignoring "already exists" errors
    const statements = sql
      .split(/;\s*\n/) // split on semicolon + newline (approx)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (err) {
        // Ignore 'already exists' errors to make migrate idempotent
        const msg = (err && err.message) ? err.message : '';
        if (msg.includes('already exists') || err.code === '42P07') {
          console.warn('Warning (ignored):', msg.split('\n')[0]);
          continue;
        }
        console.error('Statement failed:', stmt.substring(0, 120));
        throw err;
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
