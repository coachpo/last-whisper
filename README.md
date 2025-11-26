# Last Whisper 🎯
[![Build Images](https://github.com/coachpo/last-whisper/actions/workflows/builder.yml/badge.svg?branch=main)](https://github.com/coachpo/last-whisper/actions/workflows/builder.yml)

Fast, modern dictation training with high-quality text-to-speech, attempt scoring, and analytics. The monorepo contains a FastAPI backend and a Next.js (React 19) frontend.

## Highlights
- Multi-provider TTS (Google Cloud today) with cached audio and locale-aware settings.
- Dictation practice with WER-based scoring, history, tags, and difficulty filters.
- Responsive PWA frontend built with shadcn/ui, Tailwind CSS, and TanStack Query.
- Production-ready containers (GHCR) plus staging and local development paths.

## Monorepo Layout
- `last-whisper-backend/` – FastAPI service (`run_api.py`, Python 3.11+, optional `last-whisper-api` entrypoint). See its README for details.
- `last-whisper-frontend/` – Next.js 16 app using pnpm 10.23.0. See its README for UI and API client notes.
- `deploy/` – Production compose stack using GHCR images and Caddy reverse proxy.
- `staging/` – Dev/staging compose stack that builds images from the local backend/frontend.
- `.github/workflows/` – CI for image builds and cleanup.
- `LICENSE` – MIT.

## Prerequisites
- Docker + Docker Compose (for containerized runs).
- Python 3.11+ (backend development).
- Node.js 18+ with `pnpm` (frontend development) – package manager pinned to `pnpm@10.23.0`.
- Google Cloud Text-to-Speech credentials JSON placed at `keys/google-credentials.json` (mounted by compose files).

## Run with Docker (staging stack)
This builds images from your local code and runs Caddy in front of both services.
```bash
# From repo root
docker compose -f staging/docker-compose.staging.yml up --build
```
Endpoints (containers expose):
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Caddy proxy: http://localhost:8008

To use prebuilt GHCR images instead, point to `deploy/docker-compose.prod.yml` (optional `deploy/env.template` for GHCR auth).

## Local Development
### Backend (FastAPI)
```bash
cd last-whisper-backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -e ".[dev]"
export TTS_PROVIDER=google
export GOOGLE_APPLICATION_CREDENTIALS=keys/google-credentials.json
python run_api.py   # or: uvicorn app.main:app --reload --port 8000
```
Docs: http://localhost:8000/docs when running in development.

### Frontend (Next.js)
```bash
cd last-whisper-frontend
pnpm install
cp env.example .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" >> .env.local   # adjust if different
pnpm dev   # http://localhost:3000
```

## Testing & Quality
- Backend: `pytest`, `pytest --cov=app`, `ruff check app tests`, `black app tests`
- Frontend: `pnpm test:unit`, `pnpm test:e2e` (Playwright), `pnpm lint`, `pnpm type-check`

## Deployment
- **Staging/dev:** `docker compose -f staging/docker-compose.staging.yml up --build`
- **Production:** `docker compose -f deploy/docker-compose.prod.yml --env-file deploy/env.template up -d` (provide GHCR creds if images are private; mount `deploy/keys` for Google credentials)
- Reverse proxy is handled by Caddy (port 8008 by default).

## Contributing
- Follow backend/`AGENTS.md` conventions and subproject READMEs.
- Add tests for new features; keep formatting via `black`, `ruff`, `pnpm lint`, and `pnpm type-check`.
- Open PRs against `main`; CI builds container images.

## License
MIT — see `LICENSE`.
