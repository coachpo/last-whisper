# Last Whisper — Deployment & Operations Guide

**Version:** 1.0
**Date:** 2026-02-22

---

## 1. Architecture Overview

```
Internet → Caddy (reverse proxy) → Frontend (static SPA, :3000)
                                  → Backend (FastAPI, :8000)
                                  → SQLite (data/dictation.db)
                                  → Audio files (audio/)
                                  → Google Cloud TTS/Translate (external)
```

All components run as Docker containers on ARM64 infrastructure (Raspberry Pi / ARM servers). Caddy configuration lives outside this repository.

---

## 2. Prerequisites

| Requirement | Version |
|-------------|---------|
| Docker | 20.10+ |
| Docker Compose | 2.x |
| Node.js (local dev) | 20.x |
| pnpm (local dev) | 10.30.1 |
| Python (local dev) | 3.11+ |
| Google Cloud credentials | TTS + Translate APIs enabled |

---

## 3. Local Development

### 3.1 Backend

```bash
cd last-whisper-backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Configure environment
cp .env.example .env
# Edit .env: set GOOGLE_APPLICATION_CREDENTIALS path

# Run
python run_api.py    # Uvicorn dev server on :8000
```

### 3.2 Frontend

```bash
cd last-whisper-frontend
pnpm install         # pnpm 10.30.1

# Configure environment
cp env.example .env.local
# Edit .env.local if needed (defaults work for local dev)

# Run
pnpm dev             # Vite dev server on :3000
```

The Vite dev server proxies API requests to the backend:
- `/v1/*` → `http://localhost:8000`
- `/api/v1/*` → `http://localhost:8000`
- `/metadata` → `http://localhost:8000`
- `/health` → `http://localhost:8000`

### 3.3 Running Tests

```bash
# Backend
cd last-whisper-backend
pytest                                     # all tests
pytest --cov=app --cov-report=term-missing # with coverage
ruff check app tests                       # lint
black app tests                            # format

# Frontend
cd last-whisper-frontend
pnpm type-check      # TypeScript
pnpm lint             # ESLint
pnpm test:unit        # Vitest (15 tests)
pnpm test:e2e         # Playwright (47 test files, 3 viewports)
```

---

## 4. Docker Images

### 4.1 Backend Image

**Base:** `python:3.12-slim`
**Build:** Single-stage
**Port:** 8000
**Runtime:** Gunicorn with 4 Uvicorn workers

```bash
cd last-whisper-backend
docker build -t last-whisper-backend .
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/audio:/app/audio \
  -v $(pwd)/keys:/app/keys:ro \
  -e ENVIRONMENT=production \
  -e LOG_LEVEL=info \
  -e CORS_ORIGINS="*" \
  last-whisper-backend
```

**Required volumes:**
| Mount | Purpose | Mode |
|-------|---------|------|
| `/app/data` | SQLite database | read-write |
| `/app/audio` | Generated TTS audio files | read-write |
| `/app/keys` | Google Cloud credentials | read-only |

### 4.2 Frontend Image

**Base:** `node:20-alpine` (build) → `node:20-alpine` + `serve@14` (runtime)
**Build:** Two-stage
**Port:** 3000
**Runtime:** `serve -s dist -l 3000`

```bash
cd last-whisper-frontend
docker build -t last-whisper-frontend .
docker run -d -p 3000:3000 last-whisper-frontend
```

**Build args:**
| Arg | Default | Description |
|-----|---------|-------------|
| `VITE_DEBUG_LOGGING` | `false` | Enable debug logging in production build |

### 4.3 Non-Root Execution

Both images run as non-root users:
- Backend: `appuser` (system user)
- Frontend: `appuser:appgroup` (UID 1001, GID 1001)

---

## 5. CI/CD Pipeline

### 5.1 Build Workflow (`.github/workflows/builder.yml`)

**Triggers:**
- Push to `main` branch
- Pull request to `main` branch
- Manual dispatch (with service selection)

**Jobs:**
1. Matrix build: `[backend, frontend]` in parallel
2. Each job:
   - Checks out code
   - Sets up QEMU (ARM64 emulation)
   - Sets up Docker Buildx
   - Logs into GHCR (`ghcr.io`)
   - Builds `linux/arm64` image with layer caching
   - Pushes with tags: `latest` + `v{run_number}`
3. Bark push notification on success/failure

**Image registry:**
```
ghcr.io/coachpo/last-whisper-backend:latest
ghcr.io/coachpo/last-whisper-backend:v{N}
ghcr.io/coachpo/last-whisper-frontend:latest
ghcr.io/coachpo/last-whisper-frontend:v{N}
```

**Platform:** `linux/arm64` only (no x86 builds).

### 5.2 Cleanup Workflow (`.github/workflows/cleanup.yml`)

**Schedule:** Daily at 03:00 UTC
**Actions:**
- Deletes old workflow runs (keeps minimum 3)
- Removes untagged container images from GHCR

---

## 6. Environment Configuration

### 6.1 Backend Settings (`pydantic-settings`)

All settings are configured via environment variables or `.env` file.

| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | `development` | `development` or `production` |
| `LOG_LEVEL` | `info` | Logging level |
| `DATABASE_URL` | `sqlite:///data/dictation.db` | SQLAlchemy database URL |
| `AUDIO_DIR` | `audio` | Directory for generated audio files |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |
| `TTS_PROVIDER` | `gcp` | TTS engine provider |
| `TTS_DEFAULT_LOCALE` | `fi-FI` | Default TTS locale |
| `TTS_WORKER_COUNT` | `1` | Number of TTS worker threads |
| `TRANSLATION_PROVIDER` | `google` | Translation provider |
| `TRANSLATION_DEFAULT_TARGET` | `en` | Default translation target language |
| `GOOGLE_APPLICATION_CREDENTIALS` | — | Path to GCP service account JSON |
| `METADATA_SCHEMA_VERSION` | `2025-11-22` | Metadata schema version |
| `RATE_LIMIT_ENABLED` | `false` | Enable rate limiting |

### 6.2 Frontend Settings (Vite env)

Set in `.env.local` (local dev) or as Docker build args (production).

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_URL` | `http://localhost:8000` | Backend URL for Vite dev proxy (not exposed to browser) |
| `VITE_EXPECTED_METADATA_SCHEMA_VERSION` | `2025-11-22` | Metadata compatibility check |
| `VITE_DEBUG_LOGGING` | `false` | Enable debug logging |

**Note:** The frontend uses relative URLs for all API calls. In production, the reverse proxy routes requests. In development, Vite's proxy handles routing.

---

## 7. Production Deployment

### 7.1 Deployment Model

Production uses pre-built images from GHCR, orchestrated by Docker Compose (external to this repo):

```
../deploy/docker-compose.prod.yml    # Production compose
../staging/docker-compose.staging.yml # Staging compose (builds from source)
```

### 7.2 Reverse Proxy (Caddy)

Caddy configuration lives outside this repo. It handles:
- TLS termination
- Routing: static assets → frontend, `/v1/*` → backend
- Compression
- Security headers

### 7.3 Data Persistence

| Data | Location | Backup Strategy |
|------|----------|-----------------|
| SQLite database | `data/dictation.db` | Volume mount, file-level backup |
| Audio files | `audio/` | Volume mount, regenerable from TTS |
| GCP credentials | `keys/` | Read-only mount, managed externally |

### 7.4 Monitoring

**Health endpoint:** `GET /health`

Checks:
- Database connectivity
- Audio directory accessibility
- TTS service status
- Task manager status

The frontend polls `/health` every 30 seconds and displays status in the UI header.

**Logging:**
- Backend: Structured logs to stdout (Gunicorn/Uvicorn)
- Frontend: Browser console (enabled via `VITE_DEBUG_LOGGING`)
- CI: Bark push notifications on build success/failure

---

## 8. Security

| Concern | Mitigation |
|---------|------------|
| No authentication | Single-tenant design — network-level access control (firewall, VPN) |
| Credentials | GCP keys mounted read-only, never committed to repo |
| CORS | Configurable via `CORS_ORIGINS` |
| Non-root containers | Both images run as unprivileged users |
| Secrets in CI | GitHub Actions secrets for GHCR auth and Bark notifications |
| `.env` files | Gitignored (except `.env.example` / `env.example`) |

---

## 9. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| TTS audio not generating | GCP credentials missing or expired | Check `keys/google-credentials.json`, verify API enabled |
| Frontend can't reach API | Proxy misconfigured | Dev: check `vite.config.ts` proxy. Prod: check Caddy config |
| Database locked | Concurrent writes to SQLite | Ensure single backend instance, or switch to PostgreSQL |
| Audio cache full (browser) | IndexedDB at 100MB limit | Click "Clear Cache" button in UI, or wait for 7-day TTL eviction |
| CI build fails | ARM64 QEMU issues | Check GitHub Actions runner, verify QEMU setup step |
| Health check failing | Backend not started | Check container logs: `docker logs <container>` |
