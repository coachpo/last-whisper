import {Page, Route, TestInfo} from '@playwright/test'
import {defaultApiMocks, ApiMockBundle} from './api-mocks'
import {PracticeLogResponse, StatsSummary, ItemsListResponse, AttemptsListResponse, TagListResponse, HealthCheck, StatsProgressResponse, ItemStatsResponse, Translation, AudioRefreshResponse} from '@/types/api'
import type {TestApiMockOptions} from '@/lib/api'

export type ApiMockOverrides = Partial<ApiMockBundle>

type ApiMockOptions = TestApiMockOptions

type BrowserMockBundleCompat = Partial<{
  statsSummary: StatsSummary
  items: ItemsListResponse
  attempts: AttemptsListResponse
  practiceLog: PracticeLogResponse
  tags: TagListResponse
  health: HealthCheck
  statsProgress: StatsProgressResponse
  itemStats: Record<number, ItemStatsResponse>
  translations: Record<string, Translation>
  audioRefresh?: AudioRefreshResponse
}>

const endpointPatterns: Record<keyof ApiMockBundle, string> = {
  statsSummary: '**/v1/stats/summary**',
  items: '**/v1/items**',
  attempts: '**/v1/attempts**',
  practiceLog: '**/v1/stats/practice-log**',
  tags: '**/v1/tags**',
  health: '**/health**',
  statsProgress: '**/v1/stats/progress**',
  itemStats: '**/v1/stats/items/**',
  audioRefresh: '**/v1/items/**/audio/refresh**',
  translations: '**/v1/items/**/translations**',
}

const endpointMatchers: Record<keyof ApiMockBundle, RegExp> = {
  statsSummary: /\/v1\/stats\/summary/,
  items: /\/v1\/items(?!\/\d)/,
  attempts: /\/v1\/attempts(?!\/\d)/,
  practiceLog: /\/v1\/stats\/practice-log/,
  tags: /\/v1\/tags/,
  health: /\/(api\/)?health/,
  statsProgress: /\/v1\/stats\/progress/,
  itemStats: /\/v1\/stats\/items\/\d+$/,
  audioRefresh: /\/v1\/items\/\d+\/audio\/refresh$/,
  translations: /\/v1\/items\/\d+\/translations/,
}

declare global {
  interface Window {
    __MOCK_FETCH_ENABLED__?: boolean
    __TEST_API_MOCKS__?: BrowserMockBundleCompat
    __TEST_API_FORCE_NETWORK__?: (endpoint: string, init: RequestInit) => boolean
    __TEST_API_MOCK_OPTIONS__?: TestApiMockOptions
  }
}

function resolveItemStatsPayload(responses: ApiMockBundle, url: string) {
  const idMatch = url.match(/\/v1\/stats\/items\/(\d+)/)
  const id = idMatch ? parseInt(idMatch[1], 10) : undefined
  if (id && responses.itemStats[id]) {
    return responses.itemStats[id]
  }
  const first = Object.values(responses.itemStats)[0]
  if (first) {
    return {
      ...first,
      item_id: id ?? first.item_id,
    }
  }
  return {
    item_id: id ?? 0,
    attempt_count: 0,
    average_score: 0,
    best_score: 0,
    worst_score: 0,
  }
}

function buildCorsHeaders(route: Route) {
  const headers = route.request().headers()
  const origin = headers['origin'] || '*'
  const requestedHeaders = headers['access-control-request-headers'] || 'content-type'
  return {
    'content-type': 'application/json',
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': requestedHeaders,
    'vary': 'Origin',
  }
}

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    headers: buildCorsHeaders(route),
    body: JSON.stringify(payload ?? {}),
  })
}

const buildEmptyPracticeLog = (base?: PracticeLogResponse): PracticeLogResponse => ({
  practice_log: [],
  total: 0,
  page: 1,
  per_page: base?.per_page ?? 10,
  total_pages: 1,
})

export async function setupApiMocks(page: Page, overrides: ApiMockOverrides = {}, options: ApiMockOptions = {}) {
  const responses: ApiMockBundle = {
    ...defaultApiMocks,
    ...overrides,
  }

  const safeResponses = JSON.parse(JSON.stringify(responses)) as ApiMockBundle

  const serializedMatchers: string[][] = Object.entries(endpointMatchers).map(([key, regex]) => [key, regex.source, regex.flags])

  await page.addInitScript(({
    responses: scriptResponses,
    matchers,
    practiceLogForceEmpty,
    duplicateTags,
  }: { responses: ApiMockBundle; matchers: string[][]; practiceLogForceEmpty?: boolean; duplicateTags?: string[] }) => {
    window.__MOCK_FETCH_ENABLED__ = true
    window.__TEST_API_MOCKS__ = scriptResponses
    window.__TEST_API_MOCK_OPTIONS__ = {
      practiceLogForceEmpty: practiceLogForceEmpty ?? false,
      duplicateTagNames: duplicateTags ?? [],
    }
    const serialize = (data: unknown) => JSON.stringify(data ?? {})

    const matcherMap = matchers.reduce((acc, [matcherKey, source, flags]) => {
      acc[matcherKey as keyof ApiMockBundle] = new RegExp(source as string, flags as string)
      return acc
    }, {} as Record<keyof ApiMockBundle, RegExp>)

    const matchEndpoint = (url: string) => {
      return Object.entries(matcherMap).find(([, regex]) => regex.test(url))?.[0]
    }

    const buildResponse = (body: BodyInit | null, status = 200, headers?: Record<string, string>) => {
      return new Response(body, {
        status,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      })
    }

    const applyDynamicOverrides = (key: keyof typeof scriptResponses, urlValue: string, payload: unknown) => {
      if (key === 'practiceLog' && practiceLogForceEmpty) {
        const searchParams = (() => {
          try {
            return new URL(urlValue).searchParams
          } catch {
            try {
              const parsed = new URL(urlValue, window.location.origin)
              return parsed.searchParams
            } catch {
              return undefined
            }
          }
        })()
        const hasDateFilter = !!(searchParams?.get('since') || searchParams?.get('until'))
        if (hasDateFilter) {
          console.log('practice log override triggered', urlValue)
          const base = payload as PracticeLogResponse | undefined
          return {
            practice_log: [],
            total: 0,
            page: 1,
            per_page: base?.per_page ?? 10,
            total_pages: 1,
          }
        }
      }
      return payload
    }

    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' || input instanceof URL ? input.toString() : input.url
      const method = (init?.method || (typeof input === 'object' && 'method' in input ? (input as Request).method : 'GET')).toUpperCase()
      const key = matchEndpoint(url) as keyof typeof scriptResponses | undefined

      const resolveEndpoint = () => {
        try {
          const parsed = new URL(url)
          if (parsed.origin === window.location.origin) {
            return `${parsed.pathname}${parsed.search}`
          }
          return url
        } catch {
          return url
        }
      }

      const shouldBypass = typeof (window as any).__TEST_API_FORCE_NETWORK__ === 'function'
        ? (window as any).__TEST_API_FORCE_NETWORK__(resolveEndpoint(), init || {})
        : false

      if (!key || shouldBypass) {
        return originalFetch(input, init)
      }

      if (method === 'OPTIONS') {
        return buildResponse(null, 200, {
          'Access-Control-Allow-Origin': window.location.origin,
          'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'content-type',
        })
      }

      if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
        const rawBody = init?.body || (typeof input === 'object' && 'text' in input ? await (input as Request).text() : '{}')
        const parsedBody = typeof rawBody === 'string' ? (() => { try { return JSON.parse(rawBody) } catch { return undefined } })() : rawBody

        if (method === 'POST' && key === 'tags' && duplicateTags?.length && parsedBody && typeof parsedBody === 'object') {
          const name = (parsedBody as any).name
          if (name && duplicateTags.includes(name)) {
            return buildResponse(JSON.stringify({ detail: 'Tag already exists' }), 400)
          }
        }

        return buildResponse(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody), 201)
      }

      if (method === 'DELETE') {
        return buildResponse(null, 204)
      }

      const resolvePayload = () => {
        if (key === 'itemStats') {
          const match = url.match(/\/v1\/stats\/items\/(\d+)/)
          const id = match ? parseInt(match[1], 10) : undefined
          const statsMap = scriptResponses.itemStats || {}
          if (typeof id === 'number' && statsMap[id]) {
            return statsMap[id]
          }
          const first = Object.values(statsMap)[0]
          if (first) {
            return {
              ...first,
              item_id: typeof id === 'number' ? id : first.item_id,
            }
          }
        }
        return scriptResponses[key as keyof typeof scriptResponses]
      }

      const payload = resolvePayload()
      const finalPayload = applyDynamicOverrides(key, url, payload)
      return buildResponse(serialize(finalPayload), 200)
    }
  }, { responses: safeResponses, matchers: serializedMatchers, practiceLogForceEmpty: options.practiceLogForceEmpty, duplicateTags: options.duplicateTagNames })

  await Promise.all(
    (Object.entries(endpointPatterns) as Array<[keyof ApiMockBundle, string]>).map(async ([key, pattern]) => {
      await page.route(pattern, async (route) => {
        if (route.request().method() === 'OPTIONS') {
          await route.fulfill({ status: 200, headers: buildCorsHeaders(route) })
          return
        }

        if (key === 'items') {
          const url = route.request().url()
          if (/\/v1\/items\/\d+\/tts-status/.test(url)) {
            await route.fallback()
            return
          }
        }

        // Respond immediately for POST mutations with a generic echo object
        if (route.request().method() === 'POST') {
          const raw = route.request().postData() || '{}'
          let body: unknown
          try {
            body = JSON.parse(raw)
          } catch {
            body = {}
          }
          if (key === 'tags' && options.duplicateTagNames?.length) {
            const name = (body as any)?.name
            if (name && options.duplicateTagNames.includes(name)) {
              await fulfillJson(route, { detail: 'Tag already exists' }, 400)
              return
            }
          }
          await fulfillJson(route, body, 201)
          return
        }

        if (route.request().method() === 'DELETE') {
          await route.fulfill({ status: 204, headers: buildCorsHeaders(route) })
          return
        }

        let payload: unknown = responses[key]
        if (key === 'itemStats') {
          payload = resolveItemStatsPayload(responses, route.request().url())
        }
        if (key === 'practiceLog' && options.practiceLogForceEmpty) {
          const searchParams = new URL(route.request().url()).searchParams
          const hasDateFilter = searchParams.has('since') || searchParams.has('until')
          console.log('practice log route', route.request().url(), { hasDateFilter })
          if (hasDateFilter) {
            payload = buildEmptyPracticeLog(payload as PracticeLogResponse)
          }
        }
        await fulfillJson(route, payload)
      })
    })
  )
}

export interface DfsRecorder {
  record: (action: string) => void
  getPath: () => string[]
  attach: (testInfo: TestInfo, attachmentName?: string) => Promise<void>
}

export function createDfsRecorder(): DfsRecorder {
  const path: string[] = []

  return {
    record(action: string) {
      path.push(action)
    },
    getPath() {
      return [...path]
    },
    async attach(testInfo: TestInfo, attachmentName = 'dfs-path') {
      await testInfo.attach(attachmentName, {
        body: path.join(' -> ') || 'No actions recorded',
        contentType: 'text/plain',
      })
    },
  }
}
