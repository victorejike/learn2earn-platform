# ADR-003 — PostgreSQL over NoSQL

**Date:** 2026-11-17
**Status:** Accepted

## Decision

Use **PostgreSQL** as the primary database. No MongoDB, no Firestore, no DynamoDB.

## Why

The core data in 1Talent is highly relational:
- A `submission` belongs to a `student_project` → `project` → `user` → `campus` → `org`
- An `evaluation` joins `submission`, `reviewer`, `reviewee`, `rubric`
- The curriculum is a **DAG** (Directed Acyclic Graph) — `project_dependencies` is a self-referencing table

Document databases make DAG traversal, join-heavy queries, and audit trails painful. PostgreSQL handles all of these natively.

**School 42 uses PostgreSQL.** So does every serious educational platform that has tried to understand student progression at scale.

## Consequence

- All migrations are plain SQL, versioned, and idempotent
- The `project_dependencies` table is the curriculum graph — adding a prerequisite is one `INSERT`
- Foreign keys enforce data integrity at the DB level, not just at the application level
- `audit_log` is append-only and immutable — no document store guarantees that

## Migration safety rule

**Never write a destructive migration.** Only `ADD COLUMN`, `CREATE TABLE`, `CREATE INDEX`. If a column must be removed, rename it to `_deprecated_X` and stop writing to it. Remove it in a later migration after confirming no reads remain.

This is why we will never need to rebuild the database from scratch.
