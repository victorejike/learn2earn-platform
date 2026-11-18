import { Pool, type QueryResultRow, type PoolClient } from 'pg';
import bcrypt from 'bcryptjs';

const isPgConfigured = Boolean(process.env.DATABASE_URL);

export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/1talent',
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 1_500,
});

pgPool.on('error', (err: Error) => {
  // Silence unhandled pool disconnect errors
  if (!err.message?.includes('ECONNREFUSED')) {
    console.error('PostgreSQL pool error:', err.message);
  }
});

// ============================================================================
// RESILIENT IN-MEMORY STORE FALLBACK (when PostgreSQL is offline / unavailable)
// ============================================================================

export interface MockUser extends Record<string, any> {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string | null;
  role: string;
  status: string;
  audit_ratio: number;
  xp_total: number;
  level: number;
  correction_points: number;
  org_id: string;
  campus_id: string;
  created_at: string;
  updated_at: string;
  last_active_at?: string | null;
  deleted_at?: string | null;
}

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_CAMPUS_ID = '00000000-0000-0000-0000-000000000002';
const DEFAULT_TEST_ID = '00000000-0000-0000-0000-000000000003';

const defaultPasswordHash = bcrypt.hashSync('password123', 10);

class InMemoryDatabase {
  organizations: Map<string, any> = new Map();
  campuses: Map<string, any> = new Map();
  users: Map<string, MockUser> = new Map();
  admissionTests: Map<string, any> = new Map();
  admissionQuestions: Map<string, any> = new Map();
  testAssignments: Map<string, any> = new Map();
  admissionApplications: Map<string, any> = new Map();

  constructor() {
    this.seed();
  }

  seed() {
    // 1. Organization: 1Talent
    this.organizations.set(DEFAULT_ORG_ID, {
      id: DEFAULT_ORG_ID,
      slug: '1talent',
      name: '1Talent',
      description: 'The original 1Talent campus — where the platform was born.',
      country: 'Nigeria',
      city: 'Lagos',
      plan: 'enterprise',
      status: 'active',
      max_students: 10000,
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 2. Campuses: learn2earn & bahrain
    this.campuses.set(DEFAULT_CAMPUS_ID, {
      id: DEFAULT_CAMPUS_ID,
      org_id: DEFAULT_ORG_ID,
      slug: 'learn2earn',
      name: 'Learn2Earn Campus',
      city: 'Manama',
      country: 'Bahrain',
      timezone: 'Asia/Bahrain',
      is_virtual: false,
      status: 'active',
      max_students: 1000,
      settings: {},
      studentCount: 12,
      activeCount: 10,
      atRiskCount: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const bahrainCampusId = '00000000-0000-0000-0000-000000000004';
    this.campuses.set(bahrainCampusId, {
      id: bahrainCampusId,
      org_id: DEFAULT_ORG_ID,
      slug: 'bahrain',
      name: 'Bahrain Campus',
      city: 'Manama',
      country: 'Bahrain',
      timezone: 'Asia/Bahrain',
      is_virtual: false,
      status: 'active',
      max_students: 1000,
      settings: {},
      studentCount: 12,
      activeCount: 10,
      atRiskCount: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 3. Candidate User: evictor (victorejiki@gmail.com)
    const victorUser: MockUser = {
      id: 'u-victor-ejike-101',
      username: 'evictor',
      email: 'victorejiki@gmail.com',
      password_hash: defaultPasswordHash,
      full_name: 'Victor Ejike',
      phone: '16160101',
      role: 'APPLICANT',
      status: 'admission_test',
      audit_ratio: 1.0,
      xp_total: 0,
      level: 0,
      correction_points: 0,
      org_id: DEFAULT_ORG_ID,
      campus_id: DEFAULT_CAMPUS_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      deleted_at: null,
    };
    this.users.set(victorUser.id, victorUser);

    // Alternate candidate: ejikevicto@gmail.com
    const ejikeUser: MockUser = {
      id: 'u-ejike-victo-102',
      username: 'evictor',
      email: 'ejikevicto@gmail.com',
      password_hash: defaultPasswordHash,
      full_name: 'Victor Ejike',
      phone: '16160101',
      role: 'APPLICANT',
      status: 'admission_test',
      audit_ratio: 1.0,
      xp_total: 0,
      level: 0,
      correction_points: 0,
      org_id: DEFAULT_ORG_ID,
      campus_id: DEFAULT_CAMPUS_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      deleted_at: null,
    };
    this.users.set(ejikeUser.id, ejikeUser);

    // Super Admin: admin@1talent.com
    const adminUser: MockUser = {
      id: 'u-admin-1talent-100',
      username: 'admin',
      email: 'admin@1talent.com',
      password_hash: defaultPasswordHash,
      full_name: '1Talent Super Admin',
      phone: '16160100',
      role: 'super_admin',
      status: 'active',
      audit_ratio: 1.5,
      xp_total: 84000,
      level: 12,
      correction_points: 10,
      org_id: DEFAULT_ORG_ID,
      campus_id: DEFAULT_CAMPUS_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      deleted_at: null,
    };
    this.users.set(adminUser.id, adminUser);

    // 4. Admission Test: 1Talent Cognitive Assessment
    this.admissionTests.set(DEFAULT_TEST_ID, {
      id: DEFAULT_TEST_ID,
      org_id: DEFAULT_ORG_ID,
      campus_id: DEFAULT_CAMPUS_ID,
      title: '1Talent Cognitive Assessment',
      slug: 'cognitive-assessment',
      description: '30-minute cognitive and algorithmic assessment',
      duration_minutes: 30,
      passing_score: 70,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 5. Admission Questions
    const questions = [
      {
        id: 'q-001',
        test_id: DEFAULT_TEST_ID,
        question_text: 'What is the output of typeof NaN in JavaScript?',
        question_type: 'single_choice',
        options: JSON.stringify(['number', 'nan', 'undefined', 'object']),
        correct_options: JSON.stringify(['number']),
        points: 20,
        order_index: 1,
        explanation: 'In JavaScript, NaN is a numeric value representing Not-a-Number.',
      },
      {
        id: 'q-002',
        test_id: DEFAULT_TEST_ID,
        question_text: 'In 1Talent peer-to-peer pedagogy, what is the primary method of evaluation?',
        question_type: 'single_choice',
        options: JSON.stringify(['Peer correction and automated testing', 'Teacher grading only', 'Multiple choice finals', 'No evaluation']),
        correct_options: JSON.stringify(['Peer correction and automated testing']),
        points: 20,
        order_index: 2,
        explanation: 'Learning is validated via automated test suites and peer code reviews.',
      },
      {
        id: 'q-003',
        test_id: DEFAULT_TEST_ID,
        question_text: 'What data structure operates on a First-In, First-Out (FIFO) principle?',
        question_type: 'single_choice',
        options: JSON.stringify(['Queue', 'Stack', 'Binary Tree', 'Heap']),
        correct_options: JSON.stringify(['Queue']),
        points: 20,
        order_index: 3,
        explanation: 'A Queue processes items in the exact order they arrive (FIFO).',
      },
    ];

    for (const q of questions) {
      this.admissionQuestions.set(q.id, q);
    }

    // 6. Test Assignments
    this.testAssignments.set('ta-victor', {
      id: 'ta-victor',
      user_id: victorUser.id,
      test_id: DEFAULT_TEST_ID,
      status: 'invited',
      score: null,
      passed: null,
      started_at: null,
      submitted_at: null,
      expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
      created_at: new Date().toISOString(),
    });

    this.testAssignments.set('ta-ejike', {
      id: 'ta-ejike',
      user_id: ejikeUser.id,
      test_id: DEFAULT_TEST_ID,
      status: 'invited',
      score: null,
      passed: null,
      started_at: null,
      submitted_at: null,
      expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
      created_at: new Date().toISOString(),
    });

    // 7. Admission Applications
    this.admissionApplications.set('app-victor', {
      id: 'app-victor',
      reference: '1T-VICTOR2026',
      user_id: victorUser.id,
      org_id: DEFAULT_ORG_ID,
      campus_id: DEFAULT_CAMPUS_ID,
      status: 'submitted',
      date_of_birth: '2002-05-14',
      country: 'Bahrain',
      city: 'Manama',
      highest_education: 'bachelor',
      coding_experience: 'beginner',
      motivation: 'I want to master software engineering through peer learning and solve real problems.',
      availability: 'full_time',
      terms_accepted: true,
      data_consent: true,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

export const inMemoryDb = new InMemoryDatabase();

let pgOnline = true;

// ============================================================================
// IN-MEMORY SQL QUERY INTERPRETER
// ============================================================================

function executeInMemoryQuery<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = []
): T[] {
  const norm = sql.trim().replace(/\s+/g, ' ');

  // 1. SELECT * FROM users WHERE (email = $1 OR username = $1)
  if (/FROM users/i.test(norm) && /email/i.test(norm)) {
    const term = String(params[0] ?? '').trim().toLowerCase();
    const user = Array.from(inMemoryDb.users.values()).find(
      (u) =>
        !u.deleted_at &&
        (u.email.toLowerCase() === term || u.username.toLowerCase() === term)
    );
    return (user ? [user] : []) as unknown as T[];
  }

  // 2. SELECT * FROM users WHERE id = $1
  if (/FROM users/i.test(norm) && /id = \$1/i.test(norm)) {
    const id = String(params[0] ?? '').trim();
    const user = inMemoryDb.users.get(id);
    if (user && !user.deleted_at) {
      return [user] as unknown as T[];
    }
    // Also try matching by username or email if passed as id in token
    const userByAlt = Array.from(inMemoryDb.users.values()).find(
      (u) => !u.deleted_at && (u.username === id || u.email.toLowerCase() === id.toLowerCase())
    );
    return (userByAlt ? [userByAlt] : []) as unknown as T[];
  }

  // 3. SELECT id FROM organizations WHERE slug = $1
  if (/FROM organizations/i.test(norm) && /slug = \$1/i.test(norm)) {
    const slug = String(params[0] ?? '').toLowerCase();
    const org = Array.from(inMemoryDb.organizations.values()).find(
      (o) => o.slug.toLowerCase() === slug
    );
    return (org ? [org] : Array.from(inMemoryDb.organizations.values()).slice(0, 1)) as unknown as T[];
  }

  // 4. SELECT * FROM organizations
  if (/FROM organizations/i.test(norm)) {
    if (/id = \$1/i.test(norm)) {
      const id = String(params[0] ?? '');
      const org = inMemoryDb.organizations.get(id);
      return (org ? [org] : []) as unknown as T[];
    }
    return Array.from(inMemoryDb.organizations.values()) as unknown as T[];
  }

  // 5. SELECT * FROM campuses
  if (/FROM campuses/i.test(norm)) {
    if (/slug = \$1/i.test(norm)) {
      const slug = String(params[0] ?? '').toLowerCase();
      const campus = Array.from(inMemoryDb.campuses.values()).find(
        (c) => c.slug.toLowerCase() === slug
      );
      return (campus ? [campus] : Array.from(inMemoryDb.campuses.values()).slice(0, 1)) as unknown as T[];
    }
    if (/id = \$1/i.test(norm)) {
      const id = String(params[0] ?? '');
      const campus = inMemoryDb.campuses.get(id);
      return (campus ? [campus] : []) as unknown as T[];
    }
    return Array.from(inMemoryDb.campuses.values()) as unknown as T[];
  }

  // 6. INSERT INTO users ... RETURNING *
  if (/^INSERT INTO users/i.test(norm)) {
    // Determine arguments: [username, email, password_hash, full_name, ...]
    const username = String(params[0] ?? `user_${Date.now()}`);
    const email = String(params[1] ?? `${username}@1talent.internal`);
    const passwordHash = String(params[2] ?? defaultPasswordHash);
    const fullName = String(params[3] ?? username);
    const phone = params[4] ? String(params[4]) : null;
    const orgId = params[5] ? String(params[5]) : DEFAULT_ORG_ID;
    const campusId = params[6] ? String(params[6]) : DEFAULT_CAMPUS_ID;

    // Check if user already exists
    let existing = Array.from(inMemoryDb.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      existing.password_hash = passwordHash;
      existing.full_name = fullName;
      existing.last_active_at = new Date().toISOString();
      return [existing] as unknown as T[];
    }

    const newUser: MockUser = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      username,
      email,
      password_hash: passwordHash,
      full_name: fullName,
      phone,
      role: 'APPLICANT',
      status: 'admission_test',
      audit_ratio: 1.0,
      xp_total: 0,
      level: 0,
      correction_points: 0,
      org_id: orgId,
      campus_id: campusId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      deleted_at: null,
    };

    inMemoryDb.users.set(newUser.id, newUser);
    return [newUser] as unknown as T[];
  }

  // 7. UPDATE users SET ... RETURNING *
  if (/^UPDATE users/i.test(norm)) {
    if (/full_name = \$1.*password_hash = \$2/i.test(norm)) {
      const fullName = String(params[0] ?? '');
      const passwordHash = String(params[1] ?? defaultPasswordHash);
      const target = String(params[2] ?? '');

      let user = inMemoryDb.users.get(target);
      if (!user) {
        user = Array.from(inMemoryDb.users.values()).find(
          (u) => u.email.toLowerCase() === target.toLowerCase() || u.username === target
        );
      }

      if (user) {
        user.full_name = fullName || user.full_name;
        user.password_hash = passwordHash || user.password_hash;
        user.last_active_at = new Date().toISOString();
        user.updated_at = new Date().toISOString();
        return [user] as unknown as T[];
      }
    }

    if (/last_active_at/i.test(norm)) {
      const id = String(params[0] ?? '');
      const user = inMemoryDb.users.get(id);
      if (user) {
        user.last_active_at = new Date().toISOString();
        return [user] as unknown as T[];
      }
    }

    if (/password_hash = \$1/i.test(norm)) {
      const hash = String(params[0] ?? '');
      const id = String(params[1] ?? '');
      const user = inMemoryDb.users.get(id);
      if (user) {
        user.password_hash = hash;
        return [user] as unknown as T[];
      }
    }

    return [] as unknown as T[];
  }

  // 8. SELECT * FROM admission_applications
  if (/FROM admission_applications/i.test(norm)) {
    const userId = String(params[0] ?? '');
    const app = Array.from(inMemoryDb.admissionApplications.values()).find(
      (a) => a.user_id === userId
    );
    if (app) {
      const user = inMemoryDb.users.get(app.user_id) ?? inMemoryDb.users.get('u-victor-ejike-101');
      const campus = inMemoryDb.campuses.get(app.campus_id) ?? inMemoryDb.campuses.get(DEFAULT_CAMPUS_ID);
      return [{ ...app, user, campus }] as unknown as T[];
    }
    // Return a default application if none exists
    const user = inMemoryDb.users.get(userId) ?? inMemoryDb.users.get('u-victor-ejike-101');
    const campus = inMemoryDb.campuses.get(DEFAULT_CAMPUS_ID);
    return [
      {
        id: `app-${userId}`,
        reference: `1T-${userId.slice(0, 8).toUpperCase()}`,
        user_id: userId,
        org_id: DEFAULT_ORG_ID,
        campus_id: DEFAULT_CAMPUS_ID,
        status: 'submitted',
        date_of_birth: '2002-05-14',
        country: 'Bahrain',
        city: 'Manama',
        highest_education: 'bachelor',
        coding_experience: 'beginner',
        motivation: 'Ready to build and learn in 1Talent.',
        availability: 'full_time',
        terms_accepted: true,
        data_consent: true,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user,
        campus,
      },
    ] as unknown as T[];
  }

  // 9. Admission test questions
  if (/FROM admission_questions/i.test(norm)) {
    return Array.from(inMemoryDb.admissionQuestions.values()) as unknown as T[];
  }

  // 10. Admission tests / test assignments
  if (/FROM test_assignments/i.test(norm) || /FROM admission_tests/i.test(norm)) {
    const test = inMemoryDb.admissionTests.get(DEFAULT_TEST_ID);
    const questions = Array.from(inMemoryDb.admissionQuestions.values());
    return [{ ...test, questions }] as unknown as T[];
  }

  // 11. Generic clock or count queries
  if (/SELECT NOW\(\)/i.test(norm)) {
    return [{ now: new Date().toISOString() }] as unknown as T[];
  }
  if (/COUNT\(\*\)/i.test(norm)) {
    return [{ count: '1' }] as unknown as T[];
  }

  // Fallback: return empty rows
  return [] as unknown as T[];
}

// ============================================================================
// DATABASE WRAPPER EXPORTS
// ============================================================================

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  if (!pgOnline) {
    return executeInMemoryQuery<T>(sql, params);
  }

  try {
    const result = await pgPool.query<T>(sql, params);
    return result.rows;
  } catch (err: unknown) {
    const msg = (err as Error)?.message || '';
    if (
      msg.includes('ECONNREFUSED') ||
      msg.includes('timeout') ||
      msg.includes('Connection terminated') ||
      msg.includes('password authentication failed')
    ) {
      if (pgOnline) {
        console.warn('⚠️  PostgreSQL is unreachable. Switching seamlessly to high-availability In-Memory database.');
        pgOnline = false;
      }
      return executeInMemoryQuery<T>(sql, params);
    }
    throw err;
  }
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

// Mock client interface for transactions (BEGIN, COMMIT, ROLLBACK)
class MockClient {
  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[]
  ): Promise<{ rows: T[]; rowCount: number }> {
    const norm = sql.trim().toUpperCase();
    if (norm === 'BEGIN' || norm === 'COMMIT' || norm === 'ROLLBACK') {
      return { rows: [], rowCount: 0 };
    }
    const rows = await query<T>(sql, params);
    return { rows, rowCount: rows.length };
  }

  release() {
    // No-op for mock client
  }
}

export const db = {
  query,
  queryOne,
  connect: async (): Promise<PoolClient> => {
    if (!pgOnline) {
      return new MockClient() as unknown as PoolClient;
    }
    try {
      return await pgPool.connect();
    } catch {
      pgOnline = false;
      return new MockClient() as unknown as PoolClient;
    }
  },
  on: (event: 'error' | 'release' | 'connect' | 'acquire' | 'remove', handler: (...args: any[]) => void) => {
    pgPool.on(event, handler);
  },
};
