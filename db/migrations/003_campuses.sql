-- ============================================================
-- Multi-Campus Support
-- Migration: 003_campuses
-- ============================================================
-- An Organisation can operate multiple physical or virtual
-- campuses. Each campus has its own head, staff, students,
-- cohorts/Piscines and analytics — but shares the parent
-- organisation's plan and project library.
--
-- Hierarchy:
--   Platform → Organisation → Campus → Users / Cohorts
-- ============================================================

-- ─── CAMPUS STATUS ───────────────────────────────────────────

CREATE TYPE campus_status AS ENUM (
  'active',
  'inactive',
  'coming_soon'
);

-- ─── CAMPUSES ────────────────────────────────────────────────

CREATE TABLE campuses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug            VARCHAR(100) NOT NULL,          -- unique within the org
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  city            VARCHAR(100),
  country         VARCHAR(100),
  timezone        VARCHAR(100) NOT NULL DEFAULT 'Africa/Lagos',
  logo_url        TEXT,
  cover_url       TEXT,
  is_virtual      BOOLEAN NOT NULL DEFAULT FALSE, -- fully online campus
  status          campus_status NOT NULL DEFAULT 'active',
  max_students    INTEGER,                        -- NULL = inherit from org
  settings        JSONB NOT NULL DEFAULT '{}',    -- campus-level feature flags
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

CREATE INDEX idx_campuses_org    ON campuses(org_id);
CREATE INDEX idx_campuses_status ON campuses(status);

-- ─── WIRE campus_id INTO USER / COHORT TABLES ────────────────

-- Users are assigned to a specific campus within their org
ALTER TABLE users
  ADD COLUMN campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL;

CREATE INDEX idx_users_campus ON users(campus_id);

-- Cohorts belong to a campus (not just an org)
ALTER TABLE cohorts
  ADD COLUMN campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE;

CREATE INDEX idx_cohorts_campus ON cohorts(campus_id);

-- ─── CAMPUS STAFF ROLES ──────────────────────────────────────
-- A user can be head_of_campus or campus_staff for a specific
-- campus (not all campuses in the org). This table maps it.

CREATE TABLE campus_roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campus_id   UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  role        user_role NOT NULL,          -- head_of_campus | campus_staff
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, campus_id)
);

CREATE INDEX idx_campus_roles_user   ON campus_roles(user_id);
CREATE INDEX idx_campus_roles_campus ON campus_roles(campus_id);

-- ─── CAMPUS INVITATIONS ───────────────────────────────────────
-- Invite someone to join a specific campus as a student or staff

CREATE TABLE campus_invitations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campus_id   UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       VARCHAR(255) NOT NULL,
  role        user_role NOT NULL DEFAULT 'student',
  token       VARCHAR(128) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by  UUID REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campus_id, email)
);

CREATE INDEX idx_campus_invitations_campus ON campus_invitations(campus_id);
CREATE INDEX idx_campus_invitations_token  ON campus_invitations(token);

-- ─── CAMPUS ANALYTICS SNAPSHOTS ──────────────────────────────

CREATE TABLE campus_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campus_id       UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  snapshot_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  student_count   INTEGER NOT NULL DEFAULT 0,
  active_count    INTEGER NOT NULL DEFAULT 0,
  at_risk_count   INTEGER NOT NULL DEFAULT 0,
  graduated_count INTEGER NOT NULL DEFAULT 0,
  avg_xp          NUMERIC(10,2) NOT NULL DEFAULT 0,
  avg_audit_ratio NUMERIC(5,2)  NOT NULL DEFAULT 0
);

CREATE INDEX idx_campus_snapshots_campus ON campus_snapshots(campus_id);

-- ─── SEED: Default campus for 1Talent ─────────────────────

INSERT INTO campuses (org_id, slug, name, city, country, timezone, status)
SELECT
  id,
  'lagos',
  '1Talent Lagos',
  'Lagos',
  'Nigeria',
  'Africa/Lagos',
  'active'
FROM organizations WHERE slug = '1talent';

-- Assign all existing users to the default campus
UPDATE users
SET campus_id = (
  SELECT c.id FROM campuses c
  JOIN organizations o ON c.org_id = o.id
  WHERE o.slug = '1talent' AND c.slug = 'lagos'
)
WHERE org_id = (SELECT id FROM organizations WHERE slug = '1talent');

-- Assign all existing cohorts to the default campus
UPDATE cohorts
SET campus_id = (
  SELECT c.id FROM campuses c
  JOIN organizations o ON c.org_id = o.id
  WHERE o.slug = '1talent' AND c.slug = 'lagos'
);

-- ─── TRIGGER ─────────────────────────────────────────────────

CREATE TRIGGER trg_campuses_updated
  BEFORE UPDATE ON campuses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RECORD ──────────────────────────────────────────────────

INSERT INTO schema_migrations (version) VALUES ('003_campuses');
