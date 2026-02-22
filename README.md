# Last Whisper 🎯
[![Build Images](https://github.com/coachpo/last-whisper/actions/workflows/builder.yml/badge.svg?branch=main)](https://github.com/coachpo/last-whisper/actions/workflows/builder.yml)

Fast, modern dictation training with high-quality text-to-speech, attempt scoring, and analytics. The monorepo contains a FastAPI backend and a Next.js 16 (React 19) frontend.

## Highlights
- Multi-provider TTS (Google Cloud) with cached audio and locale-aware settings.
- Dictation practice with WER-based scoring, history, tags, and difficulty filters.
- Responsive PWA frontend built with shadcn/ui, Tailwind CSS, and TanStack Query.
- Offline-friendly audio via IndexedDB cache (100MB cap, 7-day TTL).
- Session-less workflow — no user auth required.

## Monorepo Layout
- `last-whisper-backend/` – FastAPI service (Python 3.11+, SQLAlchemy, Google Cloud TTS/Translate). See its [README](last-whisper-backend/README.md) and [AGENTS.md](last-whisper-backend/AGENTS.md).
- `last-whisper-frontend/` – Next.js 16 app (pnpm 10.23.0, TypeScript, shadcn/ui). See its [README](last-whisper-frontend/README.md) and [AGENTS.md](last-whisper-frontend/AGENTS.md).
- `.github/workflows/` – CI for ARM64 Docker image builds (GHCR) and cleanup.
- `AGENTS.md` – Root project knowledge base for AI-assisted development.
- `LICENSE` – MIT.

## Prerequisites
- Docker + Docker Compose (for containerized runs).
- Python 3.11+ (backend development).
- Node.js 18+ with `pnpm` (frontend development) – package manager pinned to `pnpm@10.23.0`.
- Google Cloud Text-to-Speech credentials JSON placed at `keys/google-credentials.json` (mounted by compose files).

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

## Docker
Each subproject has its own Dockerfile. Production images are published to GHCR:
- `ghcr.io/coachpo/last-whisper-backend:latest`
- `ghcr.io/coachpo/last-whisper-frontend:latest`

Staging/deploy compose files and Caddy reverse proxy config are managed outside this repo.

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
