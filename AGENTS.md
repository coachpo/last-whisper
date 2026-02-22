# Last Whisper — Project Knowledge Base

**Generated:** 2026-02-22 · **Commit:** 58520aa · **Branch:** main

## Overview

Dictation training monorepo: FastAPI backend (TTS, WER scoring, analytics) + Vite + React 19 frontend (SPA, cached audio, dashboards). Session-less workflow — no user auth.

## Structure

```
last-whisper/
├── last-whisper-backend/   # FastAPI + SQLAlchemy + Google Cloud TTS/Translate
├── last-whisper-frontend/  # Vite 6, React 19, React Router 7, shadcn/ui, TanStack Query
├── .github/workflows/      # CI: Docker image builds (ARM64) + cleanup
└── LICENSE                  # MIT
```

Staging/deploy compose files and Caddy config live outside this repo.

## Where to Look

| Task | Location | Notes |
|------|----------|-------|
| Add API endpoint | `backend/app/api/routes/` | Mirror in `backend/app/services/` |
| Add frontend page | `frontend/src/router.tsx + src/components/{feature}/` | Add Route in router.tsx, component in `src/components/{feature}/` |
| Add API client call | `frontend/src/lib/api/modules/` | One module per backend domain |
| Change TTS provider | `backend/app/tts_engine/` | Extend `BaseTTSEngine` abstract class |
| Change translation provider | `backend/app/translation/` | Extend `BaseTranslationProvider` |
| Add DB model/migration | `backend/app/models/` + `backend/docs/migrations/` | Raw SQL migrations, SQLAlchemy ORM |
| Modify scoring | `backend/app/services/attempts_service.py` | jiwer WER + manual fallback |
| Add shadcn component | `frontend/src/components/ui/` | Via `components.json` registry |
| Add E2E test | `frontend/tests/e2e/` | `TC_###_scenario.test.ts` naming |
| Add backend test | `backend/tests/` | Mirror `app/` structure, use conftest fixtures |
| Change CI | `.github/workflows/builder.yml` | Matrix build, ARM64, GHCR push |
| Environment config | Backend: `app/core/config.py` / Frontend: `env.example` | pydantic-settings / Vite env |

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2.x, SQLite, Google Cloud TTS/Translate, jiwer, pydantic-settings |
| Frontend | Vite 6, React 19, React Router 7, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Playwright, Vitest |
| Infra | Docker (ARM64), GitHub Actions, GHCR, Caddy (external), pnpm 10.30.1 |

## Conventions

- Conventional Commits: `type(scope): summary` — e.g. `feat(translation,tts): add caching`
- Backend: Black 88-char, Ruff linting, snake_case modules, PascalCase classes, explicit type hints
- Frontend: 2-space indent, ESLint flat config, Tailwind utility-first, PascalCase components, `useX` hooks
- Tests: Backend `test_*.py` mirroring `app/`; Frontend `TC_###_scenario.test.ts`
- PRs against `main`; CI builds container images on push/PR

## Anti-Patterns

- Never commit credentials or `.env` files — `keys/` and secrets are gitignored
- Never hardcode API URLs — frontend uses relative URLs (reverse proxy / Vite proxy handle routing); backend uses pydantic-settings
- Never suppress types with `as any` or `@ts-ignore` in frontend
- Backend: Don't bypass `api/dependencies.py` for service wiring — use `@lru_cache` singletons
- Frontend: Don't fetch directly — use TanStack Query hooks via `lib/api/modules/`

## Commands

```bash
# Backend
cd last-whisper-backend
pip install -e ".[dev]"
python run_api.py                          # dev server :8000
pytest                                     # tests
pytest --cov=app --cov-report=term-missing # coverage
ruff check app tests                       # lint
black app tests                            # format

# Frontend
cd last-whisper-frontend
pnpm install                               # pnpm 10.30.1
pnpm dev                                   # dev server :3000
pnpm build                                 # tsc + vite build
pnpm lint                                  # ESLint
pnpm type-check                            # tsc --noEmit
pnpm test:unit                             # Vitest
pnpm test:e2e                              # Playwright (mocked API)
```

## Secrets & Credentials

- Google Cloud TTS/Translate: `keys/google-credentials.json` (mounted in Docker, gitignored)
- Never commit `*-key.*`, `*-credentials.*`, `.env.*` (except `.env.example`)

## Notes

- Database is SQLite at `data/dictation.db` — no migrations framework, raw SQL in `docs/migrations/`
- Audio files generated to `audio/` — gitignored, volume-mounted in Docker
- Frontend audio cache: IndexedDB, 100MB cap, 7-day TTL
- CI builds ARM64 images only (target: Raspberry Pi / ARM servers)
- Bark push notifications on CI success/failure
- Staging/deploy compose and Caddy config are external to this repo
