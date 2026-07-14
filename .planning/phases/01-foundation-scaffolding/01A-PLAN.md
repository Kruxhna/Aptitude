---
phase: 1
plan_id: 01A
title: "Monorepo Scaffolding & Docker Compose"
wave: 1
depends_on: []
files_modified:
  - package.json
  - .gitignore
  - .dockerignore
  - .env
  - .env.example
  - docker-compose.yml
  - api/package.json
  - api/Dockerfile
  - api/src/index.js
  - api/src/config/db.js
  - api/src/config/redis.js
  - api/src/middleware/mockUser.js
  - api/src/routes/health.js
  - engine/requirements.txt
  - engine/Dockerfile
  - engine/app/__init__.py
  - engine/app/main.py
autonomous: true
requirements:
  - INFR-01
  - INFR-02
  - INFR-03
---

# Plan 01A: Monorepo Scaffolding & Docker Compose

## Objective

Create the monorepo directory structure with Bun workspaces, scaffold the Node.js/Express API and Python/FastAPI engine with health endpoints, configure Docker Compose with all 4 services (api, engine, mongo, redis), and wire mock user middleware.

## Tasks

<task id="01A-T1">
<title>Initialize monorepo root with Bun workspaces</title>
<read_first>
- None (greenfield)
</read_first>
<action>
Create root `package.json` with:
- `"private": true`
- `"workspaces": ["client", "api"]` (engine is Python, not a JS workspace)
- `scripts.dev`: `"concurrently \"docker compose up\" \"cd client && bun start\""`
- `scripts.lint`: `"concurrently \"cd api && bun run lint\" \"cd client && bun run lint\""`
- devDependency: `concurrently`

Create `.gitignore` with: node_modules, __pycache__, .env, *.pyc, dist, .expo, mongodb_data, redis_data, bun.lock (optional)

Create `.dockerignore` with: node_modules, __pycache__, .git, .env, .planning, client, *.md

Create `.env.example` with:
- MONGO_URI=mongodb://mongo:27017/aptitude
- REDIS_URL=redis://redis:6379
- ENGINE_URL=http://engine:8000
- API_PORT=3000
- ENGINE_PORT=8000

Copy `.env.example` to `.env`
</action>
<acceptance_criteria>
- `package.json` exists at repo root with `"workspaces": ["client", "api"]`
- `bun install` succeeds at root without errors
- `.gitignore` contains `node_modules` and `__pycache__`
- `.env.example` contains MONGO_URI, REDIS_URL, ENGINE_URL
- `.env` exists as a copy of `.env.example`
</acceptance_criteria>
</task>

<task id="01A-T2">
<title>Scaffold Express API service</title>
<read_first>
- .planning/phases/01-foundation-scaffolding/01-RESEARCH.md (Key Dependencies, Mock User Middleware sections)
</read_first>
<action>
Create `api/package.json` with:
- name: `@aptitude/api`
- dependencies: express@^5, mongoose@^8, ioredis@^5, axios@^1, cors@^2, helmet@^8, zod@^3, dotenv@^16
- devDependencies: nodemon
- scripts.dev: `nodemon src/index.js`
- scripts.start: `node src/index.js`

Create `api/src/index.js`:
- Import express, cors, helmet, dotenv
- Load env from dotenv
- Apply helmet(), cors()
- Apply mockUser middleware globally
- Mount health route at `/health`
- Mount placeholder routes at `/api/sprint`, `/api/users`, `/api/leaderboard`
- Connect to MongoDB via `config/db.js`
- Connect to Redis via `config/redis.js`
- Start server on `process.env.API_PORT || 3000`

Create `api/src/config/db.js`:
- Export async function `connectDB()` that connects to `process.env.MONGO_URI`
- Log connection success/failure

Create `api/src/config/redis.js`:
- Export Redis client using ioredis connecting to `process.env.REDIS_URL`
- Handle connection events (connect, error)

Create `api/src/middleware/mockUser.js`:
- Set `req.userId` to fixed ObjectId string `'000000000000000000000001'`
- Export as default middleware function

Create `api/src/routes/health.js`:
- GET `/health` returns `{ status: "ok", service: "api", timestamp: new Date() }`
</action>
<acceptance_criteria>
- `api/package.json` has express, mongoose, ioredis, axios as dependencies
- `api/src/index.js` creates Express app with cors, helmet, and mockUser middleware
- `GET /health` returns `{ status: "ok", service: "api" }` with 200
- `api/src/config/db.js` exports `connectDB` function using MONGO_URI env var
- `api/src/config/redis.js` exports ioredis client using REDIS_URL env var
- `api/src/middleware/mockUser.js` sets `req.userId` to `'000000000000000000000001'`
</acceptance_criteria>
</task>

<task id="01A-T3">
<title>Scaffold FastAPI engine service</title>
<read_first>
- .planning/phases/01-foundation-scaffolding/01-RESEARCH.md (FastAPI endpoint section)
</read_first>
<action>
Create `engine/requirements.txt`:
- fastapi>=0.115
- uvicorn[standard]>=0.32
- pydantic>=2.9
- numpy>=2.1
- httpx>=0.28

Create `engine/app/__init__.py` (empty)

Create `engine/app/main.py`:
- Import FastAPI
- Create app instance with title="GATE Aptitude Engine"
- GET `/health` returns `{ status: "ok", service: "engine" }`
- POST `/calculate-next` accepts `{ userId: str, skillRatings: { verbal, quantitative, logical, spatial } }` via Pydantic model, returns stub `{ questionIds: [], message: "Stub" }`
- POST `/update-rating` accepts `{ userId: str, responses: list }` via Pydantic model, returns stub `{ newRatings: {}, xpEarned: 0 }`
</action>
<acceptance_criteria>
- `engine/requirements.txt` contains fastapi, uvicorn, pydantic, numpy
- `engine/app/main.py` creates FastAPI app with title "GATE Aptitude Engine"
- `GET /health` returns `{ status: "ok", service: "engine" }` with 200
- `POST /calculate-next` accepts JSON body and returns stub response
- `POST /update-rating` accepts JSON body and returns stub response
</acceptance_criteria>
</task>

<task id="01A-T4">
<title>Create Dockerfiles and docker-compose.yml</title>
<read_first>
- .planning/phases/01-foundation-scaffolding/01-RESEARCH.md (Docker Compose Configuration section)
- api/package.json
- engine/requirements.txt
</read_first>
<action>
Create `api/Dockerfile`:
- FROM node:22-alpine
- WORKDIR /app
- COPY api/package.json api/bun.lock* ./
- RUN npm install
- COPY api/ .
- EXPOSE 3000
- CMD ["npx", "nodemon", "src/index.js"]

Create `engine/Dockerfile`:
- FROM python:3.12-slim
- WORKDIR /app
- COPY engine/requirements.txt .
- RUN pip install --no-cache-dir -r requirements.txt
- COPY engine/ .
- EXPOSE 8000
- CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

Create `docker-compose.yml` at repo root with 4 services:
1. `api`: build from api/Dockerfile, ports 3000:3000, bind mount ./api:/app with anonymous /app/node_modules, env vars MONGO_URI/REDIS_URL/ENGINE_URL, depends_on mongo+redis with service_healthy
2. `engine`: build from engine/Dockerfile, ports 8000:8000, bind mount ./engine:/app, env var MONGO_URI, depends_on mongo with service_healthy
3. `mongo`: image mongo:7, ports 27017:27017, named volume mongodb_data:/data/db, healthcheck using mongosh ping
4. `redis`: image redis:7-alpine, ports 6379:6379, named volume redis_data:/data, healthcheck using redis-cli ping

Declare named volumes: mongodb_data, redis_data
</action>
<acceptance_criteria>
- `api/Dockerfile` uses node:22-alpine base image
- `engine/Dockerfile` uses python:3.12-slim base image
- `docker-compose.yml` defines 4 services: api, engine, mongo, redis
- mongo service has healthcheck using `mongosh --eval "db.adminCommand('ping')"`
- redis service has healthcheck using `redis-cli ping`
- api service depends_on mongo and redis with `condition: service_healthy`
- Named volumes `mongodb_data` and `redis_data` are declared
- `docker compose config` validates without errors
</acceptance_criteria>
</task>

## Verification

```bash
# Validate docker-compose
docker compose config

# Start all services
docker compose up -d

# Check health endpoints
curl http://localhost:3000/health
curl http://localhost:8000/health

# Verify mock user middleware
curl http://localhost:3000/api/sprint  # Should work without auth

# Check MongoDB connection
docker compose exec mongo mongosh --eval "db.adminCommand('ping')"

# Check Redis connection
docker compose exec redis redis-cli ping
```

## must_haves
- [ ] `docker compose up` starts all 4 services without errors
- [ ] API health endpoint responds at localhost:3000/health
- [ ] Engine health endpoint responds at localhost:8000/health
- [ ] MongoDB and Redis are accessible from host (ports 27017, 6379)
- [ ] Mock user middleware is applied on all API routes

## Artifacts this phase produces
- `/package.json` — Root workspace config
- `/docker-compose.yml` — Service orchestration
- `/api/Dockerfile` — API container definition
- `/engine/Dockerfile` — Engine container definition
- `/api/src/index.js` — Express entry point with middleware chain
- `/api/src/config/db.js` — MongoDB connection helper
- `/api/src/config/redis.js` — Redis client export
- `/api/src/middleware/mockUser.js` — Mock auth middleware
- `/api/src/routes/health.js` — Health endpoint
- `/engine/app/main.py` — FastAPI entry point with stub endpoints
