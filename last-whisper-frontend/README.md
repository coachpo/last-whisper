# Last Whisper Frontend
Vite 6 + React 19 SPA for dictation practice, dashboards, tags, and cached audio playback. Built with TypeScript, Tailwind CSS, and shadcn/ui.

This application lives in `last-whisper-frontend/` inside the Last Whisper monorepo, with repo-wide pnpm settings owned by the root `pnpm-workspace.yaml`.

## Highlights
- Responsive PWA with theme toggle, health indicator, and analytics dashboards.
- Items, attempts, stats, tags, and practice flows backed by the FastAPI API.
- Offline-friendly audio via IndexedDB cache (100MB cap, 7-day TTL).

## Prerequisites
- Node.js 18+ (Node 20 LTS recommended)
- pnpm `10.30.1`
- Running backend API (default http://localhost:8000)

## Quickstart (local dev)
```bash
cd last-whisper-frontend
pnpm install
cp env.example .env.local
pnpm dev   # http://localhost:3000 (API proxied to localhost:8000 via Vite proxy)
```

## Common scripts
- `pnpm dev` – start dev server
- `pnpm build` / `pnpm preview` – production build `pnpm build` / `pnpm start` – production build & start preview
- `pnpm lint` – ESLint
- `pnpm type-check` – TypeScript
- `pnpm test:unit` – Vitest unit tests
- `pnpm test:e2e` – Playwright (uses mocks by default)
- `pnpm generate-icons` – optional icon set generation

## Environment variables
- `BACKEND_URL` – backend origin for Vite dev proxy (default `http://localhost:8000`, server-side only)
- `VITE_EXPECTED_METADATA_SCHEMA_VERSION` – defaults to `2025-11-22`
- ``
- `VITE_DEBUG_LOGGING` – `false` by default
See `env.example` for defaults; `.env.local` is loaded by Vite.

## Docker
- Build locally from the repo root: `docker build -f last-whisper-frontend/Dockerfile -t last-whisper-frontend .`
- Staging/dev (builds locally): `docker compose -f ../staging/docker-compose.staging.yml up --build`
- Production images: `ghcr.io/coachpo/last-whisper-frontend:latest` (used in `../deploy/docker-compose.prod.yml`)
- Dockerfile uses Node 20-alpine with pnpm 10.30.1, the repo-root workspace config, and a Vite static build; exposes port 3000.

## Project layout
```
src/
  app/            # App Router pages, layouts, providers
  components/     # UI, audio player, items/practice/stats/tags modules
  hooks/          # Health/status hooks
  lib/            # API client, audio cache, debug utilities
  types/          # API typings
  contexts/       # Sidebar/loading state
public/           # Static assets (icons, manifest)
scripts/          # generate-icons.js
env.example       # Env template
Dockerfile        # Build from repo root so pnpm-workspace.yaml is available
```

## Notes
- API calls use relative URLs — in dev, Vite proxy forwards to the backend; in prod, the reverse proxy (Caddy) handles routing.
- Set `BACKEND_URL` in `.env.local` if your backend runs on a non-default port.
- Telemetry is disabled in the Docker image.
