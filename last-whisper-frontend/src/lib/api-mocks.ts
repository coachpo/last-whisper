import {
  AudioRefreshResponse,
  AttemptsListResponse,
  CreateTranslationRequest,
  HealthCheck,
  ItemsListResponse,
  PracticeLogResponse,
  StatsProgressResponse,
  StatsSummary,
  TagListResponse,
  Translation,
  type ItemStatsResponse,
} from '@/types/api'

type ItemStatsMap = Record<number, ItemStatsResponse>

export type BrowserMockBundle = Partial<{
  statsSummary: StatsSummary
  items: ItemsListResponse
  attempts: AttemptsListResponse
  practiceLog: PracticeLogResponse
  tags: TagListResponse
  health: HealthCheck
  statsProgress: StatsProgressResponse
  itemStats: ItemStatsMap
  translations: Record<string, Translation>
  audioRefresh?: AudioRefreshResponse
}>

export interface TestApiMockOptions {
  practiceLogForceEmpty?: boolean
  duplicateTagNames?: string[]
}

declare global {
  interface Window {
    __MOCK_FETCH_ENABLED__?: boolean
    __TEST_API_MOCKS__?: BrowserMockBundle
    __TEST_API_FORCE_NETWORK__?: (endpoint: string, init: RequestInit) => boolean
    __TEST_API_MOCK_OPTIONS__?: TestApiMockOptions
    __TEST_API_MOCK_LATENCY__?: number
  }
}

function shouldReturnEmptyPracticeLog(endpoint: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  const options = window.__TEST_API_MOCK_OPTIONS__
  if (!options?.practiceLogForceEmpty) {
    return false
  }
  try {
    const base = window.location?.origin || 'http://localhost'
    const parsed = new URL(endpoint, base)
    const hasDateFilter = parsed.searchParams.has('since') || parsed.searchParams.has('until')
    return hasDateFilter
  } catch {
    return false
  }
}

function buildEmptyPracticeLogResponse(base?: PracticeLogResponse): PracticeLogResponse {
  return {
    practice_log: [],
    total: 0,
    page: base?.page ?? 1,
    per_page: base?.per_page ?? base?.practice_log?.length ?? 10,
    total_pages: base?.total_pages ?? 1,
  }
}

export function getBrowserMockResponse<T>(endpoint: string, init: RequestInit): { hit: true; data: T } | { hit: false } {
  if (typeof window === 'undefined' || !window.__TEST_API_MOCKS__) {
    return { hit: false }
  }

  const forceNetwork = typeof window.__TEST_API_FORCE_NETWORK__ === 'function'
    ? window.__TEST_API_FORCE_NETWORK__(endpoint, init)
    : false

  if (forceNetwork) {
    return { hit: false }
  }

  const method = (init.method || 'GET').toUpperCase()
  const path = endpoint.split('?')[0]
  let parsedUrl: URL | null = null
  try {
    parsedUrl = new URL(endpoint, 'http://localhost')
  } catch {
    parsedUrl = null
  }
  const targetLangParam = parsedUrl?.searchParams.get('target_lang')
  const mocks = window.__TEST_API_MOCKS__

  const stringifyBody = () => {
    if (!init.body) return {}
    if (typeof init.body === 'string') {
      try {
        return JSON.parse(init.body)
      } catch {
        return init.body
      }
    }
    return init.body as unknown
  }

  switch (method) {
    case 'GET':
      if (path === '/v1/stats/summary' && mocks.statsSummary) {
        return { hit: true, data: mocks.statsSummary as T }
      }
      if (path === '/v1/items' && mocks.items) {
        return { hit: true, data: mocks.items as T }
      }
      if (path === '/v1/attempts' && mocks.attempts) {
        return { hit: true, data: mocks.attempts as T }
      }
      if (path === '/v1/stats/practice-log' && mocks.practiceLog) {
        const shouldEmpty = shouldReturnEmptyPracticeLog(endpoint)
        const response = shouldEmpty
          ? buildEmptyPracticeLogResponse(mocks.practiceLog)
          : mocks.practiceLog
        return { hit: true, data: response as T }
      }
      if (path === '/v1/tags' && mocks.tags) {
        return { hit: true, data: mocks.tags as T }
      }
      if (path === '/health' && mocks.health) {
        return { hit: true, data: mocks.health as T }
      }
      if (path === '/v1/stats/progress' && mocks.statsProgress) {
        return { hit: true, data: mocks.statsProgress as T }
      }
      if (path.startsWith('/v1/stats/items/') && mocks.itemStats) {
        const idMatch = path.match(/\/v1\/stats\/items\/(\d+)/)
        const id = idMatch ? parseInt(idMatch[1], 10) : undefined
        if (id && mocks.itemStats[id]) {
          return { hit: true, data: mocks.itemStats[id] as T }
        }
        const fallback = Object.values(mocks.itemStats)[0]
        if (fallback) {
          return { hit: true, data: ({ ...fallback, item_id: id ?? fallback.item_id }) as T }
        }
      }
      const translationMap = mocks.translations as Record<string, Translation> | undefined

      if (path.startsWith('/v1/items/') && path.endsWith('/translations') && translationMap && targetLangParam) {
        const idMatch = path.match(/\/v1\/items\/(\d+)\/translations/)
        const itemId = idMatch ? parseInt(idMatch[1], 10) : undefined
        const key = `${itemId}-${targetLangParam}`
        const found = key ? translationMap[key] : undefined
        if (itemId && found) {
          return { hit: true, data: found as T }
        }
      }
      if (path.startsWith('/v1/items/') && path.endsWith('/tts-status')) {
        const idMatch = path.match(/\/v1\/items\/(\d+)\/tts-status/)
        const itemId = idMatch ? parseInt(idMatch[1], 10) : 0
        const items = mocks.items?.items ?? []
        const item = items.find((candidate) => candidate.id === itemId)
        const now = new Date().toISOString()
        const payload = {
          item_id: itemId,
          tts_status: item?.tts_status ?? 'failed',
          locale: item?.locale ?? 'en-US',
          text: item?.text ?? '',
          created_at: item?.created_at ?? now,
          updated_at: item?.updated_at ?? now,
        }
        return { hit: true, data: payload as T }
      }
      if (path.endsWith('/audio/refresh') && mocks.audioRefresh) {
        return { hit: true, data: mocks.audioRefresh as T }
      }
      break
    case 'POST':
    case 'PUT':
    case 'PATCH':
      if (path.startsWith('/v1/items/') && path.endsWith('/translations')) {
        const idMatch = path.match(/\/v1\/items\/(\d+)\/translations/)
        const itemId = idMatch ? parseInt(idMatch[1], 10) : 0
        const body = stringifyBody() as Partial<CreateTranslationRequest>
        const targetLang = (body as { target_lang?: string }).target_lang ?? targetLangParam ?? 'en'
        const mockedTranslation: Translation = {
          translation_id: Number(`${itemId}${Date.now() % 10000}`),
          item_id: itemId,
          text: `Mock item ${itemId} text`,
          source_lang: 'mock',
          target_lang: targetLang,
          translated_text: `Mock translation (${targetLang})`,
          provider: 'mock',
          cached: body.force_refresh ? false : true,
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_refreshed_at: new Date().toISOString(),
          metadata: { mocked: true }
        }
        return { hit: true, data: mockedTranslation as T }
      }
      if (path.endsWith('/audio/refresh')) {
        const idMatch = path.match(/\/v1\/items\/(\d+)\/audio\/refresh/)
        const itemId = idMatch ? parseInt(idMatch[1], 10) : 0
        const mocked: AudioRefreshResponse = {
          item_id: itemId,
          task_id: `mock-${Date.now()}`,
          status: 'queued',
          tts_status: 'pending',
          audio_path: `audio/item_${itemId}.wav`,
          provider: 'mock',
          voice: null,
          cached: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: { mocked: true }
        }
        return { hit: true, data: mocked as T }
      }
      if (path.startsWith('/v1/translations/') && path.endsWith('/refresh')) {
        const idMatch = path.match(/\/v1\/translations\/(\d+)\/refresh/)
        const translationId = idMatch ? parseInt(idMatch[1], 10) : 0
        const translationMap = mocks.translations as Record<string, Translation> | undefined
        const key = translationMap ? Object.keys(translationMap).find((k) => translationMap[k]?.translation_id === translationId) : undefined
        const translation: Translation | null = key && translationMap ? translationMap[key] ?? null : null
        const now = new Date().toISOString()
        const refreshed: Translation = {
          translation_id: translation?.translation_id ?? (translationId || Number(`${Date.now() % 10000}`)),
          item_id: translation?.item_id ?? 0,
          text: translation?.text ?? 'Mock item text',
          source_lang: translation?.source_lang ?? 'mock',
          target_lang: translation?.target_lang ?? 'en',
          translated_text: translation?.translated_text ?? 'Mock refreshed translation',
          provider: translation?.provider ?? 'mock',
          cached: false,
          status: 'completed',
          created_at: translation?.created_at ?? now,
          updated_at: now,
          last_refreshed_at: now,
          metadata: translation?.metadata ?? { mocked: true }
        }
        return { hit: true, data: refreshed as T }
      }
      return { hit: false }
    case 'DELETE':
      return { hit: false }
  }

  return { hit: false }
}

export {}
