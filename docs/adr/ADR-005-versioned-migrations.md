# ADR-005 — Versioned SQL Migrations, Never Destructive

**Date:** 2026-11-17
**Status:** Accepted

## Decision

All database changes are made through numbered SQL migration files in `db/migrations/`. Migrations are:
- **Forward-only** in production (no rollback scripts)
- **Additive only** (no DROP TABLE, no DROP COLUMN, no ALTER COLUMN type changes)
- **Idempotent** — the migration runner checks `schema_migrations` before applying
- **Reviewed before merge** — no migration merges to `main` without a second engineer reading it

## Why This Prevents a Rebuild

01Edu had to migrate all student progress data when they restructured their schema mid-operation. This caused hours of downtime and lost some edge-case data.

School 42 still carries deprecated columns in production because nobody dared touch them — there was no safe migration path.

Our rule: **if you need to change something, add alongside the old, then deprecate, then remove.**

Example — renaming `full_name` to `display_name`:
```sql
-- Migration 010: add new column
ALTER TABLE users ADD COLUMN display_name VARCHAR(255);
UPDATE users SET display_name = full_name;

-- Migration 011 (3 sprints later, after all code uses display_name):
ALTER TABLE users RENAME COLUMN full_name TO _deprecated_full_name;

-- Migration 020 (after confirming zero reads):
ALTER TABLE users DROP COLUMN _deprecated_full_name;
```

## Consequence

- The `schema_migrations` table is the source of truth for what version the DB is at
- `npm run db:migrate` is safe to run any time — it only applies unapplied migrations
- Rolling back a bad deploy means rolling back the application code — the DB stays forward
- Student data is never at risk from a migration
