#!/usr/bin/env node
// Simple migration runner — reads SQL files in order and applies unapplied ones.
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows: applied } = await client.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(applied.map(r => r.version));

    const files = readdirSync(__dirname)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const version = file.replace('.sql', '');
      if (appliedVersions.has(version)) {
        console.log(`  ✓ ${version} (already applied)`);
        continue;
      }

      console.log(`  → Applying ${version}...`);
      const sql = readFileSync(join(__dirname, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING',
          [version]
        );
        await client.query('COMMIT');
        console.log(`  ✓ ${version} applied`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ✗ ${version} FAILED:`, err.message);
        process.exit(1);
      }
    }
    console.log('Migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
