# 1Talent — Database Schema

## Core Tables

| Table | Purpose |
|---|---|
| `users` | All users — applicants through admins. Includes XP, level, audit ratio, correction points |
| `admission_tests` | Records of admission coding tests |
| `cohorts` | Piscine and main curriculum cohorts |
| `cohort_members` | Many-to-many: users ↔ cohorts |
| `projects` | Curriculum projects with rubric and XP |
| `project_dependencies` | DAG edges — prerequisite relationships |
| `student_projects` | Each student's status per project |
| `submissions` | Git commit submissions with test results |
| `evaluations` | Peer review sessions |
| `competencies` | Skill competency taxonomy |
| `student_competencies` | Each student's competency scores |
| `notifications` | In-platform notifications |
| `audit_log` | Immutable log of all significant actions |
| `schema_migrations` | Applied migration tracking |

## Key Relationships

- One user → many student_projects (their curriculum progress)
- One student_project → many submissions (retries allowed)
- One submission → many evaluations (graded by multiple peers)
- projects form a DAG via project_dependencies
- users belong to cohorts via cohort_members
