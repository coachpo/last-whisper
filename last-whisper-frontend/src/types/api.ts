// API Types for Last Whisper Dictation Backend

export type ItemTTSStatus = 'pending' | 'ready' | 'failed' | 'processing'

export interface Item {
  id: number;
  locale: string;
  text: string;
  difficulty: number | null;
  tags: string[];
  tts_status: ItemTTSStatus;
  created_at: string;
  updated_at: string;
  practiced: boolean;
}

export interface CreateItemRequest {
  locale: string; // min_length=2, max_length=10
  text: string; // min_length=1, max_length=10000
  difficulty?: number; // ge=1, le=10 (optional)
  tags?: string[]; // max 20 tags, individual tags max 50 chars
}

export interface UpdateItemTagsRequest {
  tags: string[]; // max 20 tags, individual tags max 50 chars
}

export interface UpdateItemDifficultyRequest {
  difficulty: number; // ge=1, le=5
}

export interface BulkCreateItemsRequest {
  items: CreateItemRequest[]; // min_length=1, max_length=100
}

export interface BulkItemCreateResponse {
  created_items: Item[];
  total_created: number;
  failed_items?: Record<string, unknown>[];
  total_failed: number;
  submitted_at: string;
}

export interface ItemsListParams {
  locale?: string;
  tag?: string[];
  difficulty?: string;
  practiced?: boolean;
  sort?: string; // created_at.asc, created_at.desc, difficulty.asc, difficulty.desc
  page?: number; // ge=1, default=1
  per_page?: number; // ge=1, le=100, default=20
}

export interface ItemsListResponse {
  items: Item[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ItemTTSStatusResponse {
  item_id: number;
  text: string;
  tts_status: Item['tts_status'];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Attempt {
  id: number;
  item_id: number;
  text: string;
  percentage: number;
  wer: number;
  words_ref: number;
  words_correct: number;
  created_at: string;
  item?: Item;
}

export interface CreateAttemptRequest {
  item_id: number;
  text: string; // min_length=0, max_length=10000
}

export interface AttemptsListParams {
  item_id?: number;
  since?: string; // ISO datetime string
  until?: string; // ISO datetime string
  page?: number; // ge=1, default=1
  per_page?: number; // ge=1, le=100, default=20
  // Legacy support
  limit?: number;
  offset?: number;
}

export interface AttemptsListResponse {
  attempts: Attempt[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  // Legacy support
  limit?: number;
  offset?: number;
}

export interface StatsSummary {
  total_attempts: number;
  unique_items_practiced: number;
  average_score: number;
  best_score: number;
  worst_score: number;
  total_practice_time_minutes: number;
}

export interface PracticeLogEntry {
  item_id: number;
  text: string;
  locale: string;
  difficulty: number;
  tags: string[];
  attempt_count: number;
  first_attempt_at?: string | null;
  best_score: number;
  worst_score: number;
  average_score: number;
  avg_wer: number;
  last_practiced_at?: string | null;
}

export interface PracticeLogResponse {
  practice_log: PracticeLogEntry[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PracticeLogParams {
  page?: number;
  per_page?: number;
  since?: string;
  until?: string;
}

export interface ItemStatsResponse {
  item_id: number;
  text?: string;
  locale?: string;
  difficulty?: number;
  tags?: string[];
  attempts_count: number;
  avg_percentage: number;
  best_percentage: number;
  worst_percentage: number;
  avg_wer?: number;
  best_wer?: number;
  worst_wer?: number;
  first_attempt_at?: string;
  last_attempt_at?: string;
}

export interface StatsProgressParams {
  item_id?: number;
  days?: number;
}

export interface StatsProgressResponse {
  progress: {
    date: string;
    attempts: number;
    avg_percentage: number;
    avg_wer: number;
  }[];
}

export type HealthStatusValue = 'healthy' | 'unhealthy' | 'error' | 'informational';

export interface HealthCheckEntry {
  status: HealthStatusValue;
  detail?: string;
  [key: string]: unknown;
}

export interface HealthServiceInfoEntry extends HealthCheckEntry {
  name?: string;
  version?: string;
  timestamp?: string;
}

export interface HealthChecksMap {
  [key: string]: HealthCheckEntry | undefined;
  service_info?: HealthServiceInfoEntry;
}

export interface HealthCheck {
  status: HealthStatusValue;
  checks: HealthChecksMap;
}

export interface ValidationError {
  type: string;
  loc: string[];
  msg: string;
  input?: unknown;
  ctx?: {
    field_type?: string;
    max_length?: number;
    actual_length?: number;
    min_length?: number;
    min_value?: number;
    max_value?: number;
    pattern?: string;
    allowed_values?: unknown[];
    missing_fields?: string[];
    extra_fields?: string[];
  };
}

export interface ApiError {
  detail: string | ValidationError[];
  error_code?: string;
}

export interface AudioRefreshResponse {
  item_id: number;
  task_id: string;
  status: 'queued' | 'pending' | 'processing' | 'completed' | 'failed';
  tts_status: ItemTTSStatus;
  audio_path?: string | null;
  provider?: string | null;
  voice?: string | null;
  cached?: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown> | null;
}

// Translation API Types
export type TranslationStatus = 'pending' | 'completed' | 'failed';

export interface Translation {
  translation_id: number;
  item_id: number;
  text: string;
  source_lang: string;
  target_lang: string;
  translated_text: string;
  provider: string;
  cached: boolean;
  status: TranslationStatus;
  created_at: string;
  updated_at: string;
  last_refreshed_at?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CreateTranslationRequest {
  target_lang: string;
  force_refresh?: boolean;
}

// TTS API Types (for backward compatibility)
export interface TTSConversionRequest {
  text: string;
  custom_filename?: string;
}

export interface TTSConversionResponse {
  conversion_id: string;
  text: string;
  status: string;
  submitted_at: string;
}

export interface TTSStatus {
  id: number;
  task_id: string;
  original_text: string;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
  output_file_path?: string;
  custom_filename?: string;
  created_at: string;
  submitted_at?: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  error_message?: string;
  file_size?: number;
  sampling_rate?: number;
  device?: string;
  metadata?: string;
}

// Tag API Types
export interface Tag {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTagRequest {
  name: string; // min_length=1, max_length=50
}

export interface TagListResponse {
  tags: Tag[];
  total: number;
}

export interface TagUpdateResponse {
  item_id: number;
  operation: string;
  previous_tags: string[];
  current_tags: string[];
  updated_at: string;
  message: string;
}

export interface DifficultyUpdateResponse {
  item_id: number;
  previous_difficulty: number | null;
  current_difficulty: number;
  updated_at: string;
  message: string;
}

// Metadata API Types
export type MetadataDetailLevel = 'core' | 'runtime' | 'full'

export type MetadataField =
  | 'service'
  | 'build'
  | 'runtime'
  | 'providers'
  | 'features'
  | 'limits'
  | 'links'

export interface MetadataQueryParams {
  detail?: MetadataDetailLevel
  fields?: MetadataField[]
}

export interface MetadataServiceInfo {
  name: string
  description?: string
  environment?: string
  version?: string
  schema_version?: string
}

export interface MetadataBuildInfo {
  commit?: string
  short_commit?: string
  branch?: string
  built_at?: string
  python_version?: string
  fastapi_version?: string
  [key: string]: unknown
}

export interface MetadataWorkerState {
  worker_running?: boolean
  queue_size?: number
  pending_items?: number
  tts_service_available?: boolean
  [key: string]: unknown
}

export interface MetadataRuntimeInfo {
  started_at?: string
  uptime_seconds?: number
  process_id?: number
  host?: string
  worker?: MetadataWorkerState
  [key: string]: unknown
}

export interface LanguageOption {
  language_code: string
  language_name?: string
}

export interface MetadataProviders {
  database?: {
    engine?: string
    file?: string
    [key: string]: unknown
  }
  tts?: {
    provider?: string
    supported_languages?: LanguageOption[]
    [key: string]: unknown
  }
  translation?: {
    provider?: string
    supported_languages?: LanguageOption[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface MetadataFeatures {
  tts_submission_workers?: number
  tts_languages?: string[]
  translation_languages?: LanguageOption[]
  [key: string]: unknown
}

export interface MetadataLimits {
  max_items_per_bulk_request?: number
  max_tags_per_item?: number
  max_tag_length?: number
  max_text_length?: number
  [key: string]: unknown
}

export interface MetadataLinks {
  status?: string
  metadata?: string
  docs?: string
  redoc?: string
  openapi?: string
  [key: string]: string | undefined
}

export interface MetadataResponse {
  service: MetadataServiceInfo
  build?: MetadataBuildInfo
  runtime?: MetadataRuntimeInfo
  providers?: MetadataProviders
  features?: MetadataFeatures
  limits?: MetadataLimits
  links?: MetadataLinks
  [key: string]: unknown
}
