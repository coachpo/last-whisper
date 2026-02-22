# Last Whisper — Data Model Spec

**Version:** 1.0
**Date:** 2026-02-22
**Database:** SQLite (`data/dictation.db`)
**ORM:** SQLAlchemy 2.x

---

## 1. Entity-Relationship Overview

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│   Item   │──1:1──│ ItemTTS  │       │   Tag    │
│          │       └──────────┘       └──────────┘
│          │──1:N──┌──────────┐
│          │       │ Attempt  │
│          │       └──────────┘
│          │──N:1──┌──────────┐
│          │       │  Task    │
└──────────┘       └──────────┘
      │
      │──1:N──┌──────────────┐
              │ Translation  │
              └──────────────┘
```

---

## 2. Tables

### 2.1 items

Core content table — each row is a dictation text the user practices with.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | autoincrement | Primary key |
| `locale` | VARCHAR(10) | No | — | Language code (e.g., `fi-FI`) |
| `text` | TEXT | No | — | Dictation content |
| `difficulty` | INTEGER | Yes | NULL | Difficulty level 1–5 |
| `tags_json` | TEXT | Yes | NULL | JSON array of tag strings |
| `tts_status` | VARCHAR | Yes | NULL | `pending`, `ready`, `failed` |
| `task_id` | INTEGER | Yes | FK → tasks.id | Associated TTS generation task |
| `created_at` | DATETIME | No | `now()` | Creation timestamp |
| `updated_at` | DATETIME | No | `now()` | Last modification timestamp |

**Indexes:** `locale`, `difficulty`, `tts_status`, `task_id`
**Relationships:**
- `task` → Task (many-to-one via `task_id`)
- `item_tts` → ItemTTS (one-to-one via `ItemTTS.item_id`)
- `translations` → Translation[] (one-to-many via `Translation.item_id`)
- `attempts` → Attempt[] (one-to-many via `Attempt.item_id`)

**Computed Properties:**
- `tags` — Parses `tags_json` into a Python list
- `practiced` — `True` if any attempts exist for this item

### 2.2 tasks

TTS generation task queue. Each task represents a request to generate audio.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | autoincrement | Primary key |
| `task_id` | VARCHAR | No | — | Unique task identifier (UUID) |
| `original_text` | TEXT | No | — | Text to synthesize |
| `text_hash` | VARCHAR | No | — | Hash of text for deduplication |
| `status` | VARCHAR | No | `pending` | Task status |
| `output_file_path` | TEXT | Yes | NULL | Path to generated audio file |
| `custom_filename` | TEXT | Yes | NULL | Custom output filename |
| `task_kind` | VARCHAR | No | `generate` | Task type |
| `created_at` | DATETIME | No | `now()` | Creation timestamp |
| `submitted_at` | DATETIME | Yes | NULL | When submitted to TTS engine |
| `started_at` | DATETIME | Yes | NULL | When processing began |
| `completed_at` | DATETIME | Yes | NULL | When processing finished |
| `failed_at` | DATETIME | Yes | NULL | When task failed |
| `error_message` | TEXT | Yes | NULL | Error details on failure |
| `file_size` | INTEGER | Yes | NULL | Output file size in bytes |
| `sampling_rate` | INTEGER | Yes | NULL | Audio sampling rate (Hz) |
| `device` | VARCHAR | Yes | NULL | Processing device info |
| `metadata` | TEXT | Yes | NULL | JSON metadata (duration, voice, etc.) |

**Indexes:** `task_id` (unique), `text_hash`, `status`, `task_kind`
**Relationships:** `items` → Item[] (one-to-many)

**Computed Properties:**
- `metadata_dict` — Parses `metadata` JSON to dict
- `duration` — Extracts audio duration from metadata

### 2.3 item_tts

Links items to their TTS audio status. One-to-one with items.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | autoincrement | Primary key |
| `item_id` | INTEGER | No | FK → items.id | Associated item |
| `status` | VARCHAR | No | `pending` | TTS status |
| `created_at` | DATETIME | No | `now()` | Creation timestamp |
| `updated_at` | DATETIME | No | `now()` | Last update timestamp |

**Indexes:** `item_id` (unique)
**Constraints:** UNIQUE on `item_id`

### 2.4 translations

Cached translations of item text to other languages.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | autoincrement | Primary key |
| `item_id` | INTEGER | No | FK → items.id | Source item |
| `source_locale` | VARCHAR(10) | No | — | Source language code |
| `target_locale` | VARCHAR(10) | No | — | Target language code |
| `source_text` | TEXT | No | — | Original text |
| `translated_text` | TEXT | No | — | Translated text |
| `provider` | VARCHAR | No | — | Translation provider used |
| `created_at` | DATETIME | No | `now()` | Creation timestamp |
| `updated_at` | DATETIME | No | `now()` | Last update timestamp |

**Indexes:** `item_id`
**Constraints:** UNIQUE on (`item_id`, `target_locale`)

### 2.5 attempts

User dictation attempts with WER scoring results.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | autoincrement | Primary key |
| `item_id` | INTEGER | No | FK → items.id | Practiced item |
| `text` | TEXT | No | — | User's transcription |
| `percentage` | INTEGER | No | — | Score 0–100 |
| `wer` | FLOAT | No | — | Word Error Rate 0.0–1.0 |
| `words_ref` | INTEGER | No | — | Word count in reference |
| `words_correct` | INTEGER | No | — | Correct word count |
| `created_at` | DATETIME | No | `now()` | Attempt timestamp |

**Indexes:** `item_id`, `created_at`

### 2.6 tags

Preset tag definitions for organizing items.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | No | autoincrement | Primary key |
| `name` | VARCHAR | No | — | Tag name |
| `created_at` | DATETIME | No | `now()` | Creation timestamp |

**Constraints:** UNIQUE on `name`

---

## 3. Enumerations

### 3.1 TaskStatus

| Value | Description |
|-------|-------------|
| `pending` | Task created, awaiting processing |
| `submitted` | Submitted to TTS engine queue |
| `processing` | Currently being processed |
| `completed` | Successfully generated audio |
| `failed` | Generation failed |

### 3.2 ItemTTSStatus

| Value | Description |
|-------|-------------|
| `pending` | Audio generation in progress |
| `ready` | Audio available for playback |
| `failed` | Audio generation failed |

### 3.3 TaskKind

| Value | Description |
|-------|-------------|
| `generate` | Initial TTS generation |
| `refresh` | Re-generation of existing audio |

### 3.4 MetadataDetailLevel

| Value | Description |
|-------|-------------|
| `core` | Build info, schema version only |
| `runtime` | Core + runtime state, provider status |
| `full` | Everything including features, limits, links |

---

## 4. Tag Storage Model

Tags use a hybrid approach:
- **Preset tags** are stored in the `tags` table (for autocomplete and management UI)
- **Item tags** are stored as a JSON array in `items.tags_json` (denormalized for query simplicity)
- There is no foreign key relationship between item tags and preset tags — items can have arbitrary tag strings

This means:
- Deleting a preset tag does NOT remove it from items
- Items can have tags that don't exist in the preset list
- Tag filtering on items uses JSON string matching

---

## 5. Migrations

Migrations are managed as raw SQL files in `last-whisper-backend/docs/migrations/`. There is no migration framework — migrations are applied manually.

| File | Date | Description |
|------|------|-------------|
| `2025-11-21_item_tts_translations.sql` | 2025-11-21 | Added item_tts and translations tables |
| `2025-11-23_add_task_kind.sql` | 2025-11-23 | Added task_kind column to tasks table |
| `2025-11-23_drop_item_tts_unused_columns.sql` | 2025-11-23 | Cleaned up unused columns from item_tts |

---

## 6. Data Lifecycle

### Item Creation Flow
1. Item inserted into `items` table
2. `ItemTTS` record created with status `pending`
3. TTS `Task` created and submitted to engine queue
4. On completion: `ItemTTS.status` → `ready`, `Task.status` → `completed`
5. On failure: `ItemTTS.status` → `failed`, `Task.status` → `failed`

### Item Deletion Cascade
Deleting an item removes:
- Associated `ItemTTS` record
- Associated `Translation` records
- Associated `Attempt` records
- Associated audio file from disk

### Audio Refresh Flow
1. Existing `ItemTTS.status` reset to `pending`
2. New TTS `Task` created with `task_kind = refresh`
3. Old audio file replaced on successful generation

---

## 7. Frontend Data Cache (IndexedDB)

The frontend maintains a separate audio cache in the browser:

| Property | Value |
|----------|-------|
| Store | IndexedDB (`last-whisper-audio-cache`) |
| Max Size | 100 MB |
| TTL | 7 days |
| Eviction | LRU (least recently used) when size limit exceeded |
| Key | Item ID |
| Value | Audio blob + metadata (size, timestamp) |

This cache is independent of the backend database and exists purely to reduce network requests for audio playback.
