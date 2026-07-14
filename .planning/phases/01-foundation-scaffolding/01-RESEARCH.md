# Phase 1: Foundation & Scaffolding - Research

**Researched:** 2026-07-14
**Phase:** 01-foundation-scaffolding

## Monorepo Structure

### Bun Workspaces with Multi-Language Services

Bun workspaces only manage JavaScript/TypeScript dependencies. The Python/FastAPI engine must be self-contained with its own `requirements.txt` / `pyproject.toml`.

**Root `package.json`:**
```json
{
  "private": true,
  "workspaces": ["client", "api"]
}
```
Note: `/engine` is NOT a Bun workspace (it's Python). Only `/client` and `/api` are JS workspaces.

**Key finding:** An anonymous volume for `node_modules` is critical when using bind mounts in Docker:
```yaml
volumes:
  - ./api:/app
  - /app/node_modules  # Prevents host node_modules from overriding container's
```

**Recommended directory structure:**
```
gate-aptitude-trainer/
├── client/                 # React Native (Expo) — run on host
│   ├── package.json
│   └── ...
├── api/                    # Node.js/Express — runs in Docker
│   ├── package.json
│   ├── Dockerfile
│   ├── src/
│   │   ├── index.js        # Express entry point
│   │   ├── routes/          # Express route handlers
│   │   ├── models/          # Mongoose schemas
│   │   ├── middleware/      # Auth mock, error handler
│   │   └── config/         # Database connection, env config
│   └── ...
├── engine/                 # Python/FastAPI — runs in Docker
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── routers/         # FastAPI route handlers
│   │   ├── models/          # Pydantic data models
│   │   └── services/        # ELO calculation logic
│   └── ...
├── docker-compose.yml      # Orchestrates api, engine, mongo, redis
├── package.json            # Root workspace config + concurrently scripts
├── bun.lock                # Unified lockfile
├── .env                    # Environment variables
├── .env.example            # Template for env vars
├── .dockerignore
└── .gitignore
```

## MongoDB Schema Design

### Question Schema (Single Collection, Optional Fields)

Per user decision (D-05), using a single flexible schema rather than discriminators:

```javascript
const questionSchema = new Schema({
  // Core fields (all question types)
  text: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'numerical', 'spatial'], required: true },
  skill: { type: String, enum: ['verbal', 'quantitative', 'logical', 'spatial'], required: true },
  difficulty: { type: Number, default: 1000 },  // ELO-style difficulty rating
  explanation: { type: String, required: true },
  active: { type: Boolean, default: true },
  
  // MCQ-specific (optional)
  options: [{ type: String }],          // Array of 4 option strings
  correctOptionIndex: { type: Number }, // 0-based index
  
  // Numerical-specific (optional)
  correctAnswer: { type: Number },
  tolerance: { type: Number, default: 0 },
  
  // Spatial/image-specific (optional)
  imagePath: { type: String },           // e.g., "/assets/spatial/q1.png"
  imageOptions: [{ type: String }],      // Array of image paths for options
  correctImageIndex: { type: Number },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  timesAnswered: { type: Number, default: 0 },
  timesCorrect: { type: Number, default: 0 },
});

// Compound indexes (D from PITFALLS.md)
questionSchema.index({ skill: 1, difficulty: 1, active: 1 });
questionSchema.index({ type: 1, skill: 1 });
```

### User Schema

```javascript
const userSchema = new Schema({
  name: { type: String, default: 'Mock User' },
  email: { type: String },
  
  // Per-skill ELO ratings (embedded per D-07)
  ratings: {
    verbal: { type: Number, default: 1000 },
    quantitative: { type: Number, default: 1000 },
    logical: { type: Number, default: 1000 },
    spatial: { type: Number, default: 1000 },
  },
  
  // Gamification
  totalXp: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  streakFreezeAvailable: { type: Boolean, default: true },
  lastSprintDate: { type: Date },
  
  // Adaptive metadata
  sessionsCompleted: { type: Number, default: 0 }, // Used for K-factor decay
  
  createdAt: { type: Date, default: Date.now },
});
```

### Quiz Session Schema

```javascript
const quizSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sprintType: { type: String, enum: ['quick', 'standard', 'deep'], required: true },
  
  // Per-question responses
  responses: [{
    questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
    answer: Schema.Types.Mixed,       // String for MCQ, Number for numerical
    correct: { type: Boolean },
    timeMs: { type: Number },          // Response time in milliseconds
  }],
  
  // Post-sprint metrics
  accuracy: { type: Number },          // 0-1 percentage
  totalTimeMs: { type: Number },
  xpEarned: { type: Number },
  
  // ELO snapshot at time of submission (D-08)
  ratingsAfter: {
    verbal: Number,
    quantitative: Number,
    logical: Number,
    spatial: Number,
  },
  
  completedAt: { type: Date, default: Date.now },
});

quizSessionSchema.index({ userId: 1, completedAt: -1 });
```

## Docker Compose Configuration

### Key Patterns

1. **Build context from root** — Set build context to `.` (root) even for subdirectory Dockerfiles
2. **Anonymous volume for node_modules** — Prevents host `node_modules` from conflicting with container
3. **Health checks with `depends_on: condition: service_healthy`** — Not just `service_started`
4. **Named volumes** for MongoDB and Redis persistence

### Dockerfile: Node.js API (Development)

```dockerfile
FROM node:22-alpine

WORKDIR /app
COPY api/package.json api/bun.lock* ./
RUN npm install
COPY api/ .
EXPOSE 3000
CMD ["npx", "nodemon", "src/index.js"]
```

### Dockerfile: FastAPI Engine (Development)

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY engine/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY engine/ .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### docker-compose.yml Structure

```yaml
services:
  api:
    build:
      context: .
      dockerfile: api/Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./api:/app
      - /app/node_modules
    environment:
      - MONGO_URI=mongodb://mongo:27017/aptitude
      - REDIS_URL=redis://redis:6379
      - ENGINE_URL=http://engine:8000
    depends_on:
      mongo:
        condition: service_healthy
      redis:
        condition: service_healthy

  engine:
    build:
      context: .
      dockerfile: engine/Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./engine:/app
    environment:
      - MONGO_URI=mongodb://mongo:27017/aptitude
    depends_on:
      mongo:
        condition: service_healthy

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mongodb_data:
  redis_data:
```

## Inter-Service Communication

### Node.js → FastAPI via HTTP

**Node.js side (axios):**
```javascript
const axios = require('axios');

const engineClient = axios.create({
  baseURL: process.env.ENGINE_URL || 'http://engine:8000',
  timeout: 5000,
});

// Example: Request next questions
const response = await engineClient.post('/calculate-next', {
  userId: user._id,
  skillRatings: user.ratings,
});
```

**FastAPI side (endpoint):**
```python
from pydantic import BaseModel

class SkillRatings(BaseModel):
    verbal: float = 1000
    quantitative: float = 1000
    logical: float = 1000
    spatial: float = 1000

class NextQuestionRequest(BaseModel):
    userId: str
    skillRatings: SkillRatings

@app.post("/calculate-next")
async def calculate_next(request: NextQuestionRequest):
    # Stub: return mock question IDs
    return {"questionIds": [], "message": "Stub - engine not yet implemented"}
```

### Health Check Endpoints

Both services need a `/health` endpoint for Docker Compose health checks:

**Express:** `GET /health` → `{ status: "ok", service: "api" }`
**FastAPI:** `GET /health` → `{ status: "ok", service: "engine" }`

## Mock User Middleware (INFR-03)

```javascript
// middleware/mockUser.js
const MOCK_USER_ID = '000000000000000000000001'; // Fixed ObjectId

const mockUserMiddleware = (req, res, next) => {
  req.userId = MOCK_USER_ID;
  next();
};
```

Ensure the mock user exists in MongoDB via a seed script or on-demand creation.

## Key Dependencies

### Node.js API (`/api/package.json`)
- `express` ^5.0 — Web framework
- `mongoose` ^8.0 — MongoDB ODM
- `ioredis` ^5.0 — Redis client
- `axios` ^1.7 — HTTP client (for engine calls)
- `cors` ^2.8 — CORS middleware
- `helmet` ^8.0 — Security headers
- `zod` ^3.23 — Request validation
- `dotenv` ^16.0 — Environment variables
- `nodemon` (dev) — Live reload

### Python Engine (`/engine/requirements.txt`)
- `fastapi` >=0.115 — Web framework
- `uvicorn[standard]` >=0.32 — ASGI server
- `pydantic` >=2.9 — Data validation
- `numpy` >=2.1 — Math (ELO calculations)
- `httpx` >=0.28 — Async HTTP client

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Bun lockfile conflicts on Windows | Use `bun.lock` in `.gitattributes` as binary |
| Docker bind mount performance on Windows | Use WSL2 backend for Docker Desktop |
| MongoDB connection race condition | Health checks + `depends_on: condition: service_healthy` |
| Port 3000/8000 conflicts | Use `.env` for configurable port mapping |

---
*Researched: 2026-07-14*

## RESEARCH COMPLETE
