import {
  AttemptsListResponse,
  HealthCheck,
  ItemStatsResponse,
  ItemsListResponse,
  PracticeLogResponse,
  StatsProgressResponse,
  StatsSummary,
  TagListResponse,
  AudioRefreshResponse,
  Translation,
} from '@/types/api'

const now = new Date('2024-09-01T09:00:00Z').toISOString()

export const mockStatsSummary: StatsSummary = {
  total_attempts: 128,
  unique_items_practiced: 42,
  average_score: 86,
  best_score: 98,
  worst_score: 42,
  total_practice_time_minutes: 560,
}

export const mockItemsResponse: ItemsListResponse = {
  items: [
    {
      id: 101,
      locale: 'en-US',
      text: 'Practice mindful listening with short dictations about travel.',
      difficulty: 3,
      tags: ['travel', 'mindful'],
      tts_status: 'ready',
      created_at: now,
      updated_at: now,
      practiced: true,
    },
    {
      id: 202,
      locale: 'en-GB',
      text: 'Advanced weather briefing exploring seasonal climate nuances.',
      difficulty: 4,
      tags: ['weather', 'advanced'],
      tts_status: 'pending',
      created_at: now,
      updated_at: now,
      practiced: false,
    },
  ],
  total: 2,
  page: 1,
  per_page: 20,
  total_pages: 1,
}

export const mockAttemptsResponse: AttemptsListResponse = {
  attempts: [
    {
      id: 301,
      item_id: 101,
      text: 'Practice mindful listening with short dictations about travel.',
      percentage: 92,
      wer: 0.08,
      words_ref: 24,
      words_correct: 22,
      created_at: now,
    },
    {
      id: 302,
      item_id: 101,
      text: 'Advanced weather briefing exploring seasonal climate nuances.',
      percentage: 78,
      wer: 0.22,
      words_ref: 30,
      words_correct: 23,
      created_at: now,
    },
    {
      id: 303,
      item_id: 202,
      text: 'Short mindfulness script for breathing exercises.',
      percentage: 65,
      wer: 0.35,
      words_ref: 18,
      words_correct: 12,
      created_at: now,
    },
  ],
  total: 3,
  page: 1,
  per_page: 100,
  total_pages: 1,
}

export const mockPracticeLogResponse: PracticeLogResponse = {
  practice_log: [
    {
      item_id: 101,
      text: 'Practice mindful listening with short dictations about travel.',
      locale: 'en-US',
      difficulty: 3,
      tags: ['travel', 'focus'],
      attempt_count: 9,
      best_score: 96,
      worst_score: 72,
      average_score: 88,
      avg_wer: 0.12,
      first_attempt_at: '2024-07-01T09:00:00Z',
      last_practiced_at: now,
    },
    {
      item_id: 202,
      text: 'Advanced weather briefing exploring seasonal climate nuances.',
      locale: 'en-GB',
      difficulty: 4,
      tags: ['weather'],
      attempt_count: 5,
      best_score: 84,
      worst_score: 58,
      average_score: 73,
      avg_wer: 0.28,
      first_attempt_at: '2024-07-10T09:00:00Z',
      last_practiced_at: now,
    },
  ],
  total: 2,
  page: 1,
  per_page: 10,
  total_pages: 1,
}

export const mockStatsProgressResponse: StatsProgressResponse = {
  progress: [
    {date: '2024-08-25T00:00:00Z', avg_percentage: 68, avg_wer: 0.21, attempts: 3},
    {date: '2024-08-26T00:00:00Z', avg_percentage: 72, avg_wer: 0.19, attempts: 4},
    {date: '2024-08-27T00:00:00Z', avg_percentage: 80, avg_wer: 0.16, attempts: 5},
    {date: '2024-08-28T00:00:00Z', avg_percentage: 85, avg_wer: 0.14, attempts: 6},
    {date: '2024-08-29T00:00:00Z', avg_percentage: 90, avg_wer: 0.12, attempts: 5},
  ],
}

export const mockItemStatsMap: Record<number, ItemStatsResponse> = {
  101: {
    item_id: 101,
    text: mockItemsResponse.items[0].text,
    locale: mockItemsResponse.items[0].locale,
    difficulty: mockItemsResponse.items[0].difficulty ?? undefined,
    tags: mockItemsResponse.items[0].tags,
    attempts_count: 12,
    avg_percentage: 88,
    best_percentage: 96,
    worst_percentage: 72,
    avg_wer: 0.14,
    last_attempt_at: now,
  },
  202: {
    item_id: 202,
    text: mockItemsResponse.items[1].text,
    locale: mockItemsResponse.items[1].locale,
    difficulty: mockItemsResponse.items[1].difficulty ?? undefined,
    tags: mockItemsResponse.items[1].tags,
    attempts_count: 8,
    avg_percentage: 74,
    best_percentage: 84,
    worst_percentage: 58,
    avg_wer: 0.22,
    last_attempt_at: now,
  },
}

export const mockTagsResponse: TagListResponse = {
  tags: [
    {
      id: 1,
      name: 'travel',
      created_at: now,
      updated_at: now,
    },
    {
      id: 2,
      name: 'focus',
      created_at: now,
      updated_at: now,
    },
  ],
  total: 2,
}

export const mockHealthResponse: HealthCheck = {
  status: 'healthy',
  checks: {
    database: { status: 'healthy' },
    audio_directory: { status: 'healthy' },
    tts_service: { status: 'healthy' },
    task_manager: { status: 'healthy' },
    service_info: {
      status: 'informational',
      name: 'last-whisper-api',
      version: '1.4.2',
      timestamp: now,
    },
  },
}

export interface ApiMockBundle {
  statsSummary: StatsSummary
  items: ItemsListResponse
  attempts: AttemptsListResponse
  practiceLog: PracticeLogResponse
  tags: TagListResponse
  health: HealthCheck
  statsProgress: StatsProgressResponse
  itemStats: Record<number, ItemStatsResponse>
  audioRefresh?: AudioRefreshResponse
  translations?: Record<string, Translation>
}

export const defaultApiMocks: ApiMockBundle = {
  statsSummary: mockStatsSummary,
  items: mockItemsResponse,
  attempts: mockAttemptsResponse,
  practiceLog: mockPracticeLogResponse,
  tags: mockTagsResponse,
  health: mockHealthResponse,
  statsProgress: mockStatsProgressResponse,
  itemStats: mockItemStatsMap,
  audioRefresh: undefined,
  translations: {},
}
