# ADR-004 — Rust Sandbox for Student Code Execution

**Date:** 2026-11-17
**Status:** Accepted

## Decision

The code execution sandbox (`runner/`) is written in Rust and runs as a fully isolated process. It has:
- No network access
- No access to the main database
- Strict CPU, memory, and wall-clock time limits
- One ephemeral container per submission — destroyed immediately after

## Why

01Edu and School 42 both use Docker containers for code execution, but their sandbox management is written in Ruby/Go and has had escape vulnerabilities over the years (students finding ways to persist state between runs or access host resources).

Rust gives us memory safety without a garbage collector. A bug in the sandbox runner cannot corrupt memory in an adjacent process. Combined with no-network + no-db constraints, even a compromised container cannot do meaningful damage.

## Consequence

- The runner communicates with the API gateway only over a local Unix socket with a shared secret
- Test results are written to object storage, not to the main DB directly — the API gateway reads them and writes to the DB
- A runner crash does not crash the API — it returns a timeout error to the student

## What this means for Piscine load

During a Piscine, 30+ students may submit simultaneously. The runner spawns containers in a pool, enforcing the per-language resource profiles in `runner/profiles/`. Campus staff can see the queue depth in the analytics dashboard.
