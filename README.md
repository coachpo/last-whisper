# Last Whisper 🎯
[![Build Images](https://github.com/coachpo/last-whisper/actions/workflows/builder.yml/badge.svg?branch=main)](https://github.com/coachpo/last-whisper/actions/workflows/builder.yml)

Fast, modern dictation training with high-quality text-to-speech, attempt scoring, and analytics. This repository is a true monorepo: the root Git checkout directly tracks a FastAPI backend and a Vite + React 19 frontend.

## Highlights
- Multi-provider TTS (Google Cloud) with cached audio and locale-aware settings.
- Dictation practice with WER-based scoring, history, tags, and difficulty filters.
- Responsive PWA frontend built with shadcn/ui, Tailwind CSS, and TanStack Query.
- Offline-friendly audio via IndexedDB cache (100MB cap, 7-day TTL).
- Session-less workflow — no user auth required.

## Monorepo Layout
- `last-whisper-backend/` – FastAPI service (Python 3.11+, SQLAlchemy, Google Cloud TTS/Translate). See its [README](last-whisper-backend/README.md) and [AGENTS.md](last-whisper-backend/AGENTS.md).
- `last-whisper-frontend/` – Vite 6 + React 19 SPA (pnpm 10.30.1, TypeScript, shadcn/ui). See its [README](last-whisper-frontend/README.md) and [AGENTS.md](last-whisper-frontend/AGENTS.md).
- `pnpm-workspace.yaml` – repo-root pnpm workspace config for the frontend package.
- `.github/workflows/` – CI for ARM64 Docker image builds (GHCR) and cleanup.
- `AGENTS.md` – Root project knowledge base for AI-assisted development.
- `LICENSE` – MIT.

## Prerequisites
- Docker + Docker Compose (for containerized runs).
- Python 3.11+ (backend development).
- Node.js 18+ with `pnpm` (frontend development) – package manager pinned to `pnpm@10.30.1`.
- Google Cloud Text-to-Speech credentials JSON placed at repo-root `keys/google-credentials.json` (mounted by compose files).

## Local Development
Everything below assumes one repo checkout rooted at `last-whisper/`.

### Backend (FastAPI)
```bash
cd last-whisper-backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
export TTS_PROVIDER=google
export GOOGLE_APPLICATION_CREDENTIALS=../keys/google-credentials.json
python run_api.py   # or: uvicorn app.main:app --reload --port 8000
```
Docs: http://localhost:8000/docs when running in development.

### Frontend (Vite + React)
```bash
cd last-whisper-frontend
pnpm install
cp env.example .env.local
pnpm dev   # http://localhost:3000 (API calls proxy to localhost:8000 via Vite proxy)
```
Repo-wide pnpm settings live in the root `pnpm-workspace.yaml`; frontend commands stay scoped to `last-whisper-frontend/`.

## Docker
Each subproject has its own Dockerfile. The backend image builds from `last-whisper-backend/`; the frontend image builds from the repo root so `last-whisper-frontend/Dockerfile` can read the root `pnpm-workspace.yaml`. Production images are published to GHCR:
- `ghcr.io/coachpo/last-whisper-backend:latest`
- `ghcr.io/coachpo/last-whisper-frontend:latest`

Staging/deploy compose files and Caddy reverse proxy config are managed outside this repo.

## Versioning and CI/CD
- `last-whisper-backend/VERSION` and `last-whisper-frontend/VERSION` hold the current service version tracked by CI/CD. Keep them aligned with `last-whisper-backend/pyproject.toml` and `last-whisper-frontend/package.json`.
- `.github/workflows/ci.yml` validates that version alignment and runs backend + frontend quality checks on pushes and pull requests targeting `main`.
- `.github/workflows/builder.yml` builds both service images and, on non-PR runs, publishes `latest` plus the current `v<service-version>` tag from the corresponding `VERSION` file.

## Testing & Quality
- Backend: `pytest`, `pytest --cov=app`, `ruff check app tests`, `black app tests`
- Frontend: `pnpm test:unit` (Vitest), `pnpm test:e2e` (Playwright), `pnpm lint`, `pnpm type-check`

## Contributing
- Follow `AGENTS.md` conventions at root and subproject levels.
- Conventional Commits: `type(scope): summary`.
- Add tests for new features; keep formatting via `black`, `ruff`, `pnpm lint`, and `pnpm type-check`.
- Open PRs against `main`; CI builds container images on push/PR.

## License
MIT — see `LICENSE`.
