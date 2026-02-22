# Last Whisper — API Reference

**Version:** 1.0
**Date:** 2026-02-22
**Base URL:** `/v1` (items, attempts, stats, tags, translations) | `/` (health, metadata)

---

## 1. Items

Manage dictation content items. TTS audio is generated automatically on creation.

### POST /v1/items

Create a single dictation item. Returns `202 Accepted` — TTS generation is asynchronous.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `locale` | string | Yes | Language code (e.g., `fi-FI`) |
| `text` | string | Yes | Dictation text (1–10,000 chars) |
| `difficulty` | integer | No | 1–5 scale (auto-calculated if omitted) |
| `tags` | string[] | No | Tag labels |

**Response:** `202 Accepted` → `ItemResponse`

```json
{
  "id": 1,
  "locale": "fi-FI",
  "text": "Hyvää huomenta",
  "difficulty": 1,
  "tags": ["greetings"],
  "tts_status": "pending",
  "created_at": "2026-02-22T10:00:00",
  "updated_at": "2026-02-22T10:00:00",
  "practiced": false
}
```

### POST /v1/items/bulk

Bulk-create items from a JSON array. Returns `202 Accepted`.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | ItemCreateRequest[] | Yes | Array of items to create |

**Response:** `202 Accepted` → `BulkItemCreateResponse`

```json
{
  "created_items": [...],
  "total_created": 5,
  "failed_items": [{"text": "...", "error": "..."}],
  "total_failed": 0,
  "submitted_at": "2026-02-22T10:00:00"
}
```

### GET /v1/items

List items with filtering and pagination.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `per_page` | integer | 20 | Items per page |
| `locale` | string | — | Filter by locale |
| `tags` | string | — | Comma-separated tag filter |
| `difficulty` | integer | — | Filter by difficulty level |
| `practiced` | boolean | — | Filter by practiced status |
| `search` | string | — | Text search (LIKE match) |
| `sort_by` | string | `created_at` | Sort field |
| `sort_order` | string | `desc` | `asc` or `desc` |

**Response:** `200 OK` → `ItemListResponse`

```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "per_page": 20,
  "total_pages": 3
}
```

### GET /v1/items/{item_id}

Get a single item by ID.

**Response:** `200 OK` → `ItemResponse`
**Errors:** `404 Not Found`

### GET /v1/items/{item_id}/tts-status

Check TTS generation status for an item.

**Response:** `200 OK` → `ItemTTSStatusResponse`

```json
{
  "item_id": 1,
  "text": "Hyvää huomenta",
  "tts_status": "ready",
  "created_at": "2026-02-22T10:00:00",
  "updated_at": "2026-02-22T10:00:05"
}
```

### DELETE /v1/items/{item_id}

Delete an item and its associated TTS audio, translations, and attempts.

**Response:** `200 OK`
**Errors:** `404 Not Found`

### PATCH /v1/items/{item_id}/tags

Update tags on an item.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tags` | string[] | Yes | New tag list (replaces existing) |

**Response:** `200 OK` → `TagUpdateResponse`

```json
{
  "item_id": 1,
  "previous_tags": ["old-tag"],
  "current_tags": ["new-tag"],
  "updated_at": "2026-02-22T10:00:00",
  "message": "Tags updated successfully"
}
```

### PATCH /v1/items/{item_id}/difficulty

Update difficulty level on an item.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `difficulty` | integer | Yes | New difficulty (1–5) |

**Response:** `200 OK` → `DifficultyUpdateResponse`

### GET /v1/items/{item_id}/audio

Stream the TTS audio file for an item.

**Response:** `200 OK` → Binary audio stream (`audio/wav`)
**Errors:** `404 Not Found` (item or audio not ready)

### POST /v1/items/{item_id}/audio/refresh

Force regeneration of TTS audio for an item. Resets status to `pending`.

**Response:** `202 Accepted`
**Errors:** `404 Not Found`

---

## 2. Attempts

Record and query dictation practice attempts. Scoring is computed server-side.

### POST /v1/attempts

Submit a dictation attempt. The server computes WER score automatically.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `item_id` | integer | Yes | Item being practiced |
| `text` | string | Yes | User's transcription (0–10,000 chars) |

**Response:** `201 Created` → `AttemptResponse`

```json
{
  "id": 1,
  "item_id": 42,
  "text": "Hyvää huomenta",
  "percentage": 100,
  "wer": 0.0,
  "words_ref": 2,
  "words_correct": 2,
  "created_at": "2026-02-22T10:05:00"
}
```

### GET /v1/attempts

List attempts with filtering and pagination.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `per_page` | integer | 20 | Items per page |
| `item_id` | integer | — | Filter by item |
| `date_from` | string | — | ISO date filter (start) |
| `date_to` | string | — | ISO date filter (end) |

**Response:** `200 OK` → `AttemptListResponse`

### GET /v1/attempts/{attempt_id}

Get a single attempt by ID.

**Response:** `200 OK` → `AttemptResponse`
**Errors:** `404 Not Found`

---

## 3. Statistics

Aggregated analytics and progress tracking.

### GET /v1/stats/summary

Get overall practice statistics.

**Response:** `200 OK` → `StatsSummaryResponse`

```json
{
  "total_attempts": 150,
  "unique_items_practiced": 42,
  "average_score": 78.5,
  "best_score": 100,
  "worst_score": 23,
  "total_practice_time_minutes": 45.2
}
```

### GET /v1/stats/practice-log

Get paginated practice log with daily aggregations.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `per_page` | integer | 20 | Entries per page |
| `date_from` | string | — | ISO date filter (start) |
| `date_to` | string | — | ISO date filter (end) |

**Response:** `200 OK` → `PracticeLogResponse`

### GET /v1/stats/items/{item_id}

Get statistics for a specific item.

**Response:** `200 OK` → `ItemStatsResponse`

```json
{
  "item_id": 42,
  "total_attempts": 5,
  "average_score": 82.0,
  "best_score": 100,
  "worst_score": 60,
  "first_attempt_at": "2026-02-01T10:00:00",
  "last_attempt_at": "2026-02-22T10:00:00"
}
```

**Errors:** `404 Not Found`

### GET /v1/stats/progress

Get daily progress over time.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `date_from` | string | — | ISO date filter (start) |
| `date_to` | string | — | ISO date filter (end) |

**Response:** `200 OK` → `ProgressResponse`

---

## 4. Tags

Manage preset tags for organizing items.

### POST /v1/tags

Create a new tag.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Tag name (unique) |

**Response:** `201 Created` → `TagResponse`

```json
{
  "id": 1,
  "name": "verbs",
  "created_at": "2026-02-22T10:00:00"
}
```

**Errors:** `409 Conflict` (duplicate name)

### GET /v1/tags

List all tags.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | Search by name |
| `sort_by` | string | `name` | Sort field (`name`, `created_at`) |
| `sort_order` | string | `asc` | `asc` or `desc` |

**Response:** `200 OK` → `TagListResponse`

### DELETE /v1/tags/{tag_id}

Delete a tag. Does not remove the tag from items that already have it.

**Response:** `200 OK`
**Errors:** `404 Not Found`

---

## 5. Translations

Translate item text to a target language. Results are cached in the database.

### POST /v1/items/{item_id}/translations

Translate an item's text. Returns cached result if available.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `target_language` | string | Yes | Target language code (e.g., `en`) |

**Response:** `200 OK` → `TranslationResponse`

```json
{
  "id": 1,
  "item_id": 42,
  "source_text": "Hyvää huomenta",
  "translated_text": "Good morning",
  "source_language": "fi",
  "target_language": "en",
  "provider": "google",
  "created_at": "2026-02-22T10:00:00"
}
```

### GET /v1/items/{item_id}/translations

Get cached translation for an item.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `target_language` | string | Yes | Target language code |

**Response:** `200 OK` → `TranslationResponse`
**Errors:** `404 Not Found` (no cached translation)

### POST /v1/translations/{translation_id}/refresh

Force re-translation from the provider, replacing the cached result.

**Response:** `200 OK` → `TranslationRefreshResponse`
**Errors:** `404 Not Found`

---

## 6. Metadata

Application metadata including build info, runtime state, provider capabilities, and feature flags.

### GET /metadata

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `fields` | string | — | Comma-separated field filter |
| `detail` | string | `core` | Detail level: `core`, `runtime`, `full` |

**Response:** `200 OK` → `MetadataResponse`

Includes: `schema_version`, `build` (commit, timestamp), `runtime` (uptime, environment), `providers` (TTS voices, translation languages), `features`, `limits` (max text length, bulk size), `links`.

---

## 7. Health

### GET /health

System health check.

**Response:** `200 OK` → `HealthResponse`

```json
{
  "status": "healthy",
  "checks": {
    "database": {"status": "ok"},
    "audio_directory": {"status": "ok"},
    "tts_service": {"status": "ok", "queue_size": 0},
    "task_manager": {"status": "ok"}
  }
}
```

---

## Error Response Format

All errors follow a consistent structure:

```json
{
  "detail": "Human-readable error message"
}
```

Validation errors (422) include field-level detail:

```json
{
  "detail": [
    {
      "loc": ["body", "text"],
      "msg": "String should have at most 10000 characters",
      "type": "string_too_long",
      "ctx": {"max_length": 10000, "actual_length": 10001},
      "input": "..."
    }
  ]
}
```

**Standard HTTP Status Codes:**

| Code | Usage |
|------|-------|
| 200 | Successful read/update |
| 201 | Resource created |
| 202 | Accepted (async processing) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Validation error |
| 500 | Internal server error |
