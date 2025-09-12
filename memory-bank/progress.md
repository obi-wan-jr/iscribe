# Progress

## What Works
- Frontend serves UI on 3008 and health endpoint responds.
- Deployment to meatpi via Docker confirmed.

## Issues Seen
- Proxy breaks streaming (downloads/uploads/SSE) due to Axios + `res.json`.
- Docker on Linux cannot resolve `host.docker.internal` → backend unreachable.
- tScribe instability: missing `jobQueueService`, initial port set to 3000.

## Recent Fixes
- Created docs plan with concrete steps.
- Set tScribe `PORT=3003`; installed deps; added minimal `jobQueueService` guidance.
 - Replaced Axios proxy with streaming-safe `http-proxy-middleware` in `server.js`.
 - Added Linux Docker host mapping via `extra_hosts: host-gateway` in `docker-compose.yml`.
 - Installed `http-proxy-middleware` and smoke tested `/api/health` locally (tScribe unavailable as expected).

## Next Milestones
1. Verify `/api/files`, media playback, downloads, deletes, SSE progress.
2. Update README with architecture, networking notes, and API contracts.


