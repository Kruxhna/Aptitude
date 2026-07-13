# Phase 1: Foundation & Scaffolding - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the monorepo structure, Docker Compose development environment, MongoDB database schemas, Express + FastAPI service stubs, and verify end-to-end HTTP inter-service communication.

</domain>

<decisions>
## Implementation Decisions

### Monorepo
- **D-01:** Use Bun Workspaces to orchestrate the monorepo. This provides a unified lockfile, fast installs, and clean workspace linking.
- **D-02:** Use independent TypeScript/ESLint configurations copied per-service (in `/client`, `/api`, `/engine`) to avoid complex workspace dependency sharing and configuration bundling in v1.
- **D-03:** Use the `concurrently` package in the root `package.json` to coordinate scripts (e.g. running linting, building, or launching dev modes across workspaces).
- **D-04:** Store Dockerfiles locally in each service directory (e.g., `/api/Dockerfile` and `/engine/Dockerfile`) and orchestrate them from the root using `docker-compose.yml`.

### DB Schemas
- **D-05:** Store MCQ, numerical, and visual/image-based questions in a single flexible `questions` collection in MongoDB, utilizing optional schema fields (like `options` and `imagePath`) rather than Mongoose discriminators.
- **D-06:** Store relative file paths (e.g., `/assets/spatial/q1.png`) for visual spatial puzzle assets and serve them statically from the Node.js API server (preparing for CDN/S3 URLs in the future).
- **D-07:** Embed the user's current ELO ratings (`{ verbal, quant, logical, spatial }`) directly in the `User` document rather than a separate collection.
- **D-08:** Save updated ELO ratings inside each quiz session entry in the `quiz_sessions` collection upon submission to track historical rating changes for analytics plotting.

### Docker Dev
- **D-09:** Sync local edits inside the containers using bind mounts for `/api` and `/engine` and run development servers with live reload enabled (`nodemon` / `uvicorn --reload`).
- **D-10:** Run the React Native Metro bundler directly on the host machine using Bun/npm to ensure easy connectivity with simulators, emulator, and physical test devices via Expo Go. Run API, engine, MongoDB, and Redis in Docker.
- **D-11:** Persist MongoDB and Redis data across restarts using Docker named volumes.
- **D-12:** Expose MongoDB (27017) and Redis (6379) ports to the host machine to support direct connectivity from external database GUI clients (like MongoDB Compass or TablePlus) during development.

### the agent's Discretion
None explicitly declared; the developer retains flexibility for specific library selections, file layouts, and routing architectures that conform to the stack (e.g., Express 5.x router, FastAPI async setup).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/PROJECT.md` — Core value, tech stack constraints, and out-of-scope definitions
- `.planning/REQUIREMENTS.md` — v1 requirements (INFR-01, INFR-02, INFR-03, INFR-04, CONT-02, CONT-03, ADPT-05)
- `.planning/ROADMAP.md` — Phase 1 goals and success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
None — this is a greenfield project setup.

### Established Patterns
None — this phase defines the repository patterns.

### Integration Points
None — this phase sets up the initial directories and containers.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Foundation & Scaffolding*
*Context gathered: 2026-07-13*
