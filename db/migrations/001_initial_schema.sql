-- ============================================================
-- 1Talent — Initial Schema
-- Migration: 001_initial_schema
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUMS ──────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
  'applicant',
  'pisciner',
  'student',
  'campus_staff',
  'head_of_campus',
  'admin'
);

CREATE TYPE user_status AS ENUM (
  'pending_verification',
  'admission_test',
  'piscine',
  'active',
  'at_risk',
  'inactive',
  'graduated',
  'rejected'
);

CREATE TYPE project_status AS ENUM (
  'locked',
  'available',
  'in_progress',
  'submitted',
  'in_review',
  'passed',
  'failed'
);

CREATE TYPE submission_status AS ENUM (
  'pending',
  'running',
  'tests_passed',
  'tests_failed',
  'in_peer_review',
  'graded',
  'flagged'
);

CREATE TYPE evaluation_status AS ENUM (
  'scheduled',
  'in_progress',
  'completed',
  'disputed',
  'flagged',
  'cancelled'
);

CREATE TYPE cohort_status AS ENUM (
  'upcoming',
  'active',
  'completed',
  'cancelled'
);

-- ─── USERS ──────────────────────────────────────────────────

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username        VARCHAR(50) UNIQUE NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  phone           VARCHAR(20),
  phone_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash   TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'applicant',
  status          user_status NOT NULL DEFAULT 'pending_verification',

  -- Identity
  full_name       VARCHAR(255) NOT NULL,
  id_document_url TEXT,
  id_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url      TEXT,

  -- XP & Progression
  xp_total        INTEGER NOT NULL DEFAULT 0,
  level           INTEGER NOT NULL DEFAULT 0,
  audit_ratio     NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  correction_points INTEGER NOT NULL DEFAULT 0,

  -- Activity tracking
  last_active_at  TIMESTAMPTZ,
  at_risk_since   TIMESTAMPTZ,

  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_active ON users(last_active_at);

-- ─── ADMISSION TESTS ────────────────────────────────────────

CREATE TABLE admission_tests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at    TIMESTAMPTZ,
  score           NUMERIC(5,2),
  max_score       NUMERIC(5,2) NOT NULL DEFAULT 100,
  passed          BOOLEAN,
  answers         JSONB,
  feedback        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admission_tests_user ON admission_tests(user_id);

-- ─── COHORTS (Piscine & Classes) ────────────────────────────

CREATE TABLE cohorts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  cohort_type     VARCHAR(50) NOT NULL DEFAULT 'piscine',  -- 'piscine' | 'main'
  status          cohort_status NOT NULL DEFAULT 'upcoming',
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  max_capacity    INTEGER,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cohort_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id       UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  passed          BOOLEAN,
  UNIQUE(cohort_id, user_id)
);

CREATE INDEX idx_cohort_members_cohort ON cohort_members(cohort_id);
CREATE INDEX idx_cohort_members_user ON cohort_members(user_id);

-- ─── PROJECTS (Curriculum DAG) ───────────────────────────────

CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            VARCHAR(100) UNIQUE NOT NULL,
  title           VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL,
  instructions    TEXT NOT NULL,
  xp_reward       INTEGER NOT NULL DEFAULT 0,
  min_pass_grade  NUMERIC(5,2) NOT NULL DEFAULT 50.0,
  max_attempts    INTEGER NOT NULL DEFAULT 3,
  time_limit_days INTEGER,
  is_group_project BOOLEAN NOT NULL DEFAULT FALSE,
  max_group_size  INTEGER NOT NULL DEFAULT 1,
  rubric          JSONB NOT NULL DEFAULT '[]',
  tags            TEXT[] NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project dependency graph (DAG edges)
CREATE TABLE project_dependencies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requires_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, requires_id),
  CHECK(project_id != requires_id)
);

CREATE INDEX idx_project_deps_project ON project_dependencies(project_id);

-- ─── STUDENT PROJECTS ────────────────────────────────────────

CREATE TABLE student_projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status          project_status NOT NULL DEFAULT 'locked',
  git_repo_url    TEXT,
  started_at      TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ,
  passed_at       TIMESTAMPTZ,
  final_grade     NUMERIC(5,2),
  xp_earned       INTEGER NOT NULL DEFAULT 0,
  attempt_count   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

CREATE INDEX idx_student_projects_user ON student_projects(user_id);
CREATE INDEX idx_student_projects_status ON student_projects(status);

-- ─── SUBMISSIONS ─────────────────────────────────────────────

CREATE TABLE submissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_project_id UUID NOT NULL REFERENCES student_projects(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  git_commit_hash VARCHAR(64) NOT NULL,
  git_repo_url    TEXT NOT NULL,
  status          submission_status NOT NULL DEFAULT 'pending',
  test_results    JSONB,
  tests_passed    INTEGER NOT NULL DEFAULT 0,
  tests_total     INTEGER NOT NULL DEFAULT 0,
  similarity_score NUMERIC(5,2),
  ai_flagged      BOOLEAN NOT NULL DEFAULT FALSE,
  ai_flag_reason  TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  graded_at       TIMESTAMPTZ
);

CREATE INDEX idx_submissions_student_project ON submissions(student_project_id);
CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);

-- ─── PEER EVALUATIONS ────────────────────────────────────────

CREATE TABLE evaluations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id   UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_id     UUID NOT NULL REFERENCES users(id),
  reviewee_id     UUID NOT NULL REFERENCES users(id),
  status          evaluation_status NOT NULL DEFAULT 'scheduled',
  scheduled_at    TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  rubric_answers  JSONB,
  grade           NUMERIC(5,2),
  feedback        TEXT,
  is_flagged      BOOLEAN NOT NULL DEFAULT FALSE,
  flag_reason     TEXT,
  correction_points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(reviewer_id != reviewee_id)
);

CREATE INDEX idx_evaluations_submission ON evaluations(submission_id);
CREATE INDEX idx_evaluations_reviewer ON evaluations(reviewer_id);
CREATE INDEX idx_evaluations_reviewee ON evaluations(reviewee_id);
CREATE INDEX idx_evaluations_status ON evaluations(status);

-- ─── COMPETENCY MAP ──────────────────────────────────────────

CREATE TABLE competencies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            VARCHAR(100) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  category        VARCHAR(100),
  parent_id       UUID REFERENCES competencies(id)
);

CREATE TABLE student_competencies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  competency_id   UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  score           NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, competency_id)
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            VARCHAR(100) NOT NULL,
  title           VARCHAR(255) NOT NULL,
  body            TEXT NOT NULL,
  read            BOOLEAN NOT NULL DEFAULT FALSE,
  data            JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- ─── AUDIT LOG ───────────────────────────────────────────────

CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id        UUID REFERENCES users(id),
  action          VARCHAR(100) NOT NULL,
  entity_type     VARCHAR(100),
  entity_id       UUID,
  old_value       JSONB,
  new_value       JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cohorts_updated BEFORE UPDATE ON cohorts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_student_projects_updated BEFORE UPDATE ON student_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_evaluations_updated BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── MIGRATION TRACKING ─────────────────────────────────────

CREATE TABLE schema_migrations (
  id              SERIAL PRIMARY KEY,
  version         VARCHAR(50) UNIQUE NOT NULL,
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('001_initial_schema');
