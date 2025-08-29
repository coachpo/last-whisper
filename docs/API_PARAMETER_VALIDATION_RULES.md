# API Parameter Validation Documentation

This document provides a comprehensive overview of all API parameter validation rules for the Last Whisper Backend API.

## Framework Used
- **Pydantic**: All API parameter validation is handled using Pydantic models with `BaseModel`, `Field`, and `field_validator`
- **FastAPI**: Query parameters use FastAPI's `Query` with validation constraints
- **Custom Validation**: Additional validation logic implemented using `@field_validator` decorators

---

## TTS API Endpoints (`/api/v1/tts`)

### 1. POST `/api/v1/tts/convert`
**Purpose**: Submit text for TTS conversion

**Request Body** (`TTSConvertRequest`):
- `text` (str, required): Text to convert to speech
  - **Validation**: `min_length=1, max_length=10000`
- `custom_filename` (str, optional): Custom filename without extension
  - **Validation**: `max_length=255`
- `language` (str, optional): Language code for TTS
  - **Validation**: `min_length=2, max_length=10`
  - **Default**: `"fi"`

**Response**: `TTSConvertResponse` (201 Created)

### 2. POST `/api/v1/tts/convert-multiple`
**Purpose**: Submit multiple texts for TTS conversion

**Request Body** (`TTSMultiConvertRequest`):
- `texts` (list[str], required): List of texts to convert
  - **Validation**: `min_length=1, max_length=100`
  - **Custom validation**: Individual text items cannot be empty or whitespace-only
- `language` (str, optional): Language code for TTS
  - **Validation**: `min_length=2, max_length=10`
  - **Default**: `"fi"`

**Response**: `TTSMultiConvertResponse` (201 Created)

### 3. GET `/api/v1/tts/{conversion_id}`
**Purpose**: Get TTS conversion status

**Path Parameters**:
- `conversion_id` (str, required): Conversion task ID

**Response**: `TTSTaskResponse` (200 OK)

### 4. GET `/api/v1/tts`
**Purpose**: List TTS conversions

**Query Parameters**:
- `status` (str, optional): Filter by status
  - **Validation**: Must be one of: `queued`, `processing`, `completed`, `failed`, `done`
- `limit` (int, optional): Number of results to return
  - **Validation**: `1 <= limit <= 1000`
  - **Default**: `50`

**Response**: `list[TTSTaskResponse]` (200 OK)

### 5. GET `/api/v1/tts/{conversion_id}/download`
**Purpose**: Download TTS audio file

**Path Parameters**:
- `conversion_id` (str, required): Conversion task ID

**Response**: Audio file download (200 OK) or error (400/404)

### 6. GET `/api/v1/tts/supported-languages`
**Purpose**: Get supported languages

**No parameters**

**Response**: `list[str]` (200 OK)

---

## Items API Endpoints (`/v1/items`)

### 1. POST `/v1/items`
**Purpose**: Create dictation item

**Request Body** (`ItemCreateRequest`):
- `locale` (str, required): Language locale
  - **Validation**: `min_length=2, max_length=10`
- `text` (str, required): Text for dictation practice
  - **Validation**: `min_length=1, max_length=10000`
- `difficulty` (int, optional): Difficulty level
  - **Validation**: `ge=1, le=10`
  - **Note**: If not provided, will be auto-calculated based on text length
- `tags` (List[str], optional): Tags for categorization
  - **Custom validation**: 
    - Maximum 20 tags allowed
    - Individual tags cannot be empty or whitespace-only
    - Tag length cannot exceed 50 characters

**Response**: `ItemResponse` (202 Accepted)

### 2. POST `/v1/items/bulk`
**Purpose**: Create multiple dictation items

**Request Body** (`BulkItemCreateRequest`):
- `items` (List[ItemCreateRequest], required): List of items to create
  - **Validation**: `min_length=1, max_length=100`
  - **Custom validation**: Items list cannot be empty, maximum 100 items per request

**Response**: `BulkItemCreateResponse` (202 Accepted)

### 3. GET `/v1/items`
**Purpose**: List dictation items

**Query Parameters**:
- `locale` (str, optional): Filter by locale
- `tag` (List[str], optional): Filter by tags (repeat for multiple)
- `difficulty` (str, optional): Filter by difficulty (single value or 'min..max')
- `practiced` (bool, optional): Filter by practice status
- `sort` (str, optional): Sort order
  - **Validation**: Must be one of: `created_at.asc`, `created_at.desc`, `difficulty.asc`, `difficulty.desc`
  - **Default**: `"created_at.desc"`
- `page` (int, optional): Page number
  - **Validation**: `ge=1`
  - **Default**: `1`
- `per_page` (int, optional): Items per page
  - **Validation**: `ge=1, le=100`
  - **Default**: `20`

**Response**: `ItemListResponse` (200 OK)

### 4. GET `/v1/items/{item_id}`
**Purpose**: Get dictation item

**Path Parameters**:
- `item_id` (int, required): Item ID

**Response**: `ItemResponse` (200 OK)

### 5. DELETE `/v1/items/{item_id}`
**Purpose**: Delete dictation item

**Path Parameters**:
- `item_id` (int, required): Item ID

**Response**: No content (204 No Content)

### 6. PATCH `/v1/items/{item_id}/tags`
**Purpose**: Update item tags

**Path Parameters**:
- `item_id` (int, required): Item ID

**Request Body** (`TagUpdateRequest`):
- `tags` (List[str], optional): New tags to replace all existing tags
  - **Default**: `[]`

**Response**: `TagUpdateResponse` (200 OK)

### 7. PATCH `/v1/items/{item_id}/difficulty`
**Purpose**: Update item difficulty

**Path Parameters**:
- `item_id` (int, required): Item ID

**Request Body** (`DifficultyUpdateRequest`):
- `difficulty` (int, required): Difficulty level
  - **Validation**: `ge=1, le=5`

**Response**: `DifficultyUpdateResponse` (200 OK)

### 8. GET `/v1/items/{item_id}/audio`
**Purpose**: Get item audio

**Path Parameters**:
- `item_id` (int, required): Item ID

**Response**: Audio file stream (200 OK) or error (400/404)

---

## Attempts API Endpoints (`/v1/attempts`)

### 1. POST `/v1/attempts`
**Purpose**: Create dictation attempt

**Request Body** (`AttemptCreateRequest`):
- `item_id` (int, required): Item ID
- `text` (str, required): User's dictation attempt
  - **Validation**: `min_length=0, max_length=10000`

**Response**: `AttemptResponse` (201 Created)

### 2. GET `/v1/attempts`
**Purpose**: List dictation attempts

**Query Parameters**:
- `item_id` (int, optional): Filter by item ID
- `since` (datetime, optional): Filter attempts since this timestamp
- `until` (datetime, optional): Filter attempts until this timestamp
- `page` (int, optional): Page number
  - **Validation**: `ge=1`
  - **Default**: `1`
- `per_page` (int, optional): Items per page
  - **Validation**: `ge=1, le=100`
  - **Default**: `20`

**Response**: `AttemptListResponse` (200 OK)

### 3. GET `/v1/attempts/{attempt_id}`
**Purpose**: Get dictation attempt

**Path Parameters**:
- `attempt_id` (int, required): Attempt ID

**Response**: `AttemptResponse` (200 OK)

---

## Stats API Endpoints (`/v1/stats`)

### 1. GET `/v1/stats/summary`
**Purpose**: Get summary statistics

**Query Parameters**:
- `since` (datetime, optional): Start of time window
- `until` (datetime, optional): End of time window
- **Custom validation**: If both `since` and `until` are provided, `since` must be before `until`

**Response**: `StatsSummaryResponse` (200 OK)

### 2. GET `/v1/stats/practice-log`
**Purpose**: Get practice log

**Query Parameters**:
- `since` (datetime, optional): Start of time window
- `until` (datetime, optional): End of time window
- **Custom validation**: If both `since` and `until` are provided, `since` must be before `until`
- `page` (int, optional): Page number
  - **Validation**: `ge=1`
  - **Default**: `1`
- `per_page` (int, optional): Items per page
  - **Validation**: `ge=1, le=100`
  - **Default**: `20`

**Response**: `PracticeLogResponse` (200 OK)

### 3. GET `/v1/stats/items/{item_id}`
**Purpose**: Get item statistics

**Path Parameters**:
- `item_id` (int, required): Item ID

**Response**: Item statistics object (200 OK)

### 4. GET `/v1/stats/progress`
**Purpose**: Get progress over time

**Query Parameters**:
- `item_id` (int, optional): Item ID (leave empty for all items)
- `days` (int, optional): Number of days to look back
  - **Validation**: `ge=1, le=365`
  - **Default**: `30`

**Response**: Progress data object (200 OK)

---

## Tags API Endpoints (`/v1/tags`)

### 1. POST `/v1/tags`
**Purpose**: Create a new preset tag

**Request Body** (`TagCreateRequest`):
- `name` (str, required): Tag name
  - **Validation**: `min_length=1, max_length=50`
  - **Custom validation**: Tag name cannot be empty or whitespace-only

**Response**: `TagResponse` (201 Created)

### 2. GET `/v1/tags`
**Purpose**: Get list of preset tags

**Query Parameters**:
- `limit` (int, optional): Maximum number of tags to return
  - **Validation**: `ge=1, le=1000`
  - **Default**: `100`
- `offset` (int, optional): Number of tags to skip
  - **Validation**: `ge=0`
  - **Default**: `0`

**Response**: `TagListResponse` (200 OK)

### 3. DELETE `/v1/tags/{tag_id}`
**Purpose**: Delete a preset tag

**Path Parameters**:
- `tag_id` (int, required): Tag ID

**Response**: No content (204 No Content)

---

## Health Check Endpoints

### 1. GET `/health`
**Purpose**: Health check with details

**No parameters**

**Response**: `HealthCheckResponse` (200 OK)

---

## Common Validation Patterns

### Field Validation Types
1. **String Length**: `min_length`, `max_length`
2. **Numeric Range**: `ge` (greater or equal), `le` (less or equal)
3. **Required Fields**: `...` (ellipsis) in Field definition
4. **Optional Fields**: `None` as default value
5. **Custom Validation**: `@field_validator` decorator

### Custom Validation Examples
- **Tags validation**: Maximum 20 tags, no empty tags, max 50 chars per tag
- **Text validation**: Individual text items cannot be empty or whitespace-only
- **Time window validation**: `since` must be before `until`
- **Sort parameter validation**: Must be one of predefined values
- **Bulk operations**: Maximum 100 items per request

### Error Responses
- **422**: Validation error (Pydantic validation failures)
- **400**: Bad request (custom validation failures)
- **404**: Not found (resource doesn't exist)
- **500**: Internal server error
- **503**: Service unavailable (TTS service issues)

### Default Values
- Language codes default to `"fi"`
- Pagination defaults: `page=1`, `per_page=20`
- Time windows default to `30` days for progress endpoints
- Tag limits default to `100` for listing
- TTS list limit defaults to `50`

### Response Status Codes
- **200**: Success (GET, PATCH operations)
- **201**: Created (POST operations for tags)
- **202**: Accepted (POST operations for items - async processing)
- **204**: No Content (DELETE operations)
- **400**: Bad Request (validation errors, business logic errors)
- **404**: Not Found (resource not found)
- **422**: Unprocessable Entity (Pydantic validation errors)
- **500**: Internal Server Error
- **503**: Service Unavailable (TTS service issues)

---

## Notes
- All validation is handled by Pydantic models
- Custom validation logic is implemented using `@field_validator` decorators
- Query parameters use FastAPI's `Query` with validation constraints
- Path parameters are automatically validated by FastAPI
- All endpoints return structured error responses with appropriate HTTP status codes
- Items creation is asynchronous - TTS processing happens in background
- Audio files are served with appropriate caching headers
- Bulk operations have limits to prevent system overload
