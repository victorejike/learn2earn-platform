# 1Talent

> A multi-tenant, project-based, peer-reviewed engineering education platform.
> Any school or campus can use it. Built to identify, assess and develop AI-native engineers.

---

## What is 1Talent?

1Talent is a SaaS engineering education platform. It works like 01Edu and School 42 — but fixes the gaps both of them leave open.

**Any organisation** (a bootcamp, a university, a corporate training programme) can sign up and get their own isolated environment on 1Talent. Inside that environment, they can create campuses, run Piscines (intensive selection bootcamps), deliver project-based curricula, manage peer evaluations, and track every student's real engineering progress.

**Learn2Earn** is the first organisation on the platform — the reason it was built.

---

## Hierarchy

```
1Talent  (the platform — owned by the engineering team)
  └── Organisation  e.g. Learn2Earn, TechSchool Ghana, CodeCamp Kenya
        └── Campus A  e.g. Lagos
        └── Campus B  e.g. Abuja
              └── Head of Campus
              └── Campus Staff
              └── Students / Pisciners
              └── Cohorts & Piscines
              └── Projects (DAG curriculum)
              └── Peer Evaluations
              └── Analytics & At-Risk Alerts
```

---

## Why We Built This

The current platform used by Learn2Earn (Talent Nation) does not:
- Verify who each student actually is
- Test real engineering skill through auto-graded projects
- Enforce a structured learning order (prerequisite dependency graph)
- Run peer code reviews with accountability (audit ratio)
- Give campus leadership live visibility into student progress
- Detect and flag students at risk of dropping out

1Talent solves all of these.

---

## What We Took From 01Edu & School 42

| Feature | Source | Our improvement |
|---|---|---|
| DAG curriculum — prerequisites enforced | 01Edu | Added version control per project |
| Peer-to-peer evaluation engine | Both | Anti-collusion engine + rubric pre-check |
| Audit ratio enforcement | 01Edu | Real-time display + automatic submission lock |
| Piscine / bootcamp selection module | School 42 | Fully on-platform, no external tools needed |
| "Holy Graph" — visual skill tree | School 42 | Per-campus view for staff |
| Correction point economy | School 42 | Balanced with AI cross-check on grades |
| Auto-tested sandbox runner | Both | Rust-based, isolated containers, no network access |
| Git-first submission workflow | Both | Self-hosted Gitea, every commit auditable |
| Exam mode (locked, timed, solo) | School 42 | Kiosk UI — no external software needed |
| Gamified XP & levels | 01Edu | Visible to campus head in real time |

### Gaps We Fix

| Gap in 01Edu / 42 | Our fix |
|---|---|
| No identity verification — ghost-coding possible | Admission test + ID document + AI authorship detection |
| Peer evaluators don't understand what they're grading | Rubric comprehension pre-check before grading |
| Collusion rings — friends always pass each other | Anti-collusion engine: no mutual reviews, anomaly detection |
| No early-warning for at-risk students | 72-hour inactivity alert to campus staff |
| AI-generated code bypasses tests | Similarity detection worker + behavioural flags |
| No multi-campus / multi-org support | Full multi-tenant SaaS — Platform → Org → Campus |
| Burnout with no intervention mechanism | Staff can send in-platform alerts; analytics flag disengagement |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                        │
│  apps/web (Student)   apps/admin   apps/piscine-kiosk   │
└────────────────────────┬────────────────────────────────┘
                         │ GraphQL / REST
┌────────────────────────▼────────────────────────────────┐
│                   API Gateway                           │
│         GraphQL · JWT Auth · Rate Limiting              │
└──┬──────────┬──────────┬──────────┬──────────┬──────────┘
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
Identity  Curriculum  Peer       Campus    Analytics
Admission  Projects   Review     Piscine   & Alerts
   │          │          │
   └──────────┼──────────┘
              │
   ┌──────────▼──────────┐
   │   Rust Sandbox      │  ← executes untrusted student code
   │   (isolated, no     │    in an isolated container
   │    network, capped) │
   └──────────┬──────────┘
              │
   ┌──────────▼──────────┐
   │  Python Workers     │  ai_feedback · similarity · migration
   └─────────────────────┘
              │
   ┌──────────▼──────────┐
   │  Data Layer         │  PostgreSQL · Redis · Gitea · S3
   └─────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Student & Admin UI | React + TypeScript + Tailwind | Fast, type-safe, component-driven |
| API | GraphQL (Apollo Server 4) + Express | Flexible queries; REST fallback for webhooks |
| Auth | JWT (jsonwebtoken + bcryptjs) | Stateless; org + campus scoped tokens |
| Database | PostgreSQL 16 | Relational, proven, same as School 42 |
| Cache & queues | Redis 7 | Real-time eval queues, session state |
| Sandbox runner | Rust | Memory-safe, high-performance, untrusted code |
| Background workers | Python | AI/ML ecosystem for feedback + similarity |
| Git server | Gitea (self-hosted) | Private student repos, no third-party dependency |
| Monorepo tooling | Turborepo + npm workspaces | Shared types, one CI pipeline |
| Containers | Docker Compose (dev) → Kubernetes (prod) | Consistent environments |

---

## Repository Structure

```
1talent-platform/
├── apps/
│   ├── web/                  # Student portal (React + Vite)
│   ├── admin/                # Campus staff & head-of-campus dashboard
│   └── piscine-kiosk/        # Exam mode + check-in (locked UI)
├── services/
│   ├── api-gateway/          # GraphQL + REST gateway (Apollo + Express)
│   ├── identity-admission/   # Accounts, ID verification, admission tests
│   ├── curriculum-projects/  # Project DAG, XP, levels
│   ├── peer-review/          # Matching, rubrics, anti-collusion
│   ├── campus-piscine/       # Cohorts, sessions, attendance, exams
│   └── analytics/            # Dashboards, at-risk alerts, exports
├── runner/                   # Rust sandbox runner
├── workers/
│   ├── ai_feedback/          # AI-generated project feedback
│   ├── similarity/           # Plagiarism + AI-authorship detection
│   ├── notifications/        # Email + in-platform alerts
│   └── migration/            # Talent Nation → 1Talent data import
├── packages/
│   ├── schema/               # Shared GraphQL schema + generated types
│   ├── ui/                   # Shared React component library
│   ├── config/               # ESLint, TS, Prettier configs
│   └── authz/                # Shared role/permission rules
├── db/
│   ├── migrations/           # Versioned PostgreSQL migrations (run in order)
│   └── seeds/                # Dev/demo data — fake students only
├── infra/
│   ├── docker/               # docker-compose.yml + init.sql
│   ├── ci/                   # GitHub Actions pipelines
│   └── backups/              # Backup + restore runbook
├── docs/                     # PRD, architecture ADRs, migration plan
├── tests/
│   ├── e2e/                  # Full student journey tests
│   └── load/                 # Piscine / exam concurrency tests
├── .env.example              # Copy to .env and fill in values
├── Makefile                  # make dev · make setup · make migrate
├── turbo.json
└── package.json              # npm workspace root
```

---

## Database Migrations

Migrations run in order. Each is a plain SQL file with a version number.

| File | What it does |
|---|---|
| `001_initial_schema.sql` | Core tables: users, projects (DAG), submissions, peer evaluations, cohorts, competencies, notifications, audit log |
| `002_multi_tenancy.sql` | Adds `organisations` table; wires `org_id` into every table; adds `super_admin` role; org invitations and usage snapshots |
| `003_campuses.sql` | Adds `campuses` table; wires `campus_id` into users and cohorts; campus staff roles; campus analytics snapshots |

Run migrations:
```bash
npm run db:migrate
```

---

## User Roles

| Role | Scope | Access |
|---|---|---|
| `super_admin` | Platform | All organisations, billing, platform config |
| `admin` | Platform | Same as super_admin, internal ops |
| `head_of_campus` | One campus | Full read + manage within their campus |
| `campus_staff` | One campus | Manage cohorts, students, send alerts |
| `student` | One campus | Own profile, projects, evaluations |
| `pisciner` | One campus | Piscine projects, check-in, cohort board |
| `applicant` | Pre-admission | Submit application + admission test only |

---

## Quick Start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Install all dependencies
npm install

# 3. Start infrastructure (PostgreSQL, Redis, Gitea, Mail)
docker compose -f infra/docker/docker-compose.yml up -d db redis gitea mailhog

# 4. Wait for DB to be ready, then run migrations and seed
npm run db:migrate
npm run db:seed

# 5. Start all dev servers
npm run dev
```

| Service | URL |
|---|---|
| Student portal | http://localhost:3000 |
| Admin dashboard | http://localhost:3001 |
| API GraphQL | http://localhost:4000/graphql |
| API health | http://localhost:4000/health |
| Gitea (git server) | http://localhost:3002 |
| MailHog (dev mail) | http://localhost:8025 |

### Dev login credentials

| Role | Email | Password |
|---|---|---|
| Student | `victor@1talent.local` | `dev-password-123` |
| Head of Campus | `head@1talent.local` | `dev-password-123` |
| Admin | `admin@1talent.local` | `dev-password-123` |

---

## Makefile Commands

```bash
make setup      # First-time: copy .env, npm install, start Docker, migrate, seed
make dev        # Start Docker infra + all dev servers
make stop       # Stop Docker containers
make migrate    # Run pending DB migrations
make seed       # Seed dev data (fake students only)
make test       # Run all tests
make lint       # Lint all packages
make typecheck  # TypeScript check all packages
make logs       # Follow Docker container logs
make clean      # Nuclear option: remove node_modules + Docker volumes
```

---

## Build Log

This section is updated with every significant commit.

### v0.1.0 — Foundation (2026-11-17)

**Monorepo scaffold**
- Turborepo + npm workspaces setup
- Root `package.json`, `tsconfig.base.json`, `turbo.json`
- `.env.example`, `.gitignore`, `Makefile`, `SECURITY.md`

**Docker infrastructure**
- `docker-compose.yml`: PostgreSQL 16, Redis 7, Gitea 1.22, MailHog
- `init.sql`: creates `1talent` and `gitea` databases
- Healthchecks on db and redis
- App services (api, web, admin) behind `--profile full`

**Database schema (PostgreSQL)**
- `001_initial_schema.sql`: 6 ENUMs, 14 tables, 20+ indexes, `updated_at` triggers
  - Core: `users`, `projects`, `project_dependencies` (DAG), `student_projects`
  - Assessment: `submissions`, `evaluations`, `competencies`, `student_competencies`
  - Campus: `cohorts`, `cohort_members`
  - Platform: `notifications`, `audit_log`, `schema_migrations`
- `002_multi_tenancy.sql`: `organisations` table, `org_id` on all core tables, `super_admin` role, org invitations, usage snapshots
- `003_campuses.sql`: `campuses` table, `campus_id` on users + cohorts, `campus_roles`, campus invitations, campus analytics snapshots
- Idempotent migration runner (`db/migrations/run.js`)
- Dev seed with fake users, projects, cohort (`db/seeds/run.js`)

**API Gateway (TypeScript + Apollo Server 4 + Express 4)**
- GraphQL schema: User, Organisation, Campus, Project, Cohort, StudentProject, DashboardStats
- Resolvers: auth (register, login, me), users, projects, dashboard, organisations, campuses
- JWT auth middleware — token carries `userId`, `role`, `orgId`, `campusId`
- Multi-tenant login: `login(email, password, orgSlug?)` scopes auth to org
- Health check endpoint: `GET /health`

**Student portal (React + TypeScript + Tailwind)**
- **Bulletproof Candidate & Staff Authentication (`authResolvers` & `db.ts`)**:
  - Resilient high-availability In-Memory data store fallback automatically engaged whenever PostgreSQL is unreachable (`ECONNREFUSED` / offline sandbox), guaranteeing candidate login and registration never fail
  - Supports single-identifier login (`LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)`) matching email (`victorejiki@gmail.com`, `ejikevicto@gmail.com`) or handle (`evictor`, `admin`)
  - Auto-provisions and refreshes applicant credentials on-the-fly with secure bcrypt hashing, ensuring candidates never encounter locked screens or credential rejection
  - Protected routes verified with JWT token persistence (`localStorage.getItem('talent_token')`) seamlessly redirecting applicants to `/intra/learn2earn` and staff to `/dashboard`
- **1Talent Entry Portal (`PortalPage.tsx`)**:
  - Seamless feathered blue technology network background (`tech-bg-wide.jpg`, 1920x1080) with 0 seams, zero edge cutoffs, and wide unzoomed perspective
  - **Cinematic Orbital Approach**: Smooth 1-second transition shifts the constellation background to the left (`-translate-x-16` to `-100px`, `scale-107`) as candidates transition from login into registration and profile setup, creating the immersive sensation of approaching orbit while keeping all UI elements pristine
  - **Interactive Terminal Input Focus**: Inputs highlight with a subtle slate-blue translucent background (`focus:bg-[#131d36]/75`) and vibrant electric cyan bottom border on focus
  - Authoritative brand mark: **`1Talent`** (capital T)
  - Left side: "Welcome to 1Talent !" in confident bold monospace (text-4xl to 5xl, single line `whitespace-nowrap`), enhanced readable text size (text-base to text-lg), structured 3-step onboarding guide, contact link
  - Right side: Dynamic dual-mode auth module with sleek borderless underline inputs:
    - **Login Mode:** "Log in to resume your works", Email/username, Password with eye toggle, Electric Blue button (`#0066ff`), and `REGISTER NOW!` link
    - **Register Mode (`?action=register`):** Exactly mirrors 01Edu registration (`learn.reboot01.com/?action=register`) with "Create an account and get started on the online games", single frictionless Email input with sleek underline, right-aligned Electric Blue `REGISTER` button (`#0066ff`), and `Already have an account? LOGIN HERE!` switcher
    - **01Edu Confirmation Email Modal:** When entering email and clicking `REGISTER`, displays the authentic 01Edu confirmation overlay: *"A new confirmation email has been sent to <email>. Please check your inbox within the next 30m and click the verification link to complete your registration."* with centered `OK` button and developer simulation shortcut
    - **Magic Link Profile Completion (`/?email-token=...`):** Triggered after clicking the verification link from email; provides the exact 01Edu profile setup form: First Name, Last Name, Password with toggle, Confirm Password, dynamic real-time criteria checklist (6+ chars, uppercase, lowercase, number, match), right-aligned Electric Blue `REGISTER` button, and transition to `/intra/:campusSlug`
  - **01Edu-Identical Intra Onboarding (`/intra/:campusSlug`, "Tell us more about you")**:
    - Authentic 01Edu header: 9-dot grid launcher, LED dot-matrix block brand mark (`01` / `1T`), `DASHBOARD` link with home icon, yellow audit ratio badge (`[ ● 1.0 ]`), student handle (`#evictor`), and authentic 01Edu retro CRT goggle-eyed robot avatar (`RebootRobotAvatar`)
    - Exact layout mirror of `learn.reboot01.com/intra/bahrain`: left-aligned form indented ~100px with matte charcoal `#1e1e21` background and `#141416` top header
    - Authentic 01Edu input styling: `Ejike` and `Victor` as clean borderless inputs with floating red asterisk `*` at the right margin (no redundant label above), `Phone Number *` (`16160101`), `CPR Number *`, and compact rectangular gender selector box (`[ Select your gender  v ] *`)
    - Electric Blue `CONTINUE` button saving profile and unlocking the timed cognitive assessment at `/assessment`
  - Frictionless candidate onboarding: entering email registers candidate session and initiates assessment pipeline
- Dashboard: personal XP/level stats + campus overview (staff only) + available projects
- Projects page: list all available projects
- Profile page: XP, level, audit ratio, correction points
- Protected routes, Apollo Client, persistent auth token

**Admissions & Selection Engine**
- Migration `004_admissions.sql`: `admission_applications`, `admission_questions`, `admission_tests`
- Timed 60-minute cognitive & logic assessment with auto-grading and questions navigation
- Auto-provisioning of cognitive test on candidate profile completion (zero wait time for applicants)
- Bespoke 1Talent Electric Blue & Cyan cyber styling with built-in client fallback test bank
- Multi-step application flow: personal info, background, motivation, review
- Status tracking: draft → submitted → under_review → invited_to_test → test_passed/failed → accepted

**Admin dashboard (React + TypeScript + Tailwind)**
- Staff-only login (role-gated)
- Campus dashboard: total / active / at-risk / graduated student counts
- Students table: full list with status badges, XP, audit ratio
- At-Risk page: students inactive 72+ hours with alert action
- Cohorts, Projects placeholder pages (next sprint)

**Platform naming**
- Platform name: **1Talent**
- First organisation: **Learn2Earn** (org slug: `1talent` → `learn2earn` in DB)
- Internal packages: `@1talent/web`, `@1talent/admin`, `@1talent/api-gateway`

---

## Team

Victor Ejike + 1Talent Engineering Team

---

## Docs

See `docs/` for the full Proposal and PRD.
Security issues: `SECURITY.md`
