# Next Steps Runbook (iScribe Frontend + tScribe Backend)

Use this ordered runbook to operate and finalize the iScribe (frontend/proxy) + tScribe (backend) system. Commands are copy-paste ready.

## Phase 0 — Context
- iScribe (this repo): frontend + reverse proxy; runs on port 3008
- tScribe (separate on meatpi): backend API; runs on port 3003
- Linux Docker: `host.docker.internal` is mapped in docker-compose (`extra_hosts: host-gateway`)

## Phase 1 — Verify tScribe on meatpi
1) Confirm port and start/restart
```bash
ssh meatpi "cd ~/tScribe && grep '^PORT=' .env"
ssh meatpi "cd ~/tScribe && pm2 start server.js --name tscribe || pm2 restart tscribe"
ssh meatpi "pm2 status | grep tscribe"
```
2) Health check
```bash
curl -s http://meatpi:3003/api/health
```
3) If job queue errors occur, ensure `services/jobQueueService.js` exists and is valid (minimal shape already deployed):
```js
const crypto = require('crypto');
let jobs = new Map();
let currentJob = null;
function addJob(job){const jobId=crypto.randomUUID();jobs.set(jobId,{id:jobId,status:'queued',createdAt:new Date().toISOString(),params:job});return{success:true,jobId,queue:{position:jobs.size,estimated_wait:'0s'}}}
function getJobStatus(jobId){const job=jobs.get(jobId);return job?{success:true,job}:{success:false,error:'Job not found'}}
function getQueueStatus(){return{success:true,queueLength:jobs.size,currentJob,queue:Array.from(jobs.values())}}
function cancelJob(jobId){const existed=jobs.delete(jobId);if(currentJob&&currentJob.id===jobId)currentJob=null;return{success:existed,cancelled:existed}}
function clearCompleted(){jobs.clear();currentJob=null;return true}
module.exports={addJob,getJobStatus,getQueueStatus,cancelJob,clearCompleted}
```

## Phase 2 — Run iScribe locally against meatpi backend
```bash
PORT=3008 TSCRIBE_API_URL=http://meatpi:3003 npm start
curl -s http://localhost:3008/api/health
```
Expected: `{ status: 'ok', services: { tscribe: 'ok' } }`

## Phase 3 — Align UI ↔ tScribe API
Frontend expects via `/api/*` (proxied):
- POST `/api/transcribe`
- GET `/api/progress/:jobId` (SSE)
- GET `/api/queue`
- GET `/api/bible/validate/:book/:chapter`
- GET `/api/books` (or `/api/bible/books`)
- POST `/api/upload-image`
- GET `/api/files`, GET `/api/download/:filename`, DELETE `/api/files/:filename` (file manager)
- DELETE `/api/cleanup-image` (optional)

tScribe currently provides:
- GET `/api/health`, GET `/api/bible/books`, GET `/api/bible/validate/:book/:chapter`, GET `/api/config`, GET `/api/bible/versions`, POST `/api/validate-credentials`, POST `/api/upload-image`, GET `/api/queue`, GET `/api/progress/:jobId`, POST `/api/transcribe`

Choose one:
- A) Add missing file endpoints to tScribe (recommended) targeting its output/uploads directories
- B) Temporarily disable file manager features in UI

## Phase 4 — Deploy iScribe frontend to meatpi (Docker)
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'logs' --exclude 'output' --exclude 'uploads' . meatpi:~/iScribe/
ssh meatpi "cd ~/iScribe && ./deploy.sh"
ssh meatpi "cd ~/iScribe && docker-compose ps"
curl -s http://meatpi:3008/api/health
```
Should show `tscribe: ok`.

## Phase 5 — Validate streaming and flows
- Open: `http://meatpi:3008/public/test-ui.html`
- Validate:
  - Files list/download/delete (if endpoints implemented)
  - SSE progress during transcription
  - Image upload path

## Phase 6 — Hardening (optional)
```bash
npm i helmet compression morgan
```
In `server.js`:
- `app.use(morgan('combined'))`
- `app.use(helmet())`
- `app.use(compression())`

## Notes
- To trace Node deprecation warnings: `NODE_OPTIONS=--trace-deprecation PORT=3008 TSCRIBE_API_URL=http://meatpi:3003 npm start`
- Keep `docs/EXECUTION_PLAN.md` and this runbook current.
