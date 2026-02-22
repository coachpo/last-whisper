# Last Whisper — Product Requirements Document

**Version:** 1.0
**Date:** 2026-02-22
**Status:** Living Document

---

## 1. Product Overview

Last Whisper is a self-hosted dictation training application designed for language learners who want to improve their listening comprehension and transcription accuracy. The system generates text-to-speech audio from curated text items, plays them back to the user, and scores their dictation attempts using Word Error Rate (WER) analysis.

The product operates without user authentication — it is a single-tenant, personal tool optimized for individual use on a home server or local machine.

### 1.1 Problem Statement

Language learners lack an efficient, self-paced tool for practicing dictation — the skill of hearing spoken language and accurately transcribing it. Existing solutions are either too rigid (fixed curricula), too expensive (subscription services), or lack the feedback loop needed for measurable improvement.

### 1.2 Target User

A single language learner (currently optimized for Finnish) who:
- Wants to practice dictation at their own pace
- Has access to a home server or local machine (Raspberry Pi, ARM server, or desktop)
- Values privacy and data ownership over cloud convenience
- Wants quantitative feedback on their progress

### 1.3 Product Goals

1. Enable self-paced dictation practice with instant, objective scoring
2. Provide analytics to track improvement over time
3. Support offline-capable audio playback via client-side caching
4. Minimize friction — no accounts, no setup wizards, just practice

---

## 2. User Stories

### 2.1 Item Management

| ID | Story | Priority |
|----|-------|----------|
| US-01 | As a learner, I want to create dictation items with text so I can build my practice library | P0 |
| US-02 | As a learner, I want to bulk-create items from a JSON list so I can import content efficiently | P0 |
| US-03 | As a learner, I want to tag items (e.g., "verbs", "news", "chapter-3") so I can organize my library | P1 |
| US-04 | As a learner, I want to set difficulty levels on items so I can filter by challenge level | P1 |
| US-05 | As a learner, I want to delete items I no longer need | P1 |
| US-06 | As a learner, I want items to automatically get TTS audio generated after creation | P0 |
| US-07 | As a learner, I want to refresh an item's audio if the quality is poor | P2 |

### 2.2 Practice Mode

| ID | Story | Priority |
|----|-------|----------|
| US-10 | As a learner, I want to select items by tag, difficulty, or locale and start practicing | P0 |
| US-11 | As a learner, I want to hear the audio for an item and type what I hear | P0 |
| US-12 | As a learner, I want to see my score (percentage) immediately after submitting | P0 |
| US-13 | As a learner, I want to see a word-by-word comparison of my attempt vs. the original | P1 |
| US-14 | As a learner, I want to move to the next item without returning to the list | P1 |
| US-15 | As a learner, I want a "focus mode" that hides navigation for distraction-free practice | P2 |

### 2.3 Walkman Mode

| ID | Story | Priority |
|----|-------|----------|
| US-20 | As a learner, I want to listen to items continuously without typing (passive listening) | P1 |
| US-21 | As a learner, I want to navigate between items (prev/next) while in walkman mode | P1 |
| US-22 | As a learner, I want to see translations while listening to help comprehension | P2 |

### 2.4 Translation

| ID | Story | Priority |
|----|-------|----------|
| US-30 | As a learner, I want to see a translation of any item's text to aid understanding | P1 |
| US-31 | As a learner, I want translations to be cached so they load instantly on repeat views | P1 |
| US-32 | As a learner, I want to refresh a translation if it seems inaccurate | P2 |

### 2.5 Analytics & Progress

| ID | Story | Priority |
|----|-------|----------|
| US-40 | As a learner, I want to see summary stats: total attempts, average score, best/worst scores | P0 |
| US-41 | As a learner, I want to see my progress over time (daily score trends) | P1 |
| US-42 | As a learner, I want to see per-item statistics to identify weak areas | P1 |
| US-43 | As a learner, I want to browse my attempt history with filters (date, item) | P1 |
| US-44 | As a learner, I want a practice log showing sessions and scores | P1 |

### 2.6 Tag Management

| ID | Story | Priority |
|----|-------|----------|
| US-50 | As a learner, I want to create preset tags for organizing items | P1 |
| US-51 | As a learner, I want to delete tags I no longer use | P2 |
| US-52 | As a learner, I want to search and sort my tags | P2 |

### 2.7 System Health & Metadata

| ID | Story | Priority |
|----|-------|----------|
| US-60 | As a learner, I want to see if the backend services are healthy (TTS, database) | P2 |
| US-61 | As a learner, I want the app to show supported languages and TTS voices | P2 |

---

## 3. Feature Specifications

### 3.1 Dictation Items

Items are the core content unit — a piece of text in a target language that the user will practice transcribing.

**Attributes:**
- `text` — The dictation content (required, 1–10,000 characters)
- `locale` — Language code, e.g., `fi-FI` (required)
- `difficulty` — 1–5 scale (auto-calculated if not provided)
- `tags` — Array of string labels for organization
- `tts_status` — `pending` → `ready` → `failed` (managed by backend)

**Auto-Difficulty Calculation:**
| Level | Word Count | OR | Letter Count |
|-------|-----------|-----|-------------|
| 1 | ≤ 6 words | | ≤ 50 letters |
| 2 | 7–9 words | | 51–80 letters |
| 3 | 10–12 words | | 81–110 letters |
| 4 | 13–15 words | | 111–140 letters |
| 5 | ≥ 16 words | | ≥ 141 letters |

**TTS Audio Generation:**
- Triggered automatically on item creation
- Uses Google Cloud TTS (Chirp3-HD and WaveNet-B voices for Finnish)
- Audio stored as WAV files (LINEAR16, 24kHz)
- Random voice selection from 30+ available voices
- Long texts are chunked for processing
- Audio can be refreshed on demand

### 3.2 Practice Workflow

1. User selects filters (locale, tags, difficulty, practiced/unpracticed)
2. System presents a paginated list of matching items
3. User selects an item → audio player loads
4. User listens to audio (play/pause/replay) and types their transcription
5. User submits → system scores using WER
6. Result screen shows: percentage score, word count, correct words, word-by-word diff
7. User can proceed to next item or retry

**WER Scoring:**
- Primary engine: `jiwer` library
- Fallback: Manual Levenshtein edit distance calculation
- Text normalization: lowercase, NFD Unicode normalization, unidecode transliteration, punctuation removal
- Score = `(1 - WER) × 100`, clamped to 0–100%

### 3.3 Walkman Mode

Passive listening mode without dictation input:
- Same filter/selection flow as Practice
- Audio player with prev/next navigation
- Optional translation display alongside audio
- No scoring or attempt recording

### 3.4 Translation

- On-demand translation of item text via Google Cloud Translate
- Translations are cached in the database (keyed by text + source/target locale)
- Available in both Practice and Walkman modes via a helper card
- Can be refreshed if translation quality is poor

### 3.5 Dashboard

Landing page showing at-a-glance metrics:
- 4 stat cards: total attempts, unique items practiced, average score, best score
- Recent items feed
- Recent activity feed (latest attempts)

### 3.6 Statistics

Three analytics views:
1. **Overview** — Score distribution (pie chart), progress over time (line chart)
2. **Performance** — Per-item stats table, difficulty distribution (bar chart)
3. **Practice Log** — Paginated table of all attempts with date range filters

### 3.7 Audio Caching (Client-Side)

- IndexedDB-based cache in the browser
- 100 MB capacity cap with LRU eviction
- 7-day TTL per cached audio file
- Eliminates redundant API calls for previously heard items
- Cache can be manually cleared via UI button

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Metric | Target |
|--------|--------|
| API response time (p95) | < 500ms for CRUD operations |
| TTS generation time | < 30s per item (async, non-blocking) |
| Frontend initial load | < 3s on broadband |
| Audio playback start | < 1s (cached), < 3s (uncached) |

### 4.2 Reliability

- Backend health endpoint monitors: database connectivity, audio directory access, TTS service availability, task manager status
- Frontend polls health every 30 seconds
- Graceful degradation: app remains usable if TTS service is temporarily down (existing audio still plays)

### 4.3 Security

- No authentication (single-tenant, trusted network)
- CORS configured via environment variable
- No PII stored beyond dictation text and scores
- Google Cloud credentials mounted as read-only volume (never committed to repo)

### 4.4 Scalability

- Single-tenant design — not intended for multi-user deployment
- SQLite database (sufficient for personal use volumes)
- Stateless API (no sessions) — horizontally scalable if needed
- Audio files stored on filesystem (volume-mounted in Docker)

### 4.5 Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- Skip-to-main-content link
- Responsive design: desktop sidebar, tablet/mobile bottom navigation
- Dark mode support (localStorage-persisted)

### 4.6 Offline Capability

- Audio cached in IndexedDB for offline playback of previously heard items
- Frontend is a static SPA — can be served from any CDN or local server
- No offline write capability (attempts require backend)

---

## 5. Out of Scope

- Multi-user support / authentication
- Spaced repetition scheduling
- Speech-to-text (user types, not speaks)
- Mobile native apps (web-only)
- Real-time collaboration
- Content marketplace or sharing

---

## 6. Success Metrics

| Metric | Measurement |
|--------|-------------|
| Practice consistency | Number of attempts per week (tracked via stats API) |
| Score improvement | Average score trend over 30-day rolling window |
| Library growth | Total items created over time |
| Feature adoption | Usage of walkman mode, translation, tag filtering |

---

## 7. Technical Constraints

- **Target platform**: ARM64 (Raspberry Pi / ARM servers) — Docker images built for `linux/arm64` only
- **TTS provider**: Google Cloud TTS (requires API credentials)
- **Translation provider**: Google Cloud Translate (requires API credentials)
- **Database**: SQLite (no external database server required)
- **Package manager**: pnpm 10.30.1
- **Deployment**: Docker containers behind Caddy reverse proxy (external to repo)
