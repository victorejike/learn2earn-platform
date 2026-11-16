-- ============================================================
-- 1Talent — Multi-Tenant Organisations & Settings
-- Migration: 002_multi_tenancy
-- ============================================================
-- This migration turns 1Talent into a true SaaS product.
-- Any school, campus or organisation can sign up and get their
-- own isolated environment — their own students, staff, cohorts,
-- projects and analytics — all on the same infrastructure.
-- ============================================================

-- ─── ORGANISATIONS ───────────────────────────────────────────

CREATE TYPE org_plan AS ENUM (
  'trial',       -- 30-day free trial, up to 50 students
  'community',   -- Free, open-source self-hosted
  'standard',    -- Paid: unlimited students, full features
  'enterprise'   -- Paid: multi-campus, SSO, custom domain, SLA
);

CREATE TYPE org_status AS ENUM (
  'active',
  'suspended',
  'trial',
  'cancelled'
);

CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            VARCHAR(100) UNIQUE NOT NULL, -- used in subdomain: slug.platform.com
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  logo_url        TEXT,
  website         TEXT,
  country         VARCHAR(100),
  city            VARCHAR(100),
  plan            org_plan NOT NULL DEFAULT 'trial',
  status          org_status NOT NULL DEFAULT 'trial',
  custom_domain   VARCHAR(255) UNIQUE,          -- e.g. campus.1talent.ng
  max_students    INTEGER NOT NULL DEFAULT 50,  -- plan-based limit
  settings        JSONB NOT NULL DEFAULT '{}',  -- branding, feature flags, etc.
  trial_ends_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orgs_slug   ON organizations(slug);
CREATE INDEX idx_orgs_status ON organizations(status);
CREATE INDEX idx_orgs_domain ON organizations(custom_domain);

-- Seed the first org: 1Talent itself
INSERT INTO organizations (slug, name, description, country, city, plan, status, max_students, trial_ends_at)
VALUES (
  '1talent',
  '1Talent',
  'The original 1Talent campus — where the platform was born.',
  'Nigeria', 'Lagos',
  'enterprise', 'active', 10000, NULL
);

-- ─── WIRE org_id INTO ALL CORE TABLES ────────────────────────

-- Users belong to an organisation
ALTER TABLE users ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
-- Set all existing users to the 1talent org
UPDATE users SET org_id = (SELECT id FROM organizations WHERE slug = '1talent');
ALTER TABLE users ALTER COLUMN org_id SET NOT NULL;
CREATE INDEX idx_users_org ON users(org_id);
-- Unique usernames per org (not globally)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE users ADD CONSTRAINT users_username_org_unique UNIQUE (org_id, username);
-- Unique email per org (not globally — same person can be in two orgs)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ADD CONSTRAINT users_email_org_unique UNIQUE (org_id, email);

-- Cohorts belong to an org
ALTER TABLE cohorts ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
  DEFAULT (SELECT id FROM organizations WHERE slug = '1talent');
ALTER TABLE cohorts ALTER COLUMN org_id DROP DEFAULT;
CREATE INDEX idx_cohorts_org ON cohorts(org_id);

-- Projects can be org-private OR platform-shared (org_id NULL = shared template)
ALTER TABLE projects ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE projects ADD COLUMN is_template BOOLEAN NOT NULL DEFAULT FALSE;
-- Existing projects become 1talent org projects
UPDATE projects SET org_id = (SELECT id FROM organizations WHERE slug = '1talent');
CREATE INDEX idx_projects_org ON projects(org_id);
CREATE INDEX idx_projects_template ON projects(is_template) WHERE is_template = TRUE;

-- ─── SUPER ADMIN ROLE ─────────────────────────────────────────

-- Add super_admin to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- ─── ORG INVITATIONS ─────────────────────────────────────────

CREATE TABLE org_invitations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           VARCHAR(255) NOT NULL,
  role            user_role NOT NULL DEFAULT 'student',
  token           VARCHAR(128) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by      UUID REFERENCES users(id),
  accepted_at     TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, email)
);

CREATE INDEX idx_invitations_org   ON org_invitations(org_id);
CREATE INDEX idx_invitations_token ON org_invitations(token);
CREATE INDEX idx_invitations_email ON org_invitations(email);

-- ─── ORG USAGE / BILLING SNAPSHOT ────────────────────────────

CREATE TABLE org_usage_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  student_count   INTEGER NOT NULL DEFAULT 0,
  active_count    INTEGER NOT NULL DEFAULT 0,
  submission_count INTEGER NOT NULL DEFAULT 0,
  storage_mb      NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_usage_org ON org_usage_snapshots(org_id);

-- ─── PLATFORM AUDIT LOG (super_admin only) ───────────────────

CREATE TABLE platform_audit_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id        UUID REFERENCES users(id),
  action          VARCHAR(100) NOT NULL,  -- 'org.created', 'org.suspended', etc.
  org_id          UUID REFERENCES organizations(id),
  details         JSONB,
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_platform_audit_actor ON platform_audit_log(actor_id);
CREATE INDEX idx_platform_audit_org   ON platform_audit_log(org_id);

-- ─── TRIGGER FOR orgs.updated_at ─────────────────────────────

CREATE TRIGGER trg_orgs_updated
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RECORD THIS MIGRATION ───────────────────────────────────

INSERT INTO schema_migrations (version) VALUES ('002_multi_tenancy');
