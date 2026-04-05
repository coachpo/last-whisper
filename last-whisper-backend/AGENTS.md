# Last Whisper Backend — Knowledge Base

**Generated:** 2026-02-22 · **Commit:** 58520aa · **Branch:** main

## Overview

FastAPI service for dictation training: Google Cloud TTS generation with background worker queues, WER-based scoring (jiwer + manual fallback), translation, tagging, and analytics. SQLite storage, session-less — no user auth. The service lives in `last-whisper-backend/` inside the root monorepo.

## Structure

```
app/
├── api/
│   ├── dependencies.py   # @lru_cache singleton wiring — ALL service access goes through here
│   └── routes/            # attempts, health, items, metadata, stats, tags, translations
├── core/                  # config (pydantic-settings), logging, exceptions, security, build_info
├── models/                # SQLAlchemy ORM (models.py), Pydantic schemas, enums, database_manager
├── services/              # Business logic: items, attempts (WER), stats, tags, metadata, task, item_audio_manager
├── translation/           # Abstract base → Google Translate provider, manager, wrapper
└── tts_engine/            # Abstract base → GCP TTS provider, manager (queue monitor), wrapper
run_api.py                 # Dev entrypoint (uvicorn)
audio/                     # Generated WAV files (gitignored, volume-mounted)
data/                      # SQLite dictation.db (gitignored)
docs/migrations/           # Raw SQL migration files (no framework)
tests/                     # Pytest suite mirroring app/
```

## Where to Look

| Task | Location | Notes |
|------|----------|-------|
| Add endpoint | `app/api/routes/` | Create service in `app/services/`, wire via `api/dependencies.py` |
| Add model/table | `app/models/models.py` + `docs/migrations/` | ORM model + raw SQL migration |
| Add schema | `app/models/schemas.py` | Pydantic request/response models |
| Change TTS provider | `app/tts_engine/` | Extend `BaseTTSEngine` in `base.py` |
| Change translation provider | `app/translation/` | Extend `BaseTranslationProvider` in `base.py` |
| Modify scoring | `app/services/attempts_service.py` | jiwer WER primary, Levenshtein fallback |
| Add config setting | `app/core/config.py` | pydantic-settings, expose via dependency |
| Add test | `tests/` | Mirror `app/` path, use `conftest.py` fixtures |

## Architecture

- **Dependency injection**: `api/dependencies.py` uses `@lru_cache` for singleton services — never instantiate services directly in routes
- **TTS pipeline**: Item creation → `item_audio_manager` submits to TTS queue → `tts_engine_gcp` background worker processes → `tts_engine_manager` syncs ItemTTS status
- **Translation pipeline**: `translation_wrapper` → `translation_manager` (with caching) → `translation_google` provider
- **Database**: SQLAlchemy 2.x with SQLite, foreign keys enabled via pragma, cascade deletes
- **ORM models**: Task, Item, ItemTTS, Translation, Attempt, Tag — indexes on locale, difficulty, created_at, status
- **Rate limiting**: In-memory sliding-window rate limiting per client IP, per route bucket
- **Exception hierarchy**: `TTSAPIException`, `ServiceError` with global handlers in `main.py`

## Conventions

- Black 88-char line length, Ruff linting, imports sorted per Ruff
- Explicit type hints everywhere; Pydantic models for all payloads
- `snake_case` modules/functions, `PascalCase` classes, `UPPER_SNAKE` constants
- Descriptive FastAPI router tags (e.g. `tags_router`)
- Conventional Commits: `type(scope): summary` — e.g. `feat(translation,tts): add caching`

## Testing

- Pytest with `pytest-asyncio` and `httpx` TestClient
- Fixtures in `tests/conftest.py`: `DummyTTSEngine`, `DummyTaskManager` stubs, temp SQLite DB
- Name files `test_*.py`, mirror package path (e.g. `tests/api/test_metadata_api.py`)
- Assert both HTTP status codes and payload schemas
- Coverage target: `app/core`, `app/services`, `app/translation` first

## Commands

Commands below assume you are running inside `last-whisper-backend/` within the monorepo checkout.

```bash
pip install -e ".[dev]"                    # install with dev deps
python run_api.py                          # dev server :8000
pytest                                     # run tests
pytest --cov=app --cov-report=term-missing # coverage
ruff check app tests                       # lint
black app tests                            # format
```

## Anti-Patterns

- Never bypass `api/dependencies.py` — all service wiring uses `@lru_cache` singletons
- Never commit `keys/`, `*-key.*`, `*-credentials.*`, `.env` files
- Never hardcode API URLs or credentials — use `app/core/config.py` settings
- Don't add migrations framework — raw SQL in `docs/migrations/` by convention

## Configuration

Settings via pydantic-settings from `.env`:
- `TTS_PROVIDER` (default `google`), `GOOGLE_APPLICATION_CREDENTIALS` (default `keys/google-credentials.json`; local monorepo runs commonly use `../keys/google-credentials.json`)
- `DATABASE_URL` (default `sqlite:///data/dictation.db`)
- `CORS_ORIGINS`, `PORT` (8000), `ENVIRONMENT`
- For new settings: add to `app/core/config.py`, expose through dependency providers, document in `docs/`
