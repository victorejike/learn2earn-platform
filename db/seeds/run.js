#!/usr/bin/env node
// Seeds development database with FAKE data only. Never uses real student info.
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Seeding dev database with fake data...');

    const { rows: [org] } = await client.query(
      "SELECT id FROM organizations WHERE slug = '1talent'"
    );
    if (!org) throw new Error('Default 1talent organization is missing. Run migrations first.');

    const { rows: [campus] } = await client.query(
      "SELECT id FROM campuses WHERE org_id = $1 AND slug = 'lagos'",
      [org.id]
    );
    if (!campus) throw new Error('Default Lagos campus is missing. Run migrations first.');

    const passwordHash = await bcrypt.hash('dev-password-123', 10);

    const users = [
      ['admin', 'admin@1talent.local', 'Platform Admin', 'admin', 0, 0, 999, 1.00],
      ['head.campus', 'head@1talent.local', 'Campus Head', 'head_of_campus', 0, 0, 100, 1.00],
      ['staff.one', 'staff1@1talent.local', 'Staff Member One', 'campus_staff', 0, 0, 50, 1.00],
      ['victor.ejike', 'victor@1talent.local', 'Victor Ejike', 'student', 1200, 3, 8, 1.20],
      ['amara.obi', 'amara@1talent.local', 'Amara Obi', 'student', 850, 2, 5, 0.95],
      ['chidi.nwosu', 'chidi@1talent.local', 'Chidi Nwosu', 'student', 450, 1, 3, 0.80],
      ['fatima.ali', 'fatima@1talent.local', 'Fatima Ali', 'student', 2100, 5, 12, 1.40],
      ['emeka.james', 'emeka@1talent.local', 'Emeka James', 'student', 100, 0, 1, 0.60],
    ];

    for (const [username, email, fullName, role, xp, level, points, ratio] of users) {
      await client.query(
        `INSERT INTO users
          (username, email, password_hash, role, status, full_name, email_verified,
           id_verified, xp_total, level, correction_points, audit_ratio, org_id, campus_id)
         VALUES ($1, $2, $3, $4, 'active', $5, true, true, $6, $7, $8, $9, $10, $11)
         ON CONFLICT DO NOTHING`,
        [username, email, passwordHash, role, fullName, xp, level, points, ratio, org.id, campus.id]
      );
    }

    const projects = [
      ['hello-world', 'Hello World', 'Your first program. Print "Hello, World!" to stdout.', 50],
      ['calculator', 'Basic Calculator', 'Build a CLI calculator supporting +, -, *, /.', 100],
      ['todo-cli', 'Todo CLI App', 'Build a persistent command-line todo application.', 150],
      ['http-server', 'HTTP Server', 'Build a basic HTTP server from scratch.', 300],
    ];

    for (const [slug, title, description, xp] of projects) {
      await client.query(
        `INSERT INTO projects (slug, title, description, instructions, xp_reward, rubric, org_id)
         VALUES ($1, $2, $3, $3, $4, '[]', $5)
         ON CONFLICT (slug) DO NOTHING`,
        [slug, title, description, xp, org.id]
      );
    }

    await client.query(
      `INSERT INTO cohorts
        (name, description, cohort_type, status, starts_at, ends_at, max_capacity, org_id, campus_id)
       SELECT 'Piscine Batch 001', 'First 1Talent Piscine cohort', 'piscine', 'upcoming',
              NOW() + INTERVAL '7 days', NOW() + INTERVAL '35 days', 30, $1, $2
       WHERE NOT EXISTS (
         SELECT 1 FROM cohorts WHERE org_id = $1 AND campus_id = $2 AND name = 'Piscine Batch 001'
       )`,
      [org.id, campus.id]
    );

    // A fake submitted applicant gives staff a useful admissions demo on first run.
    await client.query(
      `INSERT INTO users
        (username, email, password_hash, role, status, full_name, email_verified,
         org_id, campus_id, phone)
       VALUES ('ada.applicant', 'ada.applicant@1talent.local', $1, 'applicant',
               'pending_verification', 'Ada Okafor', true, $2, $3, '+2348000000000')
       ON CONFLICT DO NOTHING`,
      [passwordHash, org.id, campus.id]
    );

    await client.query(
      `INSERT INTO admission_applications
        (user_id, org_id, campus_id, date_of_birth, country, city,
         highest_education, coding_experience, motivation, availability,
         referral_source, terms_accepted, data_consent)
       SELECT u.id, $1, $2, DATE '2002-05-14', 'Nigeria', 'Lagos',
              'secondary', 'beginner',
              'I want to learn engineering by building useful systems with peers, receiving direct feedback, and developing the discipline to solve unfamiliar problems.',
              'full_time', 'community', true, true
       FROM users u
       WHERE u.org_id = $1 AND u.username = 'ada.applicant'
       ON CONFLICT (user_id) DO NOTHING`,
      [org.id, campus.id]
    );

    await client.query('COMMIT');
    console.log('Seed complete. Dev credentials: any seeded email / dev-password-123');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(error => {
  console.error(error);
  process.exit(1);
});
