import bcrypt from 'bcryptjs';
import type { PoolClient } from 'pg';
import { z } from 'zod';
import type { Context, JwtPayload } from '../context.js';
import { db, query, queryOne } from '../db.js';
import { gradeAdmissionAnswers } from '../admission/grading.js';
import { signToken } from './auth.js';

type Row = Record<string, any>;

const STAFF_ROLES = new Set(['super_admin', 'admin', 'head_of_campus', 'campus_staff']);
const CAMPUS_SCOPED_ROLES = new Set(['head_of_campus', 'campus_staff']);

const dateOnly = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must use YYYY-MM-DD')
  .refine(value => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed < new Date();
  }, 'Date of birth must be a valid date in the past');

const applicationInputSchema = z.object({
  username: z.string().trim().toLowerCase()
    .min(3).max(30)
    .regex(/^[a-z0-9][a-z0-9._-]*$/, 'Username may contain lowercase letters, numbers, dots, dashes, and underscores'),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  fullName: z.string().trim().min(2).max(255),
  phone: z.string().trim().min(7).max(20).optional().nullable(),
  orgSlug: z.string().trim().toLowerCase().min(1).max(100).default('1talent'),
  campusId: z.string().uuid(),
  dateOfBirth: dateOnly,
  country: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  highestEducation: z.string().trim().min(2).max(100),
  codingExperience: z.string().trim().min(2).max(100),
  motivation: z.string().trim().min(80, 'Tell us a little more about your motivation (at least 80 characters)').max(3000),
  availability: z.string().trim().min(2).max(100),
  referralSource: z.string().trim().max(100).optional().nullable(),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the application terms' }) }),
  dataConsent: z.literal(true, { errorMap: () => ({ message: 'You must consent to application data processing' }) }),
});

const answerInputSchema = z.array(z.object({
  questionId: z.string().uuid(),
  selectedOptions: z.array(z.string().trim().min(1).max(100)).min(1).max(10),
})).max(100);

function requireUser(ctx: Context): JwtPayload {
  if (!ctx.user) throw new Error('Unauthorized');
  return ctx.user;
}

function requireStaff(ctx: Context): JwtPayload {
  const actor = requireUser(ctx);
  if (!STAFF_ROLES.has(actor.role)) throw new Error('Forbidden');
  return actor;
}

function assertApplicationScope(actor: JwtPayload, application: Row): void {
  if (actor.role === 'super_admin') return;
  if (!actor.orgId || actor.orgId !== application.org_id) throw new Error('Forbidden');
  if (CAMPUS_SCOPED_ROLES.has(actor.role)) {
    if (!actor.campusId || actor.campusId !== application.campus_id) throw new Error('Forbidden');
  }
}

function inputError(error: unknown): Error {
  if (error instanceof z.ZodError) {
    return new Error(error.issues[0]?.message ?? 'Invalid input');
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    if ((error as { code?: string }).code === '23505') {
      return new Error('An account with that email or username already exists');
    }
  }

  return error instanceof Error ? error : new Error('Unable to process request');
}

async function fetchApplication(id: string, client?: PoolClient): Promise<Row | null> {
  const sql = `
    SELECT a.*, row_to_json(u.*) AS "user", row_to_json(c.*) AS "campus"
    FROM admission_applications a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN campuses c ON c.id = a.campus_id
    WHERE a.id = $1
  `;

  if (client) {
    const { rows } = await client.query(sql, [id]);
    return rows[0] ?? null;
  }
  return queryOne<Row>(sql, [id]);
}

async function publicQuestions(testId: string, client?: PoolClient): Promise<Row[]> {
  const sql = `
    SELECT
      tq.question_id AS id,
      tq.position,
      tq.question_snapshot->>'prompt' AS prompt,
      tq.question_snapshot->>'type' AS type,
      tq.question_snapshot->'options' AS options,
      (tq.question_snapshot->>'points')::numeric AS points
    FROM admission_test_questions tq
    WHERE tq.test_id = $1
    ORDER BY tq.position ASC
  `;

  if (client) {
    const { rows } = await client.query(sql, [testId]);
    return rows;
  }
  return query<Row>(sql, [testId]);
}

async function testForUser(userId: string): Promise<Row | null> {
  let test = await queryOne<Row>(
    `SELECT t.*
     FROM admission_tests t
     WHERE t.user_id = $1
     ORDER BY t.created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (!test) {
    const user = await queryOne<Row>('SELECT * FROM users WHERE id = $1', [userId]);
    if (user) {
      const questionRows = await query<Row>(
        `SELECT * FROM admission_questions
         WHERE is_active = TRUE
         ORDER BY position ASC`
      );

      if (questionRows.length > 0) {
        const [newTest] = await query<Row>(
          `INSERT INTO admission_tests
             (user_id, status, duration_minutes, pass_score, max_score, invitation_expires_at)
           VALUES ($1, 'invited', 60, 70, 100, NOW() + INTERVAL '7 days')
           RETURNING *`,
          [userId]
        );
        test = newTest;
        for (const question of questionRows) {
          await query(
            `INSERT INTO admission_test_questions
               (test_id, question_id, position, question_snapshot)
             VALUES ($1, $2, $3, jsonb_build_object(
               'prompt', $4::text,
               'type', $5::text,
               'options', $6::jsonb,
               'answerKey', $7::jsonb,
               'points', $8::numeric
             ))`,
            [test.id, question.id, question.position, question.prompt,
             question.type, JSON.stringify(question.options),
             JSON.stringify(question.answer_key), question.points]
          );
        }
      }
    }
  }

  if (!test) return null;
  return {
    ...test,
    questions: test.status === 'in_progress' ? await publicQuestions(test.id) : [],
  };
}

async function expireTest(client: PoolClient, test: Row): Promise<Row> {
  const { rows: [expired] } = await client.query(
    `UPDATE admission_tests
     SET status = 'expired', submitted_at = COALESCE(submitted_at, NOW()),
         score = 0, passed = FALSE,
         feedback = 'The assessment time limit expired before submission.'
     WHERE id = $1
     RETURNING *`,
    [test.id]
  );
  await client.query(
    `UPDATE admission_applications
     SET status = 'rejected'
     WHERE id = $1`,
    [test.application_id]
  );
  await client.query(
    `UPDATE users SET status = 'rejected' WHERE id = $1`,
    [test.user_id]
  );
  await client.query(
    `INSERT INTO notifications (user_id, type, title, body, data)
     VALUES ($1, 'admission.assessment_expired', 'Assessment closed',
             'Your admission assessment closed because its time limit expired.',
             jsonb_build_object('testId', $2::text))`,
    [test.user_id, test.id]
  );
  return { ...expired, questions: [] };
}

export const admissionResolvers = {
  Query: {
    applicationCampuses: async (
      _: unknown,
      { orgSlug = '1talent' }: { orgSlug?: string }
    ) => query<Row>(
      `SELECT c.*, 0 AS "studentCount", 0 AS "activeCount", 0 AS "atRiskCount"
       FROM campuses c
       JOIN organizations o ON o.id = c.org_id
       WHERE o.slug = $1 AND o.status IN ('active', 'trial') AND c.status = 'active'
       ORDER BY c.is_virtual ASC, c.name ASC`,
      [orgSlug.toLowerCase()]
    ),

    myAdmissionApplication: async (_: unknown, __: unknown, ctx: Context) => {
      const actor = requireUser(ctx);
      return queryOne<Row>(
        `SELECT a.*, row_to_json(u.*) AS "user", row_to_json(c.*) AS "campus"
         FROM admission_applications a
         JOIN users u ON u.id = a.user_id
         LEFT JOIN campuses c ON c.id = a.campus_id
         WHERE a.user_id = $1`,
        [actor.userId]
      );
    },

    myAdmissionTest: async (_: unknown, __: unknown, ctx: Context) => {
      const actor = requireUser(ctx);
      return testForUser(actor.userId);
    },

    admissionApplications: async (
      _: unknown,
      args: { status?: string; campusId?: string; limit?: number; offset?: number },
      ctx: Context
    ) => {
      const actor = requireStaff(ctx);
      const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);
      const offset = Math.max(args.offset ?? 0, 0);
      const params: unknown[] = [];
      const conditions = ['u.deleted_at IS NULL'];

      if (actor.role !== 'super_admin') {
        if (!actor.orgId) throw new Error('No organization context');
        params.push(actor.orgId);
        conditions.push(`a.org_id = $${params.length}`);
      }

      if (CAMPUS_SCOPED_ROLES.has(actor.role)) {
        if (!actor.campusId) throw new Error('No campus context');
        params.push(actor.campusId);
        conditions.push(`a.campus_id = $${params.length}`);
      } else if (args.campusId) {
        params.push(args.campusId);
        conditions.push(`a.campus_id = $${params.length}`);
      }

      if (args.status) {
        params.push(args.status.toLowerCase());
        conditions.push(`a.status = $${params.length}`);
      }

      params.push(limit, offset);
      return query<Row>(
        `SELECT a.*, row_to_json(u.*) AS "user", row_to_json(c.*) AS "campus"
         FROM admission_applications a
         JOIN users u ON u.id = a.user_id
         LEFT JOIN campuses c ON c.id = a.campus_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY a.submitted_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
    },
  },

  Mutation: {
    submitAdmissionApplication: async (
      _: unknown,
      { input }: { input: Record<string, unknown> }
    ) => {
      const parsed = applicationInputSchema.parse(input);
      const client = await db.connect();

      try {
        await client.query('BEGIN');

        const { rows: [org] } = await client.query(
          `SELECT id FROM organizations
           WHERE slug = $1 AND status IN ('active', 'trial')`,
          [parsed.orgSlug]
        );
        if (!org) throw new Error('This organization is not accepting applications');

        const { rows: [campus] } = await client.query(
          `SELECT * FROM campuses
           WHERE id = $1 AND org_id = $2 AND status = 'active'`,
          [parsed.campusId, org.id]
        );
        if (!campus) throw new Error('The selected campus is not accepting applications');

        const passwordHash = await bcrypt.hash(parsed.password, 12);
        const { rows: [user] } = await client.query(
          `INSERT INTO users
            (username, email, password_hash, role, status, full_name, phone, org_id, campus_id)
           VALUES ($1, $2, $3, 'applicant', 'pending_verification', $4, $5, $6, $7)
           RETURNING *`,
          [parsed.username, parsed.email, passwordHash, parsed.fullName,
           parsed.phone ?? null, org.id, campus.id]
        );

        const { rows: [application] } = await client.query(
          `INSERT INTO admission_applications
            (user_id, org_id, campus_id, date_of_birth, country, city,
             highest_education, coding_experience, motivation, availability,
             referral_source, terms_accepted, data_consent)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
           RETURNING *`,
          [user.id, org.id, campus.id, parsed.dateOfBirth, parsed.country,
           parsed.city, parsed.highestEducation, parsed.codingExperience,
           parsed.motivation, parsed.availability, parsed.referralSource ?? null,
           parsed.termsAccepted, parsed.dataConsent]
        );

        await client.query(
          `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, new_value)
           VALUES ($1, 'admission.application_submitted', 'admission_application', $2,
                   jsonb_build_object('status', 'submitted'))`,
          [user.id, application.id]
        );
        await client.query('COMMIT');

        return {
          token: signToken(user),
          user,
          application: { ...application, user, campus },
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw inputError(error);
      } finally {
        client.release();
      }
    },

    reviewAdmissionApplication: async (
      _: unknown,
      { applicationId, decision, notes }: { applicationId: string; decision: string; notes?: string },
      ctx: Context
    ) => {
      const actor = requireStaff(ctx);
      const normalizedDecision = decision.toLowerCase();
      if (!['invite', 'reject'].includes(normalizedDecision)) throw new Error('Invalid review decision');
      if (notes && notes.length > 3000) throw new Error('Review notes are too long');

      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const { rows: [application] } = await client.query(
          `SELECT * FROM admission_applications WHERE id = $1 FOR UPDATE`,
          [applicationId]
        );
        if (!application) throw new Error('Application not found');
        assertApplicationScope(actor, application);

        if (['accepted', 'assessment_in_progress', 'assessment_submitted'].includes(application.status)) {
          throw new Error('This application can no longer be changed by staff review');
        }

        if (normalizedDecision === 'reject') {
          await client.query(
            `UPDATE admission_applications
             SET status = 'rejected', review_notes = $2, reviewed_by = $3, reviewed_at = NOW()
             WHERE id = $1`,
            [application.id, notes?.trim() || null, actor.userId]
          );
          await client.query(
            `UPDATE users SET status = 'rejected' WHERE id = $1`,
            [application.user_id]
          );
          await client.query(
            `UPDATE admission_tests SET status = 'expired'
             WHERE application_id = $1 AND status = 'invited'`,
            [application.id]
          );
          await client.query(
            `INSERT INTO notifications (user_id, type, title, body, data)
             VALUES ($1, 'admission.rejected', 'Application update',
                     'Your application will not progress to the assessment at this time.',
                     jsonb_build_object('applicationId', $2::text))`,
            [application.user_id, application.id]
          );
        } else {
          const { rows: questionRows } = await client.query(
            `SELECT * FROM admission_questions
             WHERE (org_id = $1 OR org_id IS NULL) AND is_active = TRUE
             ORDER BY position ASC`,
            [application.org_id]
          );
          if (questionRows.length === 0) {
            throw new Error('No active admission questions are configured for this organization');
          }

          const { rows: [existingTest] } = await client.query(
            `SELECT * FROM admission_tests WHERE application_id = $1`,
            [application.id]
          );

          let test = existingTest;
          if (!test) {
            const inserted = await client.query(
              `INSERT INTO admission_tests
                (user_id, application_id, status, duration_minutes, pass_score,
                 max_score, invitation_expires_at)
               VALUES ($1, $2, 'invited', 60, 70, 100, NOW() + INTERVAL '7 days')
               RETURNING *`,
              [application.user_id, application.id]
            );
            test = inserted.rows[0];

            for (const question of questionRows) {
              await client.query(
                `INSERT INTO admission_test_questions
                  (test_id, question_id, position, question_snapshot)
                 VALUES ($1, $2, $3, jsonb_build_object(
                   'prompt', $4::text,
                   'type', $5::text,
                   'options', $6::jsonb,
                   'answerKey', $7::jsonb,
                   'points', $8::numeric
                 ))`,
                [test.id, question.id, question.position, question.prompt,
                 question.type, JSON.stringify(question.options),
                 JSON.stringify(question.answer_key), question.points]
              );
            }
          } else if (test.status === 'expired') {
            throw new Error('This assessment invitation has expired');
          }

          await client.query(
            `UPDATE admission_applications
             SET status = 'invited', review_notes = $2, reviewed_by = $3, reviewed_at = NOW()
             WHERE id = $1`,
            [application.id, notes?.trim() || null, actor.userId]
          );
          await client.query(
            `UPDATE users SET status = 'admission_test' WHERE id = $1`,
            [application.user_id]
          );
          await client.query(
            `INSERT INTO notifications (user_id, type, title, body, data)
             VALUES ($1, 'admission.assessment_invited', 'Your assessment is ready',
                     'You have seven days to begin your 60-minute admission assessment.',
                     jsonb_build_object('testId', $2::text))`,
            [application.user_id, test.id]
          );
        }

        await client.query(
          `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, new_value)
           VALUES ($1, $2, 'admission_application', $3,
                   jsonb_build_object('decision', $4::text))`,
          [actor.userId, `admission.application_${normalizedDecision}d`, application.id, normalizedDecision]
        );

        const reviewed = await fetchApplication(application.id, client);
        await client.query('COMMIT');
        return reviewed;
      } catch (error) {
        await client.query('ROLLBACK');
        throw inputError(error);
      } finally {
        client.release();
      }
    },

    startAdmissionTest: async (_: unknown, __: unknown, ctx: Context) => {
      const actor = requireUser(ctx);
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const { rows: [test] } = await client.query(
          `SELECT t.* FROM admission_tests t
           WHERE t.user_id = $1
           ORDER BY t.created_at DESC
           LIMIT 1
           FOR UPDATE`,
          [actor.userId]
        );
        if (!test) throw new Error('No assessment invitation found');

        if (test.status === 'submitted' || test.status === 'expired') {
          await client.query('COMMIT');
          return { ...test, questions: [] };
        }

        const now = new Date();
        if (test.status === 'invited' && new Date(test.invitation_expires_at) <= now) {
          const expired = await expireTest(client, test);
          await client.query('COMMIT');
          return expired;
        }

        let activeTest = test;
        if (test.status === 'invited') {
          const { rows: [started] } = await client.query(
            `UPDATE admission_tests
             SET status = 'in_progress', started_at = NOW(),
                 expires_at = NOW() + make_interval(mins => duration_minutes)
             WHERE id = $1
             RETURNING *`,
            [test.id]
          );
          activeTest = started;
          await client.query(
            `UPDATE admission_applications SET status = 'assessment_in_progress' WHERE id = $1`,
            [test.application_id]
          );
          await client.query(
            `INSERT INTO audit_log (actor_id, action, entity_type, entity_id)
             VALUES ($1, 'admission.assessment_started', 'admission_test', $2)`,
            [actor.userId, test.id]
          );
        }

        if (activeTest.expires_at && new Date(activeTest.expires_at) <= now) {
          const expired = await expireTest(client, activeTest);
          await client.query('COMMIT');
          return expired;
        }

        const questions = await publicQuestions(activeTest.id, client);
        await client.query('COMMIT');
        return { ...activeTest, questions };
      } catch (error) {
        await client.query('ROLLBACK');
        throw inputError(error);
      } finally {
        client.release();
      }
    },

    submitAdmissionTest: async (
      _: unknown,
      { answers }: { answers: Array<{ questionId: string; selectedOptions: string[] }> },
      ctx: Context
    ) => {
      const actor = requireUser(ctx);
      const parsedAnswers = answerInputSchema.parse(answers);
      const answerIds = parsedAnswers.map(answer => answer.questionId);
      if (new Set(answerIds).size !== answerIds.length) {
        throw new Error('Each question can only be answered once');
      }

      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const { rows: [test] } = await client.query(
          `SELECT t.* FROM admission_tests t
           WHERE t.user_id = $1
           ORDER BY t.created_at DESC
           LIMIT 1
           FOR UPDATE`,
          [actor.userId]
        );
        if (!test) throw new Error('No assessment found');
        if (test.status === 'submitted' || test.status === 'expired') {
          await client.query('COMMIT');
          return { ...test, questions: [] };
        }
        if (test.status !== 'in_progress' || !test.expires_at) {
          throw new Error('Start the assessment before submitting answers');
        }

        const { rows: [clock] } = await client.query('SELECT NOW() AS now');
        const deadlineWithGrace = new Date(test.expires_at).valueOf() + 15_000;
        if (new Date(clock.now).valueOf() > deadlineWithGrace) {
          const expired = await expireTest(client, test);
          await client.query('COMMIT');
          return expired;
        }

        const { rows: snapshots } = await client.query(
          `SELECT question_id, question_snapshot
           FROM admission_test_questions
           WHERE test_id = $1
           ORDER BY position ASC`,
          [test.id]
        );
        if (snapshots.length === 0) throw new Error('Assessment questions are not configured');

        const questionIds = new Set(snapshots.map(row => row.question_id));
        if (parsedAnswers.some(answer => !questionIds.has(answer.questionId))) {
          throw new Error('One or more answers do not belong to this assessment');
        }

        const grade = gradeAdmissionAnswers(
          snapshots.map(row => ({
            id: row.question_id,
            answerKey: Array.isArray(row.question_snapshot.answerKey)
              ? row.question_snapshot.answerKey.map(String)
              : [],
            points: Number(row.question_snapshot.points),
          })),
          parsedAnswers
        );
        const passed = grade.percentage >= Number(test.pass_score);
        const feedback = passed
          ? `You scored ${grade.percentage}% and qualified for the Piscine.`
          : `You scored ${grade.percentage}%. The qualifying score is ${Number(test.pass_score)}%.`;
        const answerPayload = Object.fromEntries(
          parsedAnswers.map(answer => [answer.questionId, answer.selectedOptions])
        );

        const { rows: [submitted] } = await client.query(
          `UPDATE admission_tests
           SET status = 'submitted', submitted_at = NOW(), score = $2,
               max_score = 100, passed = $3, answers = $4::jsonb, feedback = $5
           WHERE id = $1
           RETURNING *`,
          [test.id, grade.percentage, passed, JSON.stringify(answerPayload), feedback]
        );
        await client.query(
          `UPDATE admission_applications
           SET status = $2::admission_application_status
           WHERE id = $1`,
          [test.application_id, passed ? 'accepted' : 'rejected']
        );
        await client.query(
          `UPDATE users
           SET role = $2::user_role, status = $3::user_status
           WHERE id = $1`,
          [actor.userId, passed ? 'pisciner' : 'applicant', passed ? 'piscine' : 'rejected']
        );
        await client.query(
          `INSERT INTO notifications (user_id, type, title, body, data)
           VALUES ($1, $2, $3, $4,
                   jsonb_build_object('testId', $5::text, 'score', $6::numeric))`,
          [actor.userId,
           passed ? 'admission.accepted' : 'admission.rejected',
           passed ? 'Welcome to the Piscine' : 'Assessment result',
           feedback, test.id, grade.percentage]
        );
        await client.query(
          `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, new_value)
           VALUES ($1, 'admission.assessment_submitted', 'admission_test', $2,
                   jsonb_build_object('score', $3::numeric, 'passed', $4::boolean))`,
          [actor.userId, test.id, grade.percentage, passed]
        );

        await client.query('COMMIT');
        return { ...submitted, questions: [] };
      } catch (error) {
        await client.query('ROLLBACK');
        throw inputError(error);
      } finally {
        client.release();
      }
    },
  },
};
