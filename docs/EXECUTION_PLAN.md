# iScribe Frontend + tScribe Backend: End-to-End Execution Plan

This document is self-contained. It includes context, architecture, configuration, and step-by-step instructions to fix the file management errors (downloads/uploads/SSE), ensure networking works on Linux Docker, stabilize the backend on port 3003, and validate the entire flow.

## Context

- Repo (this window): iScribe — an Express server that serves static UI from `public/` and proxies all `/api/*` requests to the tScribe backend.
- Target host: `meatpi` (Raspberry Pi). Frontend runs on port `3008`. Backend (tScribe) should run on port `3003`.
- Current issue: File manager errors and failing API calls. Root causes:
  - The proxy in `server.js` uses Axios and returns `res.json(...)`, which breaks streaming for downloads, file uploads (multipart), and SSE.
  - Docker on Linux lacks `host.docker.internal` by default, causing `ENOTFOUND host.docker.internal` and backend reachability failures.
  - tScribe was not consistently running on `3003` and had missing modules (e.g., `jobQueueService`).

## Goals

1) Preserve streaming in the proxy (downloads/uploads/SSE).  
2) Make frontend (Docker) reliably reach backend on Linux.  
3) Ensure tScribe is stable and listening on `3003`.  
4) Validate end-to-end UI flows.

## Architecture Overview

- iScribe (this app)
  - Serves UI from `public/`
  - Proxies `/api/*` to tScribe
  - Health: `/api/health` (reports frontend and backend status)
- tScribe (backend)
  - Provides `/api/files`, `/api/download/:filename`, `/api/transcribe`, `/api/progress/:jobId`, `/api/queue`, etc.

## Phase 1 — Fix tScribe backend on meatpi

1. Ensure port 3003:
```
ssh meatpi "cd ~/tScribe && sed -i 's/^PORT=.*/PORT=3003/' .env && grep '^PORT=' .env"
```

2. Install deps and ensure services present:
```
ssh meatpi "cd ~/tScribe && npm install"
```
If `services/jobQueueService.js` is missing, create a minimal implementation that supports: `addJob`, `getJobStatus`, `getQueueStatus`, `cancelJob`, `clearCompleted`, and a simple in-memory queue with limited concurrency.

3. Start/restart with PM2 and verify:
```
ssh meatpi "cd ~/tScribe && pm2 start server.js --name tscribe || pm2 restart tscribe"
ssh meatpi "sudo lsof -i :3003"
curl -s http://meatpi:3003/api/health
```

## Phase 2 — Replace Axios proxy with stream-preserving proxy

1. Add dependency in iScribe:
```
cd /Users/inggo/Documents/iScribe
npm i http-proxy-middleware
```

2. Edit `server.js` to keep `/api/health` local but proxy all other `/api/*` via `http-proxy-middleware` (preserves streaming and SSE). Example:

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');
// ...existing requires...

const TSCRIBE_API_URL = process.env.TSCRIBE_API_URL || 'http://localhost:3003';

// Keep local health endpoint
app.get('/api/health', async (req, res) => { /* unchanged; calls TSCRIBE_API_URL/ api/health with axios */ });

// Preserve streaming for everything else under /api
app.use('/api', createProxyMiddleware({
  target: TSCRIBE_API_URL,
  changeOrigin: true,
  ws: true,
  proxyTimeout: 120000
}));
```

## Phase 3 — Fix Docker networking on Linux

Linux Docker doesn’t include `host.docker.internal` by default. Choose one:

- Option A (preferred): map host-gateway in `docker-compose.yml`:
```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
environment:
  - TSCRIBE_API_URL=http://host.docker.internal:3003
```

- Option B: use Docker bridge IP:
```yaml
environment:
  - TSCRIBE_API_URL=http://172.17.0.1:3003
```

## Phase 4 — Deploy frontend to meatpi

```
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'logs' --exclude 'output' --exclude 'uploads' /Users/inggo/Documents/iScribe/ meatpi:~/iScribe/
ssh meatpi "cd ~/iScribe && ./deploy.sh"
ssh meatpi "cd ~/iScribe && docker-compose ps"
curl -s http://meatpi:3008/api/health
```

## Phase 5 — End-to-end validation

In a browser at `http://meatpi:3008`:
- File manager: Refresh, list files (or empty state) without errors.
- Play audio/video (streams should work).
- Download file.
- Delete a file.
- Start a transcription and verify real-time progress via SSE (`/api/progress/:jobId`).
- If video enabled, test image upload and preview.

## Phase 6 — Documentation updates

- Clarify in README that iScribe is a frontend + reverse proxy, and list env vars: `PORT`, `TSCRIBE_API_URL`.
- Add Linux Docker networking note (host-gateway mapping or bridge IP).
- Document API contracts expected by UI:
  - `GET /api/files` → `[ { filename, type, size, created } ]`
  - `GET /api/download/:filename` → binary stream (audio/video)
  - `DELETE /api/files/:filename`
  - `POST /api/upload-image` → `{ imagePath|persistentImagePath, imageInfo }`
  - `GET /api/progress/:jobId` → SSE stream
  - `GET /api/queue` → `{ success, currentJob, queue, queueLength }`
  - `POST /api/transcribe` → `{ success, jobId, queue? }`

## Phase 7 — Optional hardening

- Add `helmet` and `compression` to `server.js`.
- Restrict CORS origin if possible.
- Optionally add `/healthz` as frontend-only health.

## Rollback

```
ssh meatpi "cd ~/iScribe && docker-compose down"
# Restore previous server.js / docker-compose.yml as needed
ssh meatpi "cd ~/iScribe && docker-compose up -d"
```

## Acceptance Criteria Checklist

- `/api/health` shows frontend ok and backend available.  
- File manager loads, media play/download works.  
- SSE progress updates during transcription.  
- No `ENOTFOUND host.docker.internal` errors in logs.  


