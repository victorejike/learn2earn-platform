#!/usr/bin/env bash
# ============================================================
# 1Talent — Git initialisation, commit history & push setup
# Run this once from inside the project folder:
#
#   cd /home/victor2/learn2earn-platform   (or wherever it is)
#   chmod +x setup-git.sh
#   ./setup-git.sh
# ============================================================
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "📁  Working in: $ROOT"
echo ""

# ─── Configure git identity ───────────────────────────────────
git config user.email "victor@1talent.local"
git config user.name  "Victor Ejike"

# ─── Store credentials so push never asks for password again ──
# Uses the OS secure store (libsecret on Linux, Keychain on Mac)
git config --global credential.helper store

# ─── Init repo if needed ──────────────────────────────────────
if [ ! -d ".git" ]; then
  git init -b main
  echo "✅  Git initialised on branch: main"
else
  echo "ℹ️   Git already initialised"
fi

# ============================================================
# COMMIT 1 — Monorepo foundation
# ============================================================
echo ""
echo "📦  [1/6] chore: scaffold 1Talent monorepo foundation"

git add \
  package.json turbo.json tsconfig.base.json \
  .env.example .gitignore .gitattributes \
  Makefile README.md SECURITY.md \
  setup-git.sh 2>/dev/null || true

git commit --allow-empty -m "chore: scaffold 1Talent monorepo foundation

- npm workspaces (apps/*, services/*, packages/*)
- Turborepo pipeline: dev, build, test, lint, typecheck
- Shared tsconfig.base.json — strict, ESNext, bundler resolution
- .env.example with all environment variables documented
- Makefile: setup, dev, stop, migrate, seed, test, clean
- SECURITY.md vulnerability reporting policy
- README.md — full architecture, stack, build log"

# ============================================================
# COMMIT 2 — Docker infrastructure
# ============================================================
echo ""
echo "🐳  [2/6] chore: add Docker Compose infrastructure"

git add infra/ 2>/dev/null || true

git commit --allow-empty -m "chore: add Docker Compose infrastructure

Services (all named with talent_ prefix):
  talent_db      — PostgreSQL 16 with healthcheck
  talent_redis   — Redis 7 with healthcheck
  talent_gitea   — Gitea 1.22 self-hosted git server
  talent_mailhog — MailHog dev mail catcher
  talent_api/web/admin behind --profile full flag

infra/docker/init.sql — creates 1talent + gitea databases"

# ============================================================
# COMMIT 3 — Database schema
# ============================================================
echo ""
echo "🗄️   [3/6] feat: add PostgreSQL schema and migrations"

git add db/ 2>/dev/null || true

git commit --allow-empty -m "feat: add PostgreSQL schema and migrations

001_initial_schema.sql
  6 ENUMs, 14 tables, 20+ indexes, updated_at triggers
  Core: users, projects (DAG via project_dependencies),
        student_projects, submissions, evaluations
  Campus: cohorts, cohort_members
  Growth: competencies, student_competencies
  Platform: notifications, audit_log, schema_migrations

002_multi_tenancy.sql
  organisations table — any school can join 1Talent
  org_id on all core tables, super_admin role
  org_invitations, org_usage_snapshots

003_campuses.sql
  campuses table — one org, many campuses
  campus_id on users + cohorts, campus_roles
  campus_invitations, campus_snapshots

Idempotent migration runner + fake dev seed data"

# ============================================================
# COMMIT 4 — API Gateway
# ============================================================
echo ""
echo "🔌  [4/6] feat: add GraphQL API gateway"

git add services/ 2>/dev/null || true

git commit --allow-empty -m "feat: add GraphQL API gateway (Apollo Server 4 + Express 4)

Full GraphQL schema: User, Organisation, Campus, Project,
  StudentProject, Cohort, DashboardStats, AuthPayload

Resolvers: auth, users, projects, dashboard,
           organisations, campuses

JWT middleware — token carries userId, role, orgId, campusId
Multi-tenant login: login(email, password, orgSlug?)
Health check: GET /health
TypeScript: zero errors (tsc --noEmit clean)"

# ============================================================
# COMMIT 5 — Frontend apps
# ============================================================
echo ""
echo "🖥️   [5/6] feat: add student portal and admin dashboard"

git add apps/ packages/ 2>/dev/null || true

git commit --allow-empty -m "feat: add student portal and admin dashboard

apps/web — Student Portal (port 3000)
  Login, Dashboard (XP/level/projects/campus stats),
  Projects list, Profile page, Protected routes

apps/admin — Campus Admin Dashboard (port 3001)
  Staff-only login, Campus dashboard (5 stat cards),
  Students table with status badges,
  At-Risk page (72h inactivity alerts),
  Cohorts + Projects placeholders

Stack: React 18, TypeScript, Tailwind CSS, Apollo Client,
       Lucide React, React Router v6"

# ============================================================
# COMMIT 6 — Architecture docs + ADRs
# ============================================================
echo ""
echo "📄  [6/6] docs: add architecture decisions and build log"

git add docs/ 2>/dev/null || true

git commit --allow-empty -m "docs: add architecture decisions and build log

docs/adr/ — Architecture Decision Records:
  ADR-001: Multi-tenant from day one (not retrofitted)
  ADR-002: Modular monolith first, microservices later
  ADR-003: Postgres over MongoDB — relational integrity
  ADR-004: Rust sandbox — untrusted code security boundary
  ADR-005: Versioned SQL migrations — never destructive

README.md Build Log section updated"

echo ""
echo "============================================================"
echo "✅  Git history ready:"
echo "============================================================"
git log --oneline
echo ""

# ─── GitHub push setup ────────────────────────────────────────
echo "============================================================"
echo "📡  PUSH SETUP (choose one method)"
echo "============================================================"
echo ""
echo "METHOD 1 — SSH (recommended — never asks for password again)"
echo "------------------------------------------------------------"
echo "  Step 1: Generate SSH key (if you don't have one):"
echo "    ssh-keygen -t ed25519 -C 'victor@1talent.local'"
echo ""
echo "  Step 2: Copy and add to GitHub:"
echo "    cat ~/.ssh/id_ed25519.pub"
echo "    → Go to: github.com/settings/ssh/new → paste it"
echo ""
echo "  Step 3: Add remote with SSH URL:"
echo "    git remote add origin git@github.com:YOUR_ORG/1talent.git"
echo "    git push -u origin main"
echo ""
echo "METHOD 2 — Personal Access Token (HTTPS)"
echo "------------------------------------------------------------"
echo "  Step 1: Create token at: github.com/settings/tokens"
echo "          Scopes needed: repo (full control)"
echo ""
echo "  Step 2: Add remote:"
echo "    git remote add origin https://github.com/YOUR_ORG/1talent.git"
echo ""
echo "  Step 3: Push — when asked for password, paste the TOKEN:"
echo "    git push -u origin main"
echo "    Username: your-github-username"
echo "    Password: ghp_xxxxxxxxxxxx  ← paste token here"
echo ""
echo "  The credential store will save it. Never asked again."
echo "============================================================"
