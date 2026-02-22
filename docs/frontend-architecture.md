# Last Whisper — Frontend Architecture

**Version:** 1.0
**Date:** 2026-02-22

---

## 1. Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 19 |
| Build Tool | Vite | 6 |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS | 3.x |
| Component Library | shadcn/ui | Latest |
| Data Fetching | TanStack Query | 5.x |
| Routing | React Router | 7.x (via `react-router-dom`) |
| Package Manager | pnpm | 10.30.1 |
| Testing (Unit) | Vitest | Latest |
| Testing (E2E) | Playwright | Latest |

---

## 2. Application Structure

```
src/
├── main.tsx                    # React root, BrowserRouter, Providers wrapper
├── router.tsx                  # Route definitions (7 routes)
├── vite-env.d.ts               # Vite environment type declarations
├── app/
│   ├── globals.css             # Tailwind base + HSL CSS variables (theming)
│   └── providers.tsx           # Provider composition tree
├── components/
│   ├── ui/                     # shadcn/ui primitives (23 components)
│   ├── layout/                 # Shell: header, sidebar, navigation, footer, health status
│   ├── shared/                 # Reusable: filters-panel, items-list-panel, translation-helper
│   ├── items/                  # Item CRUD dialogs, bulk create, item details
│   ├── practice/               # Practice interface, form, result display
│   ├── walkman/                # Passive listening mode
│   ├── stats/                  # Stats charts and tabs
│   ├── attempts/               # Attempt history, filter panel
│   ├── audio/                  # Audio player components
│   ├── tags/                   # Tag selector, tags management page
│   ├── theme/                  # Theme provider + dark mode toggle
│   ├── cache/                  # Cache cleanup button
│   ├── dashboard/              # Dashboard overview cards
│   └── debug/                  # Environment display (dev only)
├── hooks/                      # Custom React hooks
├── contexts/                   # React Context providers
├── lib/                        # Utilities, API client, audio cache, debug
│   └── api/modules/            # Per-domain API client modules
└── types/                      # TypeScript type definitions
```

---

## 3. Routing

All routes are defined in `src/router.tsx` using React Router's `<Routes>` / `<Route>` components.

| Path | Component | Layout | Description |
|------|-----------|--------|-------------|
| `/` | `Dashboard` | `MainLayout` | Overview dashboard with summary cards |
| `/items` | `ItemsPage` | `MainLayout` | Item library — CRUD, filtering, bulk create |
| `/practice` | `PracticePage` | Self-managed | Dictation practice with scoring |
| `/walkman` | `WalkmanPage` | `MainLayout` | Passive audio listening mode |
| `/stats` | `StatsPage` | `MainLayout` | Analytics charts and progress tracking |
| `/attempts` | `AttemptsPage` | `MainLayout` | Attempt history with filters |
| `/tags` | `TagsPage` | `MainLayout` | Tag management |

The `PracticePage` manages its own layout (supports focus mode which hides navigation).

---

## 4. Provider Tree

Providers are composed in `src/app/providers.tsx` and wrap the entire application:

```
QueryClientProvider          ← TanStack Query
  └─ ThemeProvider           ← Dark/light/system theme (class-based)
       └─ Suspense           ← React Suspense boundary
            └─ LoadingProvider    ← Global loading state context
                 └─ MetadataProvider  ← Backend metadata (features, limits, languages)
                      └─ SidebarProvider  ← Sidebar open/close state
                           └─ {children}
                           └─ Toaster       ← Toast notifications
                           └─ ReactQueryDevtools  ← Dev-only query inspector
```

---

## 5. State Management

The app uses a layered state approach — no global store (Redux, Zustand, etc.).

### 5.1 Server State (TanStack Query)

All API data flows through TanStack Query. The `QueryClient` is configured in `src/lib/query-client.ts` with per-key defaults:

| Query Key | Stale Time | GC Time | Refetch on Focus |
|-----------|-----------|---------|------------------|
| `items` | 30s | 5 min | No |
| `stats-summary` | 5 min | 15 min | Yes |
| `stats-progress` | 2 min | 10 min | Yes |
| `practice-log` | 1 min | 10 min | No |
| `attempts` | 1 min | 5 min | Yes |
| (default) | 1 min | 10 min | Yes |

Retry policy: no retry on 4xx errors, up to 2 retries otherwise.

### 5.2 React Context

Three lightweight contexts for UI state:

| Context | File | Purpose |
|---------|------|---------|
| `SidebarContext` | `contexts/sidebar-context.tsx` | Sidebar open/close toggle |
| `LoadingContext` | `contexts/loading-context.tsx` | Global loading indicator state |
| `MetadataContext` | `contexts/metadata-context.tsx` | Backend metadata (features, limits, translation languages) |

### 5.3 Component-Local State

Practice flow state (user text, scores, focus mode, timer) lives in `PracticePage` via `useState` and custom hooks. No state is lifted higher than necessary.

---

## 6. API Client Layer

### 6.1 Architecture

```
components/hooks → apiClient (singleton) → module factories → HttpClient → fetch()
```

The API client is assembled in `src/lib/api.ts` from per-domain module factories:

| Module | File | Endpoints |
|--------|------|-----------|
| Items | `api/modules/items.ts` | `getItems`, `createItem`, `getItem`, `deleteItem`, `updateItemTags`, `updateItemDifficulty`, `bulkCreateItems`, `getItemAudio`, `refreshItemAudio`, `getItemTTSStatus` |
| Attempts | `api/modules/attempts.ts` | `createAttempt`, `getAttempts` |
| Stats | `api/modules/stats.ts` | `getStatsSummary`, `getPracticeLog`, `getItemStats`, `getStatsProgress` |
| Tags | `api/modules/tags.ts` | `getTags`, `createTag`, `deleteTag` |
| Translations | `api/modules/translations.ts` | `getTranslation`, `refreshTranslation` |
| TTS | `api/modules/tts.ts` | TTS status polling |
| Health | `api/modules/health.ts` | `getHealth` |
| Metadata | `api/modules/metadata.ts` | `getMetadata` |

### 6.2 HttpClient

`HttpClient` (`api/modules/http.ts`) is the single point of network access:

- Uses relative URLs (empty `API_BASE_URL`) — routing handled by Vite dev proxy or production reverse proxy
- Automatic `Content-Type: application/json` header injection
- Structured error parsing with field-level validation detail
- `requestBlob()` method for binary responses (audio files)
- Browser mock support for E2E tests (detects `window.__TEST_API_MOCKS__`)

### 6.3 URL Strategy

The frontend never hardcodes backend URLs. All API calls use relative paths:

- **Development**: Vite dev server proxies `/v1/*`, `/api/v1/*`, `/metadata`, `/health` → `http://localhost:8000`
- **Production**: Caddy reverse proxy routes API paths to the backend container

---

## 7. Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| `usePaginatedItems` | `hooks/usePaginatedItems.ts` | Paginated item fetching with filtering, cursor navigation, and auto-load-more |
| `useItemTranslation` | `hooks/useItemTranslation.ts` | Translation fetching/caching per item + language pair |
| `useAudioRefresh` | `hooks/useAudioRefresh.ts` | Audio regeneration with TTS status polling |
| `useHealthStatus` | `hooks/use-health-status.ts` | Backend health polling (30s interval) |
| `usePersistentBoolean` | `hooks/usePersistentBoolean.ts` | `localStorage`-backed boolean toggle (e.g., focus mode, panel visibility) |

### `usePaginatedItems` (key hook)

Manages the item navigation model used by Practice and Walkman pages:
- Maintains a flat `allItems` array accumulated across pages
- Tracks `currentItem` and `currentItemIndex` for sequential navigation
- Supports filter changes (resets to page 1), load-more (appends next page), and direct item selection
- Integrates with TanStack Query for data fetching with `['items', filtersKey]` query keys

---

## 8. Audio System

### 8.1 Audio Playback

Audio player components live in `src/components/audio/`. The player fetches audio blobs from `/v1/items/{id}/audio` and creates object URLs for `<audio>` element playback.

### 8.2 IndexedDB Cache

`src/lib/audio-cache.ts` implements a client-side audio cache:

| Property | Value |
|----------|-------|
| Database | `last-whisper-audio-cache` (IndexedDB) |
| Store | `audio` (keyPath: `id`) |
| Max Size | 100 MB |
| TTL | 7 days |
| Eviction | LRU — oldest entries removed first when size limit exceeded |
| Indexes | `timestamp`, `size` |

**Cache flow:**
1. Check IndexedDB for cached audio by item ID
2. If hit and not expired → return cached blob
3. If miss or expired → fetch from API, store in IndexedDB, return
4. After each write → check total size, evict oldest if over 100 MB

**API:**
- `audioCache.getAudio(itemId)` → `{ audioData, mimeType } | null`
- `audioCache.setAudio(itemId, data, mimeType)` → stores with timestamp
- `audioCache.removeAudio(itemId)` → deletes single entry
- `audioCache.clearAll()` → wipes entire cache
- `audioCache.getCacheSize()` → total bytes
- `audioCache.getCacheStats()` → `{ totalSize, entryCount, oldestEntry, newestEntry }`

---

## 9. Component Library (shadcn/ui)

23 shadcn/ui primitives in `src/components/ui/`:

`alert-dialog`, `badge`, `button`, `card`, `date-picker`, `dialog`, `dropdown-menu`, `error-boundary`, `input`, `label`, `page-loading`, `pagination`, `popover`, `progress`, `select`, `separator`, `skeleton`, `slider`, `tabs`, `textarea`, `toast`, `toaster`, `use-toast`

These are copy-pasted shadcn/ui components (not imported from a package) — customized via Tailwind CSS variables defined in `globals.css`.

---

## 10. Theming

- CSS variables (HSL) defined in `src/app/globals.css` for light and dark modes
- `ThemeProvider` from `src/components/theme/theme-provider.tsx` applies `class` attribute to `<html>`
- Theme toggle component allows switching between light, dark, and system preference
- All components use Tailwind's `dark:` variant for dark mode styles

---

## 11. Build & Dev Configuration

### Vite Config (`vite.config.ts`)

- React plugin via `@vitejs/plugin-react`
- Path alias: `@` → `./src`
- Dev server on port 3000
- Proxy rules: `/v1/*`, `/api/v1/*`, `/metadata`, `/health` → backend (default `http://localhost:8000`)
- Production build outputs to `dist/` with sourcemaps

### Environment Variables

| Variable | Scope | Default | Description |
|----------|-------|---------|-------------|
| `BACKEND_URL` | Server (Vite proxy) | `http://localhost:8000` | Backend origin for dev proxy |
| `VITE_EXPECTED_METADATA_SCHEMA_VERSION` | Client | `2025-11-22` | Metadata compatibility check |
| `VITE_DEBUG_LOGGING` | Client | `false` | Enable debug logging to console |
| `VITE_ENABLE_RQ_DEVTOOLS` | Client | `true` (dev) | Show React Query devtools |
| `E2E_BASE_URL` | Test | — | Playwright target URL |

### TypeScript

- Strict mode enabled
- Path aliases via `tsconfig.json` (`@/*` → `src/*`)
- Type checking: `pnpm type-check` (runs `tsc --noEmit`)

---

## 12. Debug System

`src/lib/debug.ts` provides structured debug logging:

- Enabled when `VITE_DEBUG_LOGGING=true` or in dev mode
- Categories: `api.request`, `api.response`, `audio`, `cache`
- All debug output goes to browser console
- `src/components/debug/` renders environment info in dev mode

---

## 13. Error Handling

### Error Boundary

`src/components/ui/error-boundary.tsx` wraps route-level components to catch React render errors and display a fallback UI.

### API Errors

- `HttpClient` parses structured error responses from the backend
- Validation errors (422) are formatted with field paths and context (min/max values, allowed values)
- TanStack Query handles retry logic — no retry on 4xx, up to 2 retries on network/5xx errors
- Toast notifications surface errors to the user via `useToast`

---

## 14. Key Data Flow: Practice Session

```
1. PracticePage mounts
2. usePaginatedItems fetches first page of items via TanStack Query
3. User selects item (or first item auto-selected)
4. Audio player checks IndexedDB cache → fetches from API if miss
5. User listens to audio, types transcription
6. Submit → POST /v1/attempts (via useMutation)
7. Score returned → displayed with word-by-word comparison
8. User clicks Next → currentItemIndex advances
9. If at end of loaded items → requestMoreItems fetches next page
```
