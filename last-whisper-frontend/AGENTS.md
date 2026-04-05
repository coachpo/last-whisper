# Last Whisper Frontend — Knowledge Base

**Generated:** 2026-02-22 · **Branch:** main

## Overview

Vite + React 19 SPA for dictation practice, dashboards, tags, and cached audio playback. TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Router. Offline-friendly audio via IndexedDB (100MB cap, 7-day TTL). The app lives in `last-whisper-frontend/` inside the root monorepo.

## Structure

```
src/
├── main.tsx                # App entry point (React root, BrowserRouter, Providers)
├── router.tsx              # React Router route definitions (7 routes)
├── vite-env.d.ts           # Vite environment type declarations
├── app/
│   ├── globals.css         # Tailwind CSS + HSL CSS variables
│   └── providers.tsx       # Provider tree: QueryClient, Theme, Sidebar, Loading, Metadata
├── components/
│   ├── ui/                 # shadcn/ui primitives (button, card, dialog, toast, etc.)
│   ├── layout/             # Header, sidebar, navigation, footer, health-status
│   ├── shared/             # Reusable: filters-panel, items-list-panel, translation-helper
│   ├── items/              # Item CRUD dialogs, bulk create, details
│   ├── practice/           # Practice interface, form, result
│   ├── walkman/            # Walkman interface
│   ├── stats/              # Stats charts and tabs
│   ├── attempts/           # Attempt history, filter panel
│   ├── audio/              # Audio player components
│   ├── tags/               # Tag selector, tags page
│   ├── theme/              # Theme provider + toggle (dark mode)
│   ├── cache/              # Cache cleanup button
│   ├── dashboard/          # Dashboard cards
│   └── debug/              # Env display
├── hooks/                  # useHealth, usePaginatedItems, useItemTranslation, useAudioRefresh, usePersistentBoolean
├── contexts/               # SidebarContext, LoadingContext, MetadataContext
├── lib/
│   ├── api.ts              # API client factory + singleton
│   ├── api/modules/        # Per-domain API modules: http, items, attempts, stats, tags, translations, tts, health, metadata
│   ├── audio-cache.ts      # IndexedDB audio cache (100MB, 7-day TTL)
│   ├── query-client.ts     # TanStack Query client config
│   ├── query-utils.ts      # Query key factories and helpers
│   ├── api-mocks.ts        # E2E mock data
│   ├── debug.ts            # Debug logging utility
│   ├── metadata.ts         # Metadata helpers
│   └── utils.ts            # General utilities (cn, formatters)
└── types/api.ts            # Backend API type contracts
tests/
├── e2e/                    # Playwright: TC_###_scenario.test.ts (47 files)
│   └── fixtures/           # Mock setup, test helpers, global-setup
└── unit/                   # Vitest unit tests
```

## Where to Look

| Task | Location | Notes |
|------|----------|-------|
| Add page route | `src/router.tsx` + `src/components/{feature}/` | Add Route in router.tsx, component in components/ |
| Add API call | `src/lib/api/modules/` | One module per backend domain, use TanStack Query |
| Add shadcn component | `src/components/ui/` | Via `components.json` registry |
| Add shared component | `src/components/shared/` | Reusable across features |
| Add hook | `src/hooks/` | `useX` naming convention |
| Add context | `src/contexts/` | Wrap in `app/providers.tsx` |
| Add E2E test | `tests/e2e/` | `TC_###_scenario.test.ts`, call `setupApiMocks()` first |
| Add unit test | `tests/unit/` | Vitest, test pure functions/hooks |
| Change theme/colors | `src/app/globals.css` + `tailwind.config.cjs` | HSL CSS variables |
| Change API types | `src/types/api.ts` | Must match backend schemas |

## Architecture

- **Routing**: React Router v7 with `BrowserRouter` in `main.tsx`, routes defined in `router.tsx`
- **Data fetching**: TanStack Query with per-domain modules in `lib/api/modules/` — never fetch directly
- **API client**: `lib/api/modules/http.ts` base → domain modules (items, attempts, etc.) → consumed by components
- **State**: React Context for UI state (sidebar, loading, metadata); TanStack Query for server state
- **Providers**: `app/providers.tsx` wraps QueryClientProvider, ThemeProvider, contexts
- **Audio**: IndexedDB cache with 100MB cap and 7-day TTL; audio player in `components/audio/`
- **Styling**: Tailwind utility-first, HSL CSS variables via `hsl(var(--primary))`, class-based dark mode
- **Build**: Vite with `@vitejs/plugin-react`, outputs static files to `dist/`
- **Dev proxy**: Vite `server.proxy` forwards `/v1/*`, `/api/v1/*`, `/metadata`, `/health` to backend

## Conventions

- TypeScript strict mode; React 19 function components and hooks only
- 2-space indent; Tailwind utility-first; no inline styles
- PascalCase components, `useX` hooks, camelCase helpers
- ESLint flat config (`eslint.config.mjs`) with TypeScript plugin; warnings for `any`/unused vars
- E2E tests: `TC_###_scenario.test.ts` naming, numbered for traceability
- Conventional Commits: `type(scope): summary`
- Environment variables use `VITE_` prefix for browser-exposed values

## Testing

- **E2E**: Playwright with Chromium, 3 viewports (desktop, tablet 1024×768, mobile 430×932)
  - Traces on first retry, screenshots on failure
  - Always `setupApiMocks()` before navigation
  - `E2E_BASE_URL` can target preview; `CI=true` avoids dev server reuse
- **Unit**: Vitest with jsdom environment
- **Quality**: `pnpm lint` + `pnpm type-check` before commits

## Commands

Commands below assume you are running inside `last-whisper-frontend/`; repo-wide pnpm settings are owned by the root `pnpm-workspace.yaml`.

```bash
pnpm install                # pnpm 10.30.1
pnpm dev                    # Vite dev server :3000
pnpm build                  # tsc + vite build → dist/
pnpm preview                # serve production build locally
pnpm lint                   # ESLint
pnpm lint:fix               # ESLint auto-fix
pnpm type-check             # tsc --noEmit
pnpm test:unit              # Vitest
pnpm test:e2e               # Playwright (mocked API)
pnpm test:e2e:ui            # Playwright UI runner
pnpm generate-icons         # Regenerate icon set
```

## Anti-Patterns

- Never fetch directly — use TanStack Query hooks via `lib/api/modules/`
- Never suppress types with `as any`, `@ts-ignore`, `@ts-expect-error`
- Never hardcode API URLs — the app uses relative URLs; routing is handled by the reverse proxy (prod) or Vite proxy (dev)
- Never commit `.env.*` files (except `.env.example`)
- Don't put business logic in route files — delegate to components

## Configuration

- Copy `env.example` → `.env.local`
- `BACKEND_URL` — backend origin for Vite dev proxy (default `http://localhost:8000`, server-side only)
- `VITE_EXPECTED_METADATA_SCHEMA_VERSION` — defaults to `2025-11-22`
- `VITE_DEBUG_LOGGING` — `false` by default
- `E2E_BASE_URL` — for Playwright targeting preview environments
