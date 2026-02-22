# Last Whisper — Technical Architecture Spec

**Version:** 1.0
**Date:** 2026-02-22

---

## 1. System Overview

Last Whisper is a two-tier web application: a FastAPI backend serving a REST API and a Vite+React single-page application frontend. Both are containerized and deployed behind a Caddy reverse proxy on ARM64 infrastructure.

```
┌─────────────────────────────────────────────────────────┐
│                      Caddy (Reverse Proxy)              │
│   *.domain → frontend:3000  |  /v1/* → backend:8000    │
└──────────────┬──────────────────────────┬───────────────┘
               │                          │
   ┌───────────▼───────────┐  ┌───────────▼───────────┐
   │   Frontend (SPA)      │  │   Backend (API)        │
   │   Vite + React 19     │  │   FastAPI + SQLAlchemy │
   │   serve :3000         │  │   Gunicorn :8000       │
   └───────────────────────┘  └───────────┬───────────┘
                                          │
                              ┌───────────▼───────────┐
                              │   SQLite (data/)       │
                              │   Audio Files (audio/) │
                              │   GCP TTS / Translate  │
                              └───────────────────────┘
```

---

## 2. Backend Architecture

### 2.1 Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | FastAPI | Latest |
| ORM | SQLAlchemy 2.x | 2.x |
| Database | SQLite | 3.x |
| Python | CPython | 3.11+ |
| TTS | Google Cloud TTS | Chirp3-HD, WaveNet-B |
| Translation | Google Cloud Translate | v2 |
| WER Scoring | jiwer | Latest |
| Server | Gunicorn + Uvicorn workers | 4 workers |
| Config | pydantic-settings | Latest |

### 2.2 Module Structure

```
app/
├── main.py                    # FastAPI app factory, middleware, lifespan
├── core/
│   ├── config.py              # Settings (pydantic-settings, env-driven)
│   ├── exceptions.py          # Custom exception classes
│   ├── logging.py             # Structured logging setup
│   ├── security.py            # Security utilities
│   ├── build_info.py          # Git commit, build timestamp
│   ├── runtime_state.py       # Runtime state tracking
│   └── uvicorn_logging.py     # Custom Uvicorn log formatter
├── api/
│   ├── dependencies.py        # @lru_cache singleton wiring
│   └── routes/
│       ├── items.py           # /v1/items/* (10 endpoints)
│       ├── attempts.py        # /v1/attempts/* (3 endpoints)
│       ├── stats.py           # /v1/stats/* (4 endpoints)
│       ├── tags.py            # /v1/tags/* (3 endpoints)
│       ├── translations.py    # /v1/translations/* (3 endpoints)
│       ├── metadata.py        # /metadata (1 endpoint)
│       └── health.py          # /health (1 endpoint)
├── services/
│   ├── items_service.py       # Item CRUD, filtering, TTS orchestration
│   ├── attempts_service.py    # Attempt creation, WER scoring
│   ├── stats_service.py       # Aggregations, practice log, progress
│   ├── tags_service.py        # Tag CRUD
│   ├── metadata_service.py    # System metadata assembly
│   ├── task_service.py        # TTS task queries
│   ├── item_audio_manager.py  # TTS generation scheduling
│   └── exceptions.py          # Service-layer exceptions
├── models/
│   ├── models.py              # SQLAlchemy ORM models (6 tables)
│   ├── schemas.py             # Pydantic request/response schemas (40+)
│   ├── enums.py               # TaskStatus, ItemTTSStatus, TaskKind, etc.
│   └── database_manager.py    # Session factory, engine management
├── tts_engine/
│   ├── base.py                # BaseTTSEngine abstract class
│   ├── tts_engine_gcp.py      # Google Cloud TTS implementation
│   ├── tts_engine_manager.py  # Engine lifecycle management
│   └── tts_engine_wrapper.py  # Wrapper for dependency injection
└── translation/
    ├── base.py                # BaseTranslationProvider abstract class
    ├── translation_google.py  # Google Cloud Translate implementation
    ├── translation_manager.py # Translation orchestration + caching
    └── translation_wrapper.py # Wrapper for dependency injection
```

### 2.3 Dependency Injection

All services are wired as `@lru_cache` singletons in `api/dependencies.py`:

```
DatabaseManager ──┬── ItemsService ──── ItemAudioManager ──── TTSEngineManager
                  ├── AttemptsService
                  ├── StatsService
                  ├── TagsService
                  ├── MetadataService ── TTSEngineManager
                  └── TranslationManager ── TranslationServiceWrapper
```

A `reset_dependency_caches()` utility clears all singletons for test isolation.

### 2.4 TTS Engine Architecture

The TTS subsystem uses a queue/worker pattern:

1. Item creation triggers `ItemAudioManager.schedule_generation()`
2. A `ThreadPoolExecutor` submits the TTS request asynchronously
3. `TTSEngineGCP` sends the request to Google Cloud TTS API
4. Audio is saved as WAV (LINEAR16, 24kHz) to the `audio/` directory
5. `ItemTTS` record status transitions: `pending` → `ready` (or `failed`)

Voice selection: Random choice from 30+ Finnish voices (Chirp3-HD and WaveNet-B families). Long texts are chunked before submission.

### 2.5 WER Scoring

Attempt scoring uses a two-tier approach:

1. **Primary**: `jiwer` library computes Word Error Rate
2. **Fallback**: Manual Levenshtein edit distance (if jiwer fails)

Text normalization pipeline before comparison:
- Lowercase
- NFD Unicode normalization
- `unidecode` transliteration
- Punctuation removal
- Whitespace normalization

Score = `max(0, round((1 - WER) * 100))` → integer percentage 0–100.

### 2.6 Translation Caching

Translations are persisted in the database (`Translation` table) to avoid repeated API calls. The flow:

1. Frontend requests translation for item
2. Backend checks `Translation` table for cached result
3. If cached → return immediately
4. If not → call Google Cloud Translate, store result, return
5. Refresh endpoint forces a new translation regardless of cache

---

## 3. Frontend Architecture

### 3.1 Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Build Tool | Vite | 6.x |
| Framework | React | 19 |
| Routing | React Router | 7.x |
| UI Components | shadcn/ui + Radix | Latest |
| Styling | Tailwind CSS | 3.x |
| Server State | TanStack Query | 5.x |
| Language | TypeScript | 5.x (strict) |
| Testing | Vitest (unit) + Playwright (E2E) | Latest |

### 3.2 Application Structure

```
src/
├── main.tsx              # Entry: ReactDOM.createRoot, BrowserRouter, Providers
├── router.tsx            # Route definitions (7 routes)
├── app/
│   ├── providers.tsx     # Provider composition tree
│   └── globals.css       # Tailwind + CSS custom properties
├── components/
│   ├── ui/               # 24 shadcn/ui primitives
│   ├── layout/           # Header, sidebar, navigation, footer
│   ├── shared/           # FiltersPanel, ItemsListPanel, TranslationHelperCard
│   ├── dashboard/        # Dashboard stat cards, recent activity
│   ├── items/            # Item CRUD dialogs, items page
│   ├── practice/         # Practice workflow (form, result, interface)
│   ├── walkman/          # Continuous playback mode
│   ├── stats/            # Charts, practice log, per-item stats
│   ├── attempts/         # Attempt history, filter panel
│   ├── audio/            # Audio player components
│   ├── tags/             # Tag management
│   ├── theme/            # Dark mode provider + toggle
│   ├── cache/            # Cache cleanup button
│   └── debug/            # Environment display
├── hooks/                # Custom hooks (5)
├── contexts/             # React contexts (3)
├── lib/
│   ├── api/modules/      # Domain API clients (9 modules)
│   ├── audio-cache.ts    # IndexedDB audio cache
│   ├── query-client.ts   # TanStack Query configuration
│   ├── query-utils.ts    # Query key factories
│   ├── api-mocks.ts      # E2E test mock system
│   └── debug.ts          # Debug logging
└── types/api.ts          # API type contracts
```

### 3.3 Route Map

| Path | Component | Layout | Description |
|------|-----------|--------|-------------|
| `/` | `Dashboard` | MainLayout | Stats summary, recent items, recent activity |
| `/items` | `ItemsPage` | MainLayout | Item CRUD, filters, pagination |
| `/practice` | `PracticePage` | None (focus mode) | Dictation practice workflow |
| `/walkman` | `WalkmanPage` | MainLayout | Continuous audio playback |
| `/stats` | `StatsPage` | MainLayout | Analytics dashboards (3 tabs) |
| `/attempts` | `AttemptsPage` | MainLayout | Attempt history with filters |
| `/tags` | `TagsPage` | MainLayout | Tag management |

### 3.4 Provider Tree

```
BrowserRouter
  └── Providers
        └── QueryClientProvider
              └── ThemeProvider
                    └── SidebarProvider
                          └── LoadingProvider
                                └── MetadataProvider
                                      └── Toaster
                                            └── AppRoutes
```

### 3.5 Data Flow

```
Component ──uses──▶ Custom Hook ──calls──▶ API Module ──fetch──▶ Backend
    │                    │                      │
    │                    │                      └── HttpClient (credentials: include)
    │                    └── TanStack Query (cache, refetch, optimistic updates)
    └── React Context (UI state: sidebar, loading, metadata)
```

**Server state** is managed exclusively through TanStack Query. Components never call `fetch()` directly — they use hooks that call domain API modules.

**Client state** uses React Context for UI concerns:
- `SidebarContext` — sidebar open/collapsed state
- `LoadingContext` — navigation loading indicator
- `MetadataContext` — backend metadata (languages, limits, features)

**Persistent preferences** use `localStorage` via `usePersistentBoolean`:
- Filter panel visibility
- Item list panel visibility
- Focus mode state

### 3.6 Audio Caching

The frontend caches TTS audio in IndexedDB to minimize network requests:

- **Storage**: IndexedDB via `audio-cache.ts`
- **Capacity**: 100 MB maximum
- **TTL**: 7 days per entry
- **Eviction**: LRU (least recently used) when capacity exceeded
- **Key**: Item ID → audio Blob
- **Flow**: Check cache → if miss, fetch from `/v1/items/{id}/audio` → store in cache → play

### 3.7 Shared Component Patterns

Three shared components are reused across Practice, Walkman, and Items pages:

| Component | Purpose | Used By |
|-----------|---------|---------|
| `FiltersPanel` | Tag, difficulty, locale, practiced filters | Practice, Walkman, Items |
| `ItemsListPanel` | Virtualized item list with selection | Practice, Walkman |
| `TranslationHelperCard` | On-demand translation display | Practice, Walkman |

### 3.8 E2E Mock System

Playwright tests use a browser-side mock system (`api-mocks.ts`) that intercepts `fetch()` calls:

- Activated by `window.__MOCK_FETCH_ENABLED__ = true`
- Mock data registered via `window.__TEST_API_MOCKS__`
- Configurable latency via `window.__TEST_API_MOCK_LATENCY__`
- Force real network via `window.__TEST_API_FORCE_NETWORK__`

This avoids needing a running backend for E2E tests.

---

## 4. API Design

All API endpoints are versioned under `/v1/` (except `/metadata` and `/health`).

- Request/response format: JSON
- Authentication: None (single-tenant)
- Error format: `{ "detail": "message" }` or `{ "detail": [{ "loc": [...], "msg": "...", "type": "..." }] }`
- Pagination: `page` + `per_page` query parameters, response includes `total`, `total_pages`

See [API Reference](./api-reference.md) for complete endpoint documentation.

---

## 5. Cross-Cutting Concerns

### 5.1 Error Handling

**Backend:**
- Custom exceptions in `services/exceptions.py` map to HTTP status codes
- FastAPI exception handlers return structured error responses
- Validation errors return field-level detail with context (min/max values, allowed values)

**Frontend:**
- `HttpClient` in `http.ts` centralizes error parsing
- Validation errors are formatted with field paths and context
- TanStack Query handles retry logic and error states

### 5.2 Logging

- Backend uses structured logging via `core/logging.py`
- Custom Uvicorn formatter for consistent log format
- Frontend uses `debug.ts` — enabled by `VITE_DEBUG_LOGGING=true` or dev mode
- Debug categories: `api.request`, `api.response`, `audio`, `cache`

### 5.3 Health Monitoring

The `/health` endpoint checks:
- Database connectivity
- Audio directory accessibility
- TTS service status
- Task manager status

Frontend polls health every 30 seconds and displays status in the layout.

### 5.4 Configuration

**Backend** (`pydantic-settings`):
- Environment-driven via `.env` or environment variables
- Settings: database URL, audio directory, TTS provider config, translation config, CORS origins, rate limits, metadata schema version

**Frontend** (Vite env):
- `VITE_DEBUG_LOGGING` — enable debug logging
- `VITE_EXPECTED_METADATA_SCHEMA_VERSION` — metadata compatibility check
- Dev proxy configured in `vite.config.ts` for local development
