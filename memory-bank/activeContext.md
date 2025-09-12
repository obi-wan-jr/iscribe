# Active Context

## Current Focus
- iScribe frontend (Express + static UI) proxies to tScribe backend.
- Errors in file manager due to proxy not preserving streaming and Linux Docker networking (`host.docker.internal`).
- Target deployment: meatpi, frontend on 3008, backend on 3003.

## Recent Actions
- Deployed iScribe to meatpi:3008 via Docker.
- Identified backend access failures (`ENOTFOUND host.docker.internal`).
- Found missing tScribe service (`jobQueueService`) and port mismatch; added minimal service and set `PORT=3003`.
 - Implemented `http-proxy-middleware` streaming proxy and added Docker host-gateway mapping.

## Next Steps
1. Stabilize tScribe on 3003 and verify `/api/health`.
2. Validate UI flows (files list, download, delete, SSE progress, image upload).

## Risks/Notes
- If tScribe API contracts differ from UI expectations, align or adjust UI.
- Consider documenting API contracts and Linux Docker networking in README.


