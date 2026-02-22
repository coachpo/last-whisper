# Last Whisper — Testing Strategy

**Version:** 1.0
**Date:** 2026-02-22

---

## 1. Overview

Last Whisper uses a three-layer testing strategy: backend unit/integration tests (pytest), frontend unit tests (Vitest), and frontend end-to-end tests (Playwright). All tests run locally; CI builds container images but does not currently execute tests in the pipeline.

---

## 2. Backend Testing

### 2.1 Stack

| Tool | Purpose |
|------|---------|
| pytest | Test runner and framework |
| pytest-asyncio | Async test support |
| pytest-cov | Coverage reporting |
| httpx | FastAPI `TestClient` HTTP transport |
| SQLite (in-memory) | Isolated test database per fixture |

### 2.2 Test Structure

```
tests/
├── conftest.py                          # Shared fixtures, stubs, test client factory
├── api/                                 # (reserved for route-level API tests)
├── test_attempts_api.py                 # Attempts endpoint integration tests
├── test_attempts_service.py             # AttemptsService unit tests (scoring, WER)
├── test_config.py                       # Settings/config validation tests
├── test_database_manager.py             # DatabaseManager lifecycle tests
├── test_http_handlers.py                # Exception handler tests
├── test_items_api.py                    # Items endpoint integration tests
├── test_items_service.py                # ItemsService unit tests (CRUD, filtering)
├── test_metadata_service.py             # MetadataService assembly tests
├── test_security.py                     # Rate limiting, security utility tests
├── test_stats_service.py               # StatsService aggregation tests
├── test_tags_service.py                 # TagsService CRUD tests
└── test_tts_engine_manager_upsert.py   # TTS task upsert logic tests
```

### 2.3 Fixture Architecture

The `conftest.py` provides a complete test harness:

**Stubs:**
- `DummyTaskManager` — Captures TTS submissions without calling Google Cloud
- `DummyTTSEngine` — Exposes `is_initialized` flag for health checks
- `DummyTranslationManager` — Returns canned translations, blocks same-language requests

**Core Fixtures:**
- `db_manager` — Fresh SQLite database per test (tables created/dropped each run)
- `test_db_url` — Session-scoped temp path for the test database
- `items_service`, `attempts_service`, `stats_service`, `tags_service` — Real service instances wired to test DB
- `test_client` — FastAPI `TestClient` with all dependency overrides applied

**Isolation:**
- `reset_dependency_singletons` (autouse) — Clears `@lru_cache` singletons and rate limiter state before/after every test
- Each test gets a clean database via `Base.metadata.drop_all` / `create_all`

### 2.4 Conventions

- File naming: `test_*.py`, mirroring `app/` package paths
- Assert both HTTP status codes and response payload schemas
- Use `TestClient` for integration tests (routes → services → DB)
- Use service fixtures directly for unit tests (no HTTP layer)
- Coverage priority: `app/core`, `app/services`, `app/translation`

### 2.5 Commands

```bash
cd last-whisper-backend
pytest                                     # run all tests
pytest --cov=app --cov-report=term-missing # with coverage
pytest tests/test_items_service.py         # single file
pytest -k "test_create"                    # pattern match
ruff check app tests                       # lint
black app tests                            # format
```

---

## 3. Frontend Unit Testing

### 3.1 Stack

| Tool | Purpose |
|------|---------|
| Vitest | Test runner (Vite-native) |
| jsdom | Browser environment simulation |
| @testing-library/react | (available for component tests) |

### 3.2 Configuration

Defined in `vitest.config.ts`:
- Environment: `jsdom`
- Setup file: `tests/unit/setup.ts`
- Include: `tests/unit/**/*.test.{ts,tsx}`
- Exclude: `tests/e2e/**/*`
- Path alias: `@` → `src/`

### 3.3 Test Files

```
tests/unit/
├── setup.ts                        # Test environment setup
├── audio-cache.test.ts             # IndexedDB audio cache (get, set, eviction, TTL)
├── metadata.test.ts                # Metadata parsing and validation
├── query-utils.test.ts             # Query key serialization utilities
└── usePersistentBoolean.test.tsx   # localStorage-backed boolean hook
```

### 3.4 Commands

```bash
cd last-whisper-frontend
pnpm test:unit          # run all unit tests
pnpm test:unit -- --watch  # watch mode (manual)
```

---

## 4. Frontend E2E Testing

### 4.1 Stack

| Tool | Purpose |
|------|---------|
| Playwright | Browser automation and assertions |
| Chromium | Primary browser (3 viewport configs) |

### 4.2 Configuration

Defined in `playwright.config.ts`:

| Setting | Value |
|---------|-------|
| Test directory | `tests/e2e/` |
| Parallel | Yes (`fullyParallel: true`) |
| Timeout | 60 seconds per test |
| Retries | 0 (traces on first retry if enabled) |
| Screenshots | On failure only |
| Video | Retained on failure |
| Base URL | `http://localhost:3000` (or `E2E_BASE_URL`) |
| Global setup | `tests/e2e/global-setup.ts` |

### 4.3 Browser Projects

| Project | Device | Viewport | Test Scope |
|---------|--------|----------|------------|
| `chromium` | Desktop Chrome | Default | All tests |
| `tablet-chromium` | iPad (gen 7) landscape | 1024×768 | Responsive, interaction, accessibility, error states |
| `mobile-chromium` | iPhone 14 Pro | 430×932 | Responsive, interaction, accessibility, error states |

### 4.4 Test Catalog

Tests follow the naming convention `TC_###_scenario.test.ts`:

| Range | Category | Tests |
|-------|----------|-------|
| TC_001–TC_009 | Core flows | Dashboard navigation, items CRUD, stats tabs, attempts history, practice/walkman, tags, pagination, mutations, header actions |
| TC_010–TC_028 | Feature coverage | Walkman filters, practice submit/next, bulk create, practice log, items filters/create/edit/validation, attempts pagination/date/per-page, tags errors, stats tabs, attempts tabs, stats refresh/empty |
| TC_029–TC_038 | UI quality | Global polish, loading skeletons, density, focus mode, responsive smoke, interaction states, keyboard accessibility, error/empty states, long text |
| TC_040–TC_044 | Additional features | Audio refresh, tag filtering, attempts filters/tabs, tags CRUD/search, items delete dialog |
| TC_101–TC_103 | Deep flow scenarios | Tags DFS paths, items filters/pagination DFS, dashboard banner DFS |

**Total: 47 E2E test files** covering all pages, responsive viewports, accessibility, and edge cases.

### 4.5 API Mocking

E2E tests use browser-level API mocks (not network interception):
- `setupApiMocks()` must be called before navigation in every test
- Mock module loaded via `window.__TEST_API_MOCKS__` / `window.__MOCK_FETCH_ENABLED__` signals
- Configurable latency via `window.__TEST_API_MOCK_LATENCY__`
- Fixtures in `tests/e2e/fixtures/` provide test data

### 4.6 Commands

```bash
cd last-whisper-frontend
pnpm test:e2e           # run all E2E tests (starts dev server automatically)
pnpm test:e2e:ui        # Playwright UI runner (interactive)
E2E_BASE_URL=http://localhost:4173 pnpm test:e2e  # target preview build
```

---

## 5. Quality Gates

### 5.1 Linting & Type Checking

| Tool | Scope | Command |
|------|-------|---------|
| Ruff | Backend Python linting | `ruff check app tests` |
| Black | Backend Python formatting | `black app tests` |
| ESLint | Frontend TypeScript/React linting | `pnpm lint` |
| TypeScript | Frontend type checking | `pnpm type-check` |

### 5.2 Pre-Commit Checklist

```bash
# Backend
ruff check app tests && black --check app tests && pytest

# Frontend
pnpm lint && pnpm type-check && pnpm test:unit && pnpm build
```

### 5.3 Coverage Targets

| Layer | Priority Modules | Target |
|-------|-----------------|--------|
| Backend | `app/core`, `app/services`, `app/translation` | High coverage first |
| Frontend unit | `lib/audio-cache`, `lib/query-utils`, `lib/metadata`, hooks | Utility-focused |
| Frontend E2E | All pages, responsive, accessibility | 47 test files across 3 viewports |

---

## 6. Adding New Tests

### Backend

1. Create `tests/test_{module}.py` mirroring the `app/` path
2. Use `db_manager` fixture for database access
3. Use `test_client` fixture for HTTP integration tests
4. Add stubs to `conftest.py` if new external services are involved
5. Assert status codes AND response schemas

### Frontend Unit

1. Create `tests/unit/{module}.test.ts` (or `.tsx` for component tests)
2. Use `jsdom` environment (configured globally)
3. Import from `@/` alias as in production code

### Frontend E2E

1. Create `tests/e2e/TC_###_{scenario}.test.ts`
2. Call `setupApiMocks()` before any navigation
3. Use Playwright locators and assertions
4. For responsive tests, ensure the test file matches the `testMatch` patterns for tablet/mobile projects
