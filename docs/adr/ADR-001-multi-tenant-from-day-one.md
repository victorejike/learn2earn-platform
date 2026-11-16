# ADR-001 — Multi-Tenant Architecture from Day One

**Date:** 2026-11-17
**Status:** Accepted

## Decision

Build 1Talent as a multi-tenant SaaS platform from the first commit — not as a single-org tool that gets multi-tenancy retrofitted later.

Every table has an `org_id` and `campus_id` from migration 001. The JWT token carries `orgId` and `campusId`. Every resolver checks the caller's org scope before returning data.

## Why

01Edu had to rebuild significant parts of their infrastructure when they began licensing their platform to other schools (Zone01 Rouen, Qwasar, etc.). The original system was built for one school and org isolation was added later — a painful, disruptive process.

School 42 runs separate deployments per campus network, meaning platform updates must be rolled out manually to each site. There is no single source of truth.

We avoid both problems by making the data boundary — `org_id` and `campus_id` — load-bearing from day one. No retrofitting required.

## Consequence

- A `super_admin` can see all orgs
- An `org admin` sees only their org
- A `head_of_campus` sees only their campus
- A `student` sees only their own data
- Zero cross-org data leakage is enforced at the resolver and DB query level, not by convention

## What this means for growth

Adding a new organisation to 1Talent takes one `INSERT INTO organisations` and one `INSERT INTO campuses`. No new deployment. No new server. No code change.
