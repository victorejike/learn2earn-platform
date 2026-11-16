# ADR-002 — Modular Monolith First, Microservices Later

**Date:** 2026-11-17
**Status:** Accepted

## Decision

Start with a **modular monolith**: one deployed Node.js process, with clear module boundaries (identity, curriculum, peer-review, campus, analytics). Split into separate services only when a specific module's load demands it.

## Why 01Edu and 42 Had Problems

01Edu began as a monolith and later attempted to distribute services without clear contracts between them. This caused data consistency bugs, cascade failures, and painful migrations.

School 42's "Intra" is still a Rails monolith after 10+ years because breaking it apart mid-flight was too risky.

## Our Approach

The service folders (`services/identity-admission`, `services/curriculum-projects`, etc.) are **modules**, not separate deployments. They share a database connection and are imported by the API gateway. The boundaries are enforced by code ownership, not by network.

When one module genuinely needs to scale independently (e.g., the sandbox runner under Piscine load), it gets extracted. The GraphQL schema is the contract — it does not change when a module is extracted.

## Consequence

- Local development: `npm run dev` starts everything. No Kubernetes needed.
- The `runner/` (Rust sandbox) is already a separate process — it executes untrusted code and must be isolated.
- The Python workers (`workers/`) are already separate — they run async jobs.
- Everything else shares one process until load forces a split.
