# Active Context

## Current Focus
- iScribe frontend (Express + static UI) proxies to tScribe backend.
- Proxy now preserves streaming via `http-proxy-middleware`; Linux Docker networking fixed with `extra_hosts: host-gateway`.
- Target deployment: meatpi, frontend on 3008, backend on 3003.

## Recent Actions
- Resolved rebase conflicts and aligned repo to proxy-frontend architecture.
- Implemented `http-proxy-middleware` to preserve streaming; updated Docker (`extra_hosts`) and compose.
- Fixed `public/script.js` to route via `/api` proxy (removed hardcoded ports).
- On meatpi, repaired tScribe `services/jobQueueService.js` and restarted via PM2; `PORT=3003` confirmed.
- Verified: `http://meatpi:3003/api/health` OK; local frontend `/api/health` shows `tscribe: ok`.

## Next Steps
1. Implement/align file manager endpoints on tScribe (`/api/files`, `/api/download/:filename`, DELETE `/api/files/:filename`) or adjust UI to current API.
2. Validate end-to-end flows (SSE progress, uploads, downloads) via `public/test-ui.html`.
3. Deploy iScribe to meatpi using `./deploy.sh`; confirm `docker-compose ps` and `/api/health`.
4. Optional: add `helmet`, `compression`, `morgan` to `server.js`.

## Risks/Notes
- If tScribe API contracts differ from UI expectations, update either backend endpoints or UI calls.
- Docs added: see `docs/EXECUTION_PLAN.md` and `docs/NEXT_STEPS.md` for runbook and contracts.


