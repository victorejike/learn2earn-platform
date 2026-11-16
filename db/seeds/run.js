#!/usr/bin/env node
// Seeds development database with FAKE data only. Never uses real student info.
import pg from 'pg';
import { createHash } from 'crypto';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function fakePasswordHash(password) {
  return '$2b$10$' + createHash('sha256').update(password).digest('hex').substring(0, 53);
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding dev database with fake data...');

    // Fake admin user
    await client.query(`
      INSERT INTO users (username, email, password_hash, role, status, full_name, email_verified, id_verified, xp_total, level, correction_points, audit_ratio)
      VALUES
        ('admin', 'admin@1talent.local', $1, 'admin', 'active', 'Platform Admin', true, true, 0, 0, 999, 1.00),
        ('head.campus', 'head@1talent.local', $1, 'head_of_campus', 'active', 'Campus Head', true, true, 0, 0, 100, 1.00),
        ('staff.one', 'staff1@1talent.local', $1, 'campus_staff', 'active', 'Staff Member One', true, true, 0, 0, 50, 1.00)
      ON CONFLICT (username) DO NOTHING
    `, [fakePasswordHash('dev-password-123')]);

    // Fake students
    const students = [
      ['victor.ejike', 'victor@1talent.local', 'Victor Ejike', 1200, 3, 8, 1.20],
      ['amara.obi', 'amara@1talent.local', 'Amara Obi', 850, 2, 5, 0.95],
      ['chidi.nwosu', 'chidi@1talent.local', 'Chidi Nwosu', 450, 1, 3, 0.80],
      ['fatima.ali', 'fatima@1talent.local', 'Fatima Ali', 2100, 5, 12, 1.40],
      ['emeka.james', 'emeka@1talent.local', 'Emeka James', 100, 0, 1, 0.60],
    ];

    for (const [username, email, full_name, xp, level, cp, ratio] of students) {
      await client.query(`
        INSERT INTO users (username, email, password_hash, role, status, full_name, email_verified, id_verified, xp_total, level, correction_points, audit_ratio)
        VALUES ($1, $2, $3, 'student', 'active', $4, true, true, $5, $6, $7, $8)
        ON CONFLICT (username) DO NOTHING
      `, [username, email, fakePasswordHash('dev-password-123'), full_name, xp, level, cp, ratio]);
    }

    // Seed sample projects
    const projects = [
      ['hello-world', 'Hello World', 'Your first program. Print "Hello, World!" to stdout.', 50, '[]'],
      ['calculator', 'Basic Calculator', 'Build a CLI calculator supporting +, -, *, /.', 100, '[{"id":"hello-world"}]'],
      ['todo-cli', 'Todo CLI App', 'Build a persistent command-line todo application.', 150, '[{"id":"calculator"}]'],
      ['http-server', 'HTTP Server', 'Build a basic HTTP server from scratch.', 300, '[{"id":"todo-cli"}]'],
    ];

    for (const [slug, title, description, xp, deps] of projects) {
      await client.query(`
        INSERT INTO projects (slug, title, description, instructions, xp_reward, rubric)
        VALUES ($1, $2, $3, $3, $4, '[]')
        ON CONFLICT (slug) DO NOTHING
      `, [slug, title, description, xp]);
    }

    // Create a sample Piscine cohort
    await client.query(`
      INSERT INTO cohorts (name, description, cohort_type, status, starts_at, ends_at, max_capacity)
      VALUES ('Piscine Batch 001', 'First 1Talent Piscine cohort', 'piscine', 'upcoming', NOW() + INTERVAL '7 days', NOW() + INTERVAL '35 days', 30)
      ON CONFLICT DO NOTHING
    `);

    console.log('Seed complete. Dev credentials: any seeded email / dev-password-123');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => { console.error(err); process.exit(1); });
