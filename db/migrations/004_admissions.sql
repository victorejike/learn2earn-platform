-- ============================================================
-- 1Talent — Admissions Pipeline
-- Migration: 004_admissions
-- ============================================================
-- Application → staff review → timed assessment → Piscine offer
-- ============================================================

CREATE TYPE admission_application_status AS ENUM (
  'submitted',
  'under_review',
  'invited',
  'assessment_in_progress',
  'assessment_submitted',
  'accepted',
  'rejected'
);

CREATE TYPE admission_test_status AS ENUM (
  'invited',
  'in_progress',
  'submitted',
  'expired'
);

CREATE TYPE admission_question_type AS ENUM (
  'single_choice',
  'multiple_choice',
  'boolean'
);

-- ─── APPLICATIONS ────────────────────────────────────────────

CREATE TABLE admission_applications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference         VARCHAR(20) UNIQUE NOT NULL
                    DEFAULT ('1T-' || UPPER(SUBSTRING(encode(gen_random_bytes(6), 'hex'), 1, 10))),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campus_id         UUID REFERENCES campuses(id) ON DELETE SET NULL,
  status            admission_application_status NOT NULL DEFAULT 'submitted',

  date_of_birth     DATE NOT NULL,
  country           VARCHAR(100) NOT NULL,
  city              VARCHAR(100) NOT NULL,
  highest_education VARCHAR(100) NOT NULL,
  coding_experience VARCHAR(100) NOT NULL,
  motivation        TEXT NOT NULL,
  availability      VARCHAR(100) NOT NULL,
  referral_source   VARCHAR(100),
  terms_accepted    BOOLEAN NOT NULL DEFAULT FALSE,
  data_consent      BOOLEAN NOT NULL DEFAULT FALSE,

  review_notes      TEXT,
  reviewed_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (char_length(motivation) BETWEEN 80 AND 3000),
  CHECK (terms_accepted = TRUE),
  CHECK (data_consent = TRUE)
);

CREATE INDEX idx_admission_applications_org_status
  ON admission_applications(org_id, status);
CREATE INDEX idx_admission_applications_campus
  ON admission_applications(campus_id);
CREATE INDEX idx_admission_applications_submitted
  ON admission_applications(submitted_at DESC);

-- ─── QUESTION BANK ────────────────────────────────────────────

CREATE TABLE admission_questions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
  prompt      TEXT NOT NULL,
  type        admission_question_type NOT NULL DEFAULT 'single_choice',
  options     JSONB NOT NULL,
  answer_key  JSONB NOT NULL,
  points      NUMERIC(6,2) NOT NULL DEFAULT 10,
  position    INTEGER NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(org_id, position),
  CHECK (jsonb_typeof(options) = 'array'),
  CHECK (jsonb_typeof(answer_key) = 'array'),
  CHECK (points > 0)
);

CREATE INDEX idx_admission_questions_org_active
  ON admission_questions(org_id, is_active, position);

-- ─── TIMED ASSESSMENTS ────────────────────────────────────────

-- The original table started its clock when a row was created. Invitations
-- now exist before an applicant starts, so the clock must begin explicitly.
ALTER TABLE admission_tests ALTER COLUMN started_at DROP NOT NULL;
ALTER TABLE admission_tests ALTER COLUMN started_at DROP DEFAULT;
ALTER TABLE admission_tests ALTER COLUMN answers SET DEFAULT '{}'::jsonb;
UPDATE admission_tests SET answers = '{}'::jsonb WHERE answers IS NULL;
ALTER TABLE admission_tests ALTER COLUMN answers SET NOT NULL;

ALTER TABLE admission_tests
  ADD COLUMN application_id UUID REFERENCES admission_applications(id) ON DELETE CASCADE,
  ADD COLUMN status admission_test_status NOT NULL DEFAULT 'invited',
  ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN pass_score NUMERIC(5,2) NOT NULL DEFAULT 70,
  ADD COLUMN expires_at TIMESTAMPTZ,
  ADD COLUMN invitation_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  ADD COLUMN attempt_number INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD CONSTRAINT admission_tests_duration_check CHECK (duration_minutes BETWEEN 10 AND 180),
  ADD CONSTRAINT admission_tests_pass_score_check CHECK (pass_score BETWEEN 0 AND 100);

-- Preserve sensible states if this migration encounters legacy test rows.
UPDATE admission_tests
SET status = CASE WHEN submitted_at IS NULL THEN 'in_progress'::admission_test_status
                  ELSE 'submitted'::admission_test_status END,
    expires_at = CASE WHEN submitted_at IS NULL THEN started_at + INTERVAL '60 minutes'
                      ELSE expires_at END
WHERE application_id IS NULL;

CREATE UNIQUE INDEX idx_admission_tests_application
  ON admission_tests(application_id) WHERE application_id IS NOT NULL;
CREATE INDEX idx_admission_tests_user_status
  ON admission_tests(user_id, status);

-- Snapshot every question at invitation time. Later edits to the question
-- bank cannot change an assessment already issued to an applicant.
CREATE TABLE admission_test_questions (
  test_id           UUID NOT NULL REFERENCES admission_tests(id) ON DELETE CASCADE,
  question_id       UUID NOT NULL REFERENCES admission_questions(id),
  position          INTEGER NOT NULL,
  question_snapshot JSONB NOT NULL,
  PRIMARY KEY (test_id, question_id),
  UNIQUE(test_id, position)
);

CREATE INDEX idx_admission_test_questions_test
  ON admission_test_questions(test_id, position);

-- ─── DEFAULT ASSESSMENT ───────────────────────────────────────

INSERT INTO admission_questions
  (org_id, prompt, type, options, answer_key, points, position)
SELECT
  o.id,
  q.prompt,
  q.type::admission_question_type,
  q.options::jsonb,
  q.answer_key::jsonb,
  q.points,
  q.position
FROM organizations o
CROSS JOIN (VALUES
  (
    'What number comes next in the sequence: 2, 6, 12, 20, __?',
    'single_choice',
    '[{"value":"a","label":"24"},{"value":"b","label":"28"},{"value":"c","label":"30"},{"value":"d","label":"32"}]',
    '["c"]', 12.5, 1
  ),
  (
    'A program repeats an action 4 times, and each action takes 3 seconds. How long does the program spend on those actions?',
    'single_choice',
    '[{"value":"a","label":"7 seconds"},{"value":"b","label":"12 seconds"},{"value":"c","label":"16 seconds"},{"value":"d","label":"43 seconds"}]',
    '["b"]', 12.5, 2
  ),
  (
    'What is the decimal value of the binary number 1010?',
    'single_choice',
    '[{"value":"a","label":"8"},{"value":"b","label":"10"},{"value":"c","label":"12"},{"value":"d","label":"14"}]',
    '["b"]', 12.5, 3
  ),
  (
    'Which Git command downloads a complete copy of an existing repository?',
    'single_choice',
    '[{"value":"a","label":"git clone"},{"value":"b","label":"git commit"},{"value":"c","label":"git status"},{"value":"d","label":"git branch"}]',
    '["a"]', 12.5, 4
  ),
  (
    'Which HTTP status code normally means a request succeeded?',
    'single_choice',
    '[{"value":"a","label":"200"},{"value":"b","label":"301"},{"value":"c","label":"404"},{"value":"d","label":"500"}]',
    '["a"]', 12.5, 5
  ),
  (
    'A test fails only on your laptop. What is the best first debugging step?',
    'single_choice',
    '[{"value":"a","label":"Delete the test"},{"value":"b","label":"Rewrite the whole project"},{"value":"c","label":"Reproduce the failure and inspect the error"},{"value":"d","label":"Ignore it because it works elsewhere"}]',
    '["c"]', 12.5, 6
  ),
  (
    'If every peer review needs 2 reviewers, how many review assignments are needed for 6 submissions?',
    'single_choice',
    '[{"value":"a","label":"3"},{"value":"b","label":"6"},{"value":"c","label":"8"},{"value":"d","label":"12"}]',
    '["d"]', 12.5, 7
  ),
  (
    'You are blocked on a project after trying several approaches. Which response best fits peer-led learning?',
    'single_choice',
    '[{"value":"a","label":"Copy a finished solution without understanding it"},{"value":"b","label":"Document what you tried, ask a peer a focused question, then continue"},{"value":"c","label":"Wait silently for an instructor to solve it"},{"value":"d","label":"Mark the project complete"}]',
    '["b"]', 12.5, 8
  )
) AS q(prompt, type, options, answer_key, points, position)
WHERE o.slug = '1talent'
ON CONFLICT (org_id, position) DO NOTHING;

-- ─── TRIGGERS & MIGRATION RECORD ─────────────────────────────

CREATE TRIGGER trg_admission_applications_updated
  BEFORE UPDATE ON admission_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_admission_questions_updated
  BEFORE UPDATE ON admission_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_admission_tests_updated
  BEFORE UPDATE ON admission_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO schema_migrations (version) VALUES ('004_admissions');
