# System Patterns

## Architecture
- Express frontend serving static UI and reverse proxying `/api/*` to tScribe.
- tScribe provides REST + SSE endpoints for transcription, files, queue.

## Key Decisions
- Use `http-proxy-middleware` to preserve streaming and headers instead of Axios JSON relay.
- On Linux Docker, map `host.docker.internal` via `extra_hosts: host-gateway` or use bridge IP `172.17.0.1`.

## Component Relationships
- UI (public) → `/api/*` → proxy → tScribe
- Media players and downloads rely on binary streaming headers.
- Progress UI relies on SSE (`/api/progress/:jobId`).


