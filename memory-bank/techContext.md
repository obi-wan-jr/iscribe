# Tech Context

## Stack
- Node.js (Express) for frontend/proxy.
- Docker + docker-compose for deployment on meatpi.
- PM2 for tScribe process management.

## Configuration
- Frontend port: `3008`.
- Backend port: `3003`.
- Env vars: `PORT`, `TSCRIBE_API_URL` (frontend); `PORT` and service-specific creds (tScribe).

## Networking
- Linux Docker: use `extra_hosts: host-gateway` to map `host.docker.internal`, or use `172.17.0.1` to reach host services.

## Dependencies
- Add `http-proxy-middleware` to preserve streaming.


