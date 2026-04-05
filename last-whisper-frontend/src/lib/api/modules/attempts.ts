import type {
  Attempt,
  AttemptsListParams,
  AttemptsListResponse,
  CreateAttemptRequest,
} from '@/types/api'
import {HttpClient} from './http'

function normalizeAttemptParams(params?: AttemptsListParams) {
  if (!params) return undefined
  const normalized: AttemptsListParams = {...params}

  if (normalized.limit !== undefined) {
    normalized.per_page = normalized.limit
  }

  if (normalized.offset !== undefined) {
    const perPage = normalized.per_page ?? normalized.limit ?? 20
    const computedPage = Math.floor(normalized.offset / perPage) + 1
    normalized.page = Math.max(1, computedPage)
  }

  if (normalized.page !== undefined && normalized.page < 1) {
    throw new Error('Page number must be 1 or greater')
  }
  if (normalized.per_page !== undefined && (normalized.per_page < 1 || normalized.per_page > 100)) {
    throw new Error('Per page must be between 1 and 100')
  }
  if (normalized.since && normalized.until && new Date(normalized.since) >= new Date(normalized.until)) {
    throw new Error('Since date must be before until date')
  }
  return normalized
}

function buildAttemptQuery(params?: AttemptsListParams) {
  const normalized = normalizeAttemptParams(params)
  if (!normalized) return ''
  const searchParams = new URLSearchParams()
  Object.entries(normalized).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (key === 'limit' || key === 'offset') return
    searchParams.append(key, value.toString())
  })
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export function createAttemptsApi(http: HttpClient) {
  return {
    getAttempts(params?: AttemptsListParams): Promise<AttemptsListResponse> {
      const query = buildAttemptQuery(params)
      return http.request(`/v1/attempts${query}`)
    },

    getAttempt(id: number): Promise<Attempt> {
      return http.request(`/v1/attempts/${id}`)
    },

    createAttempt(data: CreateAttemptRequest): Promise<Attempt> {
      return http.request('/v1/attempts', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
  }
}
