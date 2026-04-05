import {debug} from '@/lib/debug'
import type {ApiError, ValidationError} from '@/types/api'

export type {TestApiMockOptions} from '@/lib/api-mocks'

// SPA mode: always use relative URLs (Vite dev proxy or production reverse proxy)
const API_BASE_URL = ''

type BrowserMockModule = typeof import('@/lib/api-mocks')
let mockModulePromise: Promise<BrowserMockModule> | null = null

function browserMockSignalsPresent() {
  return Boolean(
    (window as typeof window & {
      __TEST_API_MOCKS__?: unknown
      __MOCK_FETCH_ENABLED__?: boolean
      __TEST_API_FORCE_NETWORK__?: unknown
    }).__TEST_API_MOCKS__ ||
      (window as typeof window & { __MOCK_FETCH_ENABLED__?: boolean }).__MOCK_FETCH_ENABLED__ ||
      (window as typeof window & { __TEST_API_FORCE_NETWORK__?: unknown }).__TEST_API_FORCE_NETWORK__
  )
}

async function loadBrowserMockModule() {
  if (!browserMockSignalsPresent()) {
    return null
  }
  if (!mockModulePromise) {
    mockModulePromise = import('@/lib/api-mocks')
  }
  return mockModulePromise
}

async function tryGetMockResponse<T>(endpoint: string, config: RequestInit) {
  const mockModule = await loadBrowserMockModule()
  if (!mockModule) {
    return null
  }
  const result = mockModule.getBrowserMockResponse<T>(endpoint, config)
  return result.hit ? result : null
}

function normalizeHeaders(headers?: HeadersInit, body?: BodyInit | null) {
  const normalized = new Headers(headers)
  if (body && !normalized.has('Content-Type')) {
    normalized.set('Content-Type', 'application/json')
  }
  return normalized
}

function buildErrorMessage(errorData: ApiError) {
  if (!Array.isArray(errorData.detail)) {
    return typeof errorData.detail === 'string'
      ? errorData.detail
      : `HTTP error: ${errorData.error_code ?? 'unknown'}`
  }

  return errorData.detail.map((err: ValidationError) => {
    const fieldPath = err.loc.length > 0 ? err.loc.join('.') : 'field'

    if (err.ctx?.max_length && err.ctx?.actual_length !== undefined) {
      return `${fieldPath}: ${err.msg} (${err.ctx.actual_length} provided, maximum allowed is ${err.ctx.max_length})`
    }
    if (err.ctx?.min_length && err.ctx?.actual_length !== undefined) {
      return `${fieldPath}: ${err.msg} (${err.ctx.actual_length} provided, minimum required is ${err.ctx.min_length})`
    }
    if (err.ctx?.max_value !== undefined && err.input !== undefined) {
      return `${fieldPath}: ${err.msg} (${err.input} provided, maximum allowed is ${err.ctx.max_value})`
    }
    if (err.ctx?.min_value !== undefined && err.input !== undefined) {
      return `${fieldPath}: ${err.msg} (${err.input} provided, minimum required is ${err.ctx.min_value})`
    }
    if (err.ctx?.allowed_values) {
      return `${fieldPath}: ${err.msg} (allowed values: ${err.ctx.allowed_values.join(', ')})`
    }
    if (err.ctx?.missing_fields) {
      return `${fieldPath}: ${err.msg} (missing fields: ${err.ctx.missing_fields.join(', ')})`
    }
    if (err.ctx?.extra_fields) {
      return `${fieldPath}: ${err.msg} (extra fields: ${err.ctx.extra_fields.join(', ')})`
    }
    if (err.ctx?.pattern) {
      return `${fieldPath}: ${err.msg} (pattern: ${err.ctx.pattern})`
    }
    return `${fieldPath}: ${err.msg}`
  }).join('; ')
}

function hasBody(response: Response) {
  if (response.status === 204) return false
  const contentLength = response.headers.get('content-length')
  if (contentLength === '0') return false
  return true
}

export class HttpClient {
  constructor(private readonly baseUrl: string = API_BASE_URL) {}

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = normalizeHeaders(options.headers, options.body ?? null)

    const config: RequestInit = {
      ...options,
      credentials: 'include',
      headers,
    }

    const mockResult = await tryGetMockResponse<T>(endpoint, config)
    if (mockResult) {
      if ((window as typeof window & { __MOCK_FETCH_ENABLED__?: boolean }).__MOCK_FETCH_ENABLED__) {
        const latency = (window as typeof window & { __TEST_API_MOCK_LATENCY__?: number }).__TEST_API_MOCK_LATENCY__ ?? 300
        if (latency > 0) {
          await new Promise(resolve => setTimeout(resolve, latency))
        }
      }
      return mockResult.data
    }

    try {
      debug.api.request(url, config.method)
      const response = await fetch(url, config)
      debug.api.response(url, response.status)

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          detail: `HTTP ${response.status}: ${response.statusText}`,
        }))

        const error = new Error(buildErrorMessage(errorData))
        ;(error as { status?: number }).status = response.status
        throw error
      }

      if (!hasBody(response)) {
        return {} as T
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred')
    }
  }

  async requestBlob(endpoint: string): Promise<Blob> {
    const url = `${this.baseUrl}${endpoint}`
    try {
      const headers = normalizeHeaders()
      const response = await fetch(url, { credentials: 'include', headers })
      if (!response.ok) {
        throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`)
      }
      return await response.blob()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred')
    }
  }
}

export {API_BASE_URL}
