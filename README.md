# System Scalability Load Test Logger 🚀

A full-stack web portal for recording, visualizing, and analyzing load test results. Track concurrent user limits, throughput boundaries, and system degradation points with rich interactive charts.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS v3 + Recharts |
| Backend | Node.js + Express.js |
| Database | JSON file storage (atomic writes, no SQL/NoSQL server) |
| Validation | Zod schemas |
| HTTP Client | Axios |
| Routing | React Router v6 |

## Features

- **Test Session Management** — Create/edit/delete sessions with tool, environment, tester, and threshold config
- **Metrics Logging** — Track VUs, RPS, avg/p95/p99 latency, error rate, CPU/memory per data point
- **Degradation Detection** — Auto-highlights when error rate exceeds threshold or p95 latency spikes
- **Dashboard** — Summary cards + live charts powered by Recharts
- **Comparison View** — Overlay up to 5 sessions on the same chart
- **Data Import** — CSV/JSON bulk import from JMeter, k6, Locust, Gatling exports
- **REST API** — Full CRUD with Zod validation and consistent error responses

## Project Structure

```
Load-Tester-Portal/
├── client/                    # React (Vite) frontend
│   ├── src/
│   │   ├── api/               # Axios wrappers
│   │   ├── components/        # Shared UI components
│   │   │   └── charts/        # Recharts chart components
│   │   └── pages/             # Route-level page components
│   ├── tailwind.config.js
│   └── vite.config.js         # API proxy to :3001
├── server/                    # Express REST API
│   ├── data/                  # JSON file storage (auto-created)
│   │   ├── sessions.json
│   │   └── metrics.json
│   ├── src/
│   │   ├── db/                # Repository pattern (fileDb, sessionsRepo, metricsRepo)
│   │   ├── middleware/        # errorHandler, validate (Zod)
│   │   └── routes/            # health, sessions, metrics, importData
│   ├── seeds/seed.js          # Sample data generator
│   └── index.js
├── .env                       # Environment configuration
└── package.json               # Root convenience scripts
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Install Dependencies

```bash
# From the root directory:
npm run install:all

# Or manually:
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment

Edit `.env` in the project root:

```env
PORT=3001
DATA_DIR=./data
ERROR_RATE_THRESHOLD=5
P95_LATENCY_THRESHOLD=2000
NODE_ENV=development
```

### 3. Seed Sample Data

```bash
npm run seed
# Or: cd server && npm run seed
```

This generates **5 realistic load test sessions** including:
- A production baseline with degradation at 550 VUs
- A post-optimization test stable up to 700 VUs
- A dev smoke test, a running stress test, and a failed test

### 4. Start the Backend

```bash
cd server && npm run dev
# API running at http://localhost:3001
```

### 5. Start the Frontend

```bash
cd client && npm run dev
# App running at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 🚀 Deploying to Render

This project is pre-configured for seamless deployment to [Render](https://render.com) as a single **Web Service** on the free tier.

### Option 1: Automatic 1-Click / Blueprint Deploy (Recommended)

1. Push your repository to **GitHub** or **GitLab**.
2. Go to the [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Blueprint**.
3. Connect your repository. Render will automatically detect [`render.yaml`](file:///C:/Users/a/Desktop/Load%20Tester%20Portal/render.yaml) and configure:
   - **Service Name**: `load-tester-portal`
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: Automatic `JWT_SECRET` generation, `AUTO_SEED=true`, thresholds.
4. Click **Apply**. Render will install dependencies, build the React client, seed sample test data on first launch, and serve your application!

---

### Option 2: Manual Web Service Setup

If configuring manually on Render without Blueprints:

1. Click **New +** → **Web Service**.
2. Connect your Git repository.
3. Configure the following fields:
   - **Name**: `load-tester-portal` (or your chosen name)
   - **Region**: Any (e.g. `Oregon (US West)` or `Frankfurt (EU)`)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Plan Type**: `Free`

4. Add **Environment Variables** under the Environment tab:
   | Variable | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production optimizations & static assets |
   | `DATA_DIR` | `./server/data` | JSON storage directory |
   | `JWT_SECRET` | *(Click 'Generate' or enter a long random string)* | Used for signing user JWTs |
   | `JWT_EXPIRES_IN` | `7d` | Token validity |
   | `ERROR_RATE_THRESHOLD` | `5` | Degradation trigger (%) |
   | `P95_LATENCY_THRESHOLD` | `2000` | Degradation trigger (ms) |
   | `AUTO_SEED` | `true` | Auto-populates demo sessions on initial launch |

5. Click **Deploy Web Service**.
6. When the build completes, visit your assigned Render URL (e.g. `https://load-tester-portal.onrender.com`).
   - Default Demo Account: **`demo@loadportal.io`** / **`Password123!`**
   - Or click **Register New User** to create your own engineer account!

---

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Health Check

```
GET /api/health
```
```json
{ "status": "ok", "uptime": 42.3, "timestamp": "..." }
```

---

### Sessions

#### List sessions
```
GET /api/sessions
```
Query params: `environment` (dev|staging|prod), `status` (pass|fail|degraded|running|pending), `dateFrom`, `dateTo`, `search`

#### Get session
```
GET /api/sessions/:id
```

#### Create session
```
POST /api/sessions
Content-Type: application/json
```
```json
{
  "name": "Production API Baseline",
  "targetSystem": "api.example.com",
  "environment": "prod",
  "testTool": "k6",
  "testerName": "Jane Doe",
  "notes": "Q3 capacity planning test",
  "status": "pending",
  "breakingPointVU": null,
  "errorRateThreshold": 5,
  "p95LatencyThreshold": 2000
}
```

#### Update session
```
PUT /api/sessions/:id
```
All fields optional (partial update supported).

#### Delete session
```
DELETE /api/sessions/:id
```
Cascade-deletes all associated metric data points.

#### Get computed summary
```
GET /api/sessions/:id/summary
```
```json
{
  "data": {
    "totalDataPoints": 19,
    "maxConcurrentUsers": 1000,
    "maxStableUsers": 500,
    "peakThroughput": 432,
    "avgErrorRate": 8.3,
    "breakingPointVU": 550,
    "avgDegradationLatency": 2100,
    "degradationPoints": [...],
    "thresholds": { "errorRate": 5, "p95Latency": 2000 }
  }
}
```

---

### Metrics

#### List metrics for session
```
GET /api/sessions/:id/metrics
```

#### Add metric data point
```
POST /api/sessions/:id/metrics
Content-Type: application/json
```
```json
{
  "concurrentUsers": 500,
  "requestsPerSecond": 430,
  "avgLatency": 185,
  "p95Latency": 520,
  "p99Latency": 890,
  "errorRate": 3.8,
  "cpuUtilization": 74,
  "memoryUtilization": 63,
  "isDegradationPoint": false,
  "notes": "Approaching threshold"
}
```

#### Delete metric data point
```
DELETE /api/sessions/:id/metrics/:metricId
```

---

### Import

#### Bulk import from file (multipart)
```
POST /api/import
Content-Type: multipart/form-data

Fields: file (CSV or JSON), sessionId
```

#### Bulk import from JSON body
```
POST /api/import
Content-Type: application/json

{ "sessionId": "...", "metrics": [...] }
```

**Supported field names** (normalized automatically):
| Internal | JMeter | k6 |
|----------|--------|-----|
| `concurrentUsers` | `threads` | `vus` |
| `requestsPerSecond` | `Throughput` | `rps` |
| `avgLatency` | `Average` | `avg` |
| `p95Latency` | `95th` | `p95` |
| `errorRate` | `Error` | `error_rate` |

---

## Database Schema

### sessions.json
```json
{
  "sessions": [{
    "id": "uuid",
    "name": "string",
    "targetSystem": "string",
    "environment": "dev|staging|prod",
    "testTool": "JMeter|k6|Locust|Gatling|Artillery|Other",
    "testerName": "string",
    "notes": "string",
    "status": "pending|running|pass|fail|degraded",
    "breakingPointVU": "number|null",
    "errorRateThreshold": "number",
    "p95LatencyThreshold": "number",
    "createdAt": "ISO string",
    "updatedAt": "ISO string"
  }]
}
```

### metrics.json
```json
{
  "metrics": [{
    "id": "uuid",
    "sessionId": "uuid (FK → sessions.id)",
    "timestamp": "ISO string",
    "concurrentUsers": "number",
    "requestsPerSecond": "number",
    "avgLatency": "number (ms)",
    "p95Latency": "number (ms)",
    "p99Latency": "number (ms)",
    "errorRate": "number (0-100%)",
    "cpuUtilization": "number|null",
    "memoryUtilization": "number|null",
    "isDegradationPoint": "boolean",
    "notes": "string",
    "createdAt": "ISO string"
  }]
}
```

## Architecture Notes

- **Atomic writes**: JSON files are written via a temp-file + `rename()` strategy to prevent corruption
- **Per-file mutex**: In-memory promise chain serializes concurrent writes to the same file
- **Cascade deletes**: Deleting a session removes all associated metrics automatically
- **Auto status updates**: Adding a metric above the error/latency threshold auto-updates the session status
- **Vite proxy**: All `/api/*` requests from the React app are proxied to `:3001` in development

## Degradation Curve (Seed Data)

The seed generates realistic test data showing three zones:

| Zone | VU Range | Behavior |
|------|----------|----------|
| **Stable** | 0 – 500 VUs | Linear RPS growth, low latency (<200ms avg), <1% errors |
| **Degraded** | 500 – 800 VUs | Throughput plateaus, latency spikes to 2–5s, errors 5–25% |
| **Failure** | 800+ VUs | Throughput collapses, latency >5s, errors 25–80% |
