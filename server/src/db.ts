import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool({ connectionString: config.databaseUrl });

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const migrationsDir = join(__dirname, '..', 'db', 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await pool.query('SELECT 1 FROM schema_migrations WHERE id = $1', [file]);
    if (rows.length > 0) continue;

    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`Applied migration: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export async function seedAdmin(): Promise<void> {
  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [config.adminEmail]);
  if (rows.length > 0) {
    await pool.query(
      `UPDATE profiles SET is_admin = true, is_moderator = true, updated_at = now()
       WHERE user_id = $1`,
      [rows[0].id],
    );
    return;
  }

  const passwordHash = await bcrypt.hash(config.adminPassword, 12);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
      [config.adminEmail, passwordHash],
    );
    const userId = userResult.rows[0].id as string;
    await client.query(
      `INSERT INTO profiles (user_id, username, display_name, is_admin, is_moderator)
       VALUES ($1, $2, $3, true, true)`,
      [userId, config.adminUsername, 'System Administrator'],
    );
    await client.query('COMMIT');
    console.log(`Seeded admin user: ${config.adminEmail}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
