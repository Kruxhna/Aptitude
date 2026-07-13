# Phase 1: Foundation & Scaffolding - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-13
**Phase:** 1-Foundation & Scaffolding
**Areas discussed:** Monorepo, DB Schemas, Docker Dev

---

## Monorepo

| Option | Description | Selected |
|--------|-------------|----------|
| Bun Workspaces | Unified lockfile, fast installs, good workspace linking | ✓ |
| npm Workspaces | Standard built-in Node workspaces with unified lockfile | |
| Completely Independent | Simple isolated directories with separate package.json files and lockfiles | |
| You decide | Select the most standard/cleanest approach | |

**User's choice:** Bun Workspaces (Recommended)

---

## DB Schemas

| Option | Description | Selected |
|--------|-------------|----------|
| Single collection + optional fields | A single flexible schema where fields like options and imagePath are optional (simplest for Mongo) | ✓ |
| Mongoose discriminators | Separate sub-schemas for MCQ, numerical, and visual types that inherit from a base question schema | |
| You decide | Keep it simple and idiomatic for MongoDB | |

**User's choice:** Single collection + optional fields (Recommended)

---

## Docker Dev

| Option | Description | Selected |
|--------|-------------|----------|
| Bind mounts | Use bind mounts for /api and /engine with nodemon/uvicorn --reload so code changes sync instantly without image rebuilds | ✓ |
| Rebuild container | Rebuild docker image on change (safe, no host dependencies, but extremely slow) | |
| You decide | Standard quick-iteration setup | |

**User's choice:** Bind mounts (Recommended)

---

## the agent's Discretion

- Monorepo TypeScript/ESLint setups: Copy configs per service independently.
- Monorepo root script coordination: `concurrently` package used in root package.json.
- Dockerfile structure: service-local Dockerfiles (`/api/Dockerfile`, `/engine/Dockerfile`).
- DB Schema: Visual asset images stored as paths/URLs, user ratings embedded in User document, rating history saved in session logs.
- Docker Dev: Metro packager run on the host machine, Named Docker volumes used for databases, database ports exposed to host.

## Deferred Ideas

None.
