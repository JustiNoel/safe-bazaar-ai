import bcrypt from 'bcryptjs';
import { getPool } from '../config/database.js';

async function run() {
  const pool = getPool();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@safebazaar.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';

  const userEmail = process.env.SEED_USER_EMAIL || 'user@example.com';
  const userPassword = process.env.SEED_USER_PASSWORD || 'user123';

  try {
    console.log('Hashing passwords...');
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const userHash = await bcrypt.hash(userPassword, 10);

    console.log('Upserting admin user:', adminEmail);
    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, subscription_tier, is_admin, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_admin = EXCLUDED.is_admin, subscription_tier = EXCLUDED.subscription_tier`,
      [adminEmail, adminHash, 'Admin', 'User', 'premium', true, true, true]
    );

    console.log('Upserting sample free user:', userEmail);
    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, subscription_tier, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, subscription_tier = EXCLUDED.subscription_tier`,
      [userEmail, userHash, 'Test', 'User', 'free', true, true]
    );

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

run();
