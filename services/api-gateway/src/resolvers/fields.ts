import { query, queryOne } from '../db.js';

type Parent = Record<string, any>;

function field(parent: Parent, camelCase: string, snakeCase: string): any {
  return parent[camelCase] ?? parent[snakeCase];
}

function numberField(parent: Parent, camelCase: string, snakeCase: string, fallback = 0): number {
  const value = field(parent, camelCase, snakeCase);
  return value === null || value === undefined ? fallback : Number(value);
}

function enumField(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value).toUpperCase();
}

function dateOnly(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export const fieldResolvers = {
  User: {
    fullName: (parent: Parent) => field(parent, 'fullName', 'full_name'),
    role: (parent: Parent) => enumField(parent.role),
    status: (parent: Parent) => enumField(parent.status),
    xpTotal: (parent: Parent) => numberField(parent, 'xpTotal', 'xp_total'),
    level: (parent: Parent) => numberField(parent, 'level', 'level'),
    auditRatio: (parent: Parent) => numberField(parent, 'auditRatio', 'audit_ratio'),
    correctionPoints: (parent: Parent) => numberField(parent, 'correctionPoints', 'correction_points'),
    avatarUrl: (parent: Parent) => field(parent, 'avatarUrl', 'avatar_url'),
    lastActiveAt: (parent: Parent) => field(parent, 'lastActiveAt', 'last_active_at'),
    createdAt: (parent: Parent) => field(parent, 'createdAt', 'created_at'),
    organization: async (parent: Parent) => {
      if (parent.organization) return parent.organization;
      const orgId = field(parent, 'orgId', 'org_id');
      if (!orgId) return null;
      return queryOne(
        `SELECT o.*,
           (SELECT COUNT(*) FROM users u WHERE u.org_id = o.id AND u.role = 'student') AS "studentCount"
         FROM organizations o WHERE o.id = $1`,
        [orgId]
      );
    },
    campus: async (parent: Parent) => {
      if (parent.campus) return parent.campus;
      const campusId = field(parent, 'campusId', 'campus_id');
      if (!campusId) return null;
      return queryOne(
        `SELECT c.*,
           (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id AND u.role = 'student') AS "studentCount",
           (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id AND u.status = 'active') AS "activeCount",
           (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id AND u.status = 'at_risk') AS "atRiskCount"
         FROM campuses c WHERE c.id = $1`,
        [campusId]
      );
    },
  },

  Organization: {
    logoUrl: (parent: Parent) => field(parent, 'logoUrl', 'logo_url'),
    customDomain: (parent: Parent) => field(parent, 'customDomain', 'custom_domain'),
    maxStudents: (parent: Parent) => numberField(parent, 'maxStudents', 'max_students'),
    studentCount: (parent: Parent) => numberField(parent, 'studentCount', 'student_count'),
    createdAt: (parent: Parent) => field(parent, 'createdAt', 'created_at'),
    campuses: (parent: Parent) => query(
      `SELECT c.*,
         (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id AND u.role = 'student') AS "studentCount",
         (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id AND u.status = 'active') AS "activeCount",
         (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id AND u.status = 'at_risk') AS "atRiskCount"
       FROM campuses c WHERE c.org_id = $1 ORDER BY c.name ASC`,
      [parent.id]
    ),
  },

  Campus: {
    isVirtual: (parent: Parent) => Boolean(field(parent, 'isVirtual', 'is_virtual')),
    maxStudents: (parent: Parent) => {
      const value = field(parent, 'maxStudents', 'max_students');
      return value === null || value === undefined ? null : Number(value);
    },
    studentCount: (parent: Parent) => numberField(parent, 'studentCount', 'student_count'),
    activeCount: (parent: Parent) => numberField(parent, 'activeCount', 'active_count'),
    atRiskCount: (parent: Parent) => numberField(parent, 'atRiskCount', 'at_risk_count'),
    createdAt: (parent: Parent) => field(parent, 'createdAt', 'created_at'),
  },

  Project: {
    xpReward: (parent: Parent) => numberField(parent, 'xpReward', 'xp_reward'),
    isGroupProject: (parent: Parent) => Boolean(field(parent, 'isGroupProject', 'is_group_project')),
    createdAt: (parent: Parent) => field(parent, 'createdAt', 'created_at'),
  },

  StudentProject: {
    status: (parent: Parent) => enumField(parent.status),
    gitRepoUrl: (parent: Parent) => field(parent, 'gitRepoUrl', 'git_repo_url'),
    finalGrade: (parent: Parent) => {
      const value = field(parent, 'finalGrade', 'final_grade');
      return value === null || value === undefined ? null : Number(value);
    },
    xpEarned: (parent: Parent) => numberField(parent, 'xpEarned', 'xp_earned'),
    attemptCount: (parent: Parent) => numberField(parent, 'attemptCount', 'attempt_count'),
    startedAt: (parent: Parent) => field(parent, 'startedAt', 'started_at'),
    passedAt: (parent: Parent) => field(parent, 'passedAt', 'passed_at'),
  },

  Cohort: {
    cohortType: (parent: Parent) => field(parent, 'cohortType', 'cohort_type'),
    startsAt: (parent: Parent) => field(parent, 'startsAt', 'starts_at'),
    endsAt: (parent: Parent) => field(parent, 'endsAt', 'ends_at'),
    maxCapacity: (parent: Parent) => {
      const value = field(parent, 'maxCapacity', 'max_capacity');
      return value === null || value === undefined ? null : Number(value);
    },
    memberCount: (parent: Parent) => numberField(parent, 'memberCount', 'member_count'),
  },

  AdmissionApplication: {
    user: (parent: Parent) => parent.user,
    campus: (parent: Parent) => parent.campus ?? null,
    status: (parent: Parent) => enumField(parent.status),
    dateOfBirth: (parent: Parent) => dateOnly(field(parent, 'dateOfBirth', 'date_of_birth')),
    highestEducation: (parent: Parent) => field(parent, 'highestEducation', 'highest_education'),
    codingExperience: (parent: Parent) => field(parent, 'codingExperience', 'coding_experience'),
    referralSource: (parent: Parent) => field(parent, 'referralSource', 'referral_source'),
    reviewNotes: (parent: Parent) => field(parent, 'reviewNotes', 'review_notes'),
    reviewedAt: (parent: Parent) => field(parent, 'reviewedAt', 'reviewed_at'),
    submittedAt: (parent: Parent) => field(parent, 'submittedAt', 'submitted_at'),
    createdAt: (parent: Parent) => field(parent, 'createdAt', 'created_at'),
  },

  AdmissionQuestion: {
    type: (parent: Parent) => enumField(parent.type),
    points: (parent: Parent) => Number(parent.points),
    position: (parent: Parent) => Number(parent.position),
    options: (parent: Parent) => parent.options ?? [],
  },

  AdmissionTest: {
    status: (parent: Parent) => enumField(parent.status),
    durationMinutes: (parent: Parent) => numberField(parent, 'durationMinutes', 'duration_minutes'),
    passScore: (parent: Parent) => numberField(parent, 'passScore', 'pass_score'),
    startedAt: (parent: Parent) => field(parent, 'startedAt', 'started_at'),
    expiresAt: (parent: Parent) => field(parent, 'expiresAt', 'expires_at'),
    invitationExpiresAt: (parent: Parent) => field(parent, 'invitationExpiresAt', 'invitation_expires_at'),
    submittedAt: (parent: Parent) => field(parent, 'submittedAt', 'submitted_at'),
    score: (parent: Parent) => {
      const value = parent.score;
      return value === null || value === undefined ? null : Number(value);
    },
    maxScore: (parent: Parent) => numberField(parent, 'maxScore', 'max_score'),
    questions: (parent: Parent) => parent.questions ?? [],
  },
};
