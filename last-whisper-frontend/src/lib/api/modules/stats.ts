import type {
  ItemStatsResponse,
  PracticeLogParams,
  PracticeLogResponse,
  StatsProgressParams,
  StatsProgressResponse,
  StatsSummary,
} from '@/types/api'
import {HttpClient} from './http'

function buildPracticeLogQuery(params?: PracticeLogParams) {
  if (!params) return ''
  const searchParams = new URLSearchParams()
  if (params.page !== undefined && params.page < 1) {
    throw new Error('Page number must be 1 or greater')
  }
  if (params.per_page !== undefined && (params.per_page < 1 || params.per_page > 100)) {
    throw new Error('Per page must be between 1 and 100')
  }
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.append(key, value.toString())
  })
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

function buildStatsProgressQuery(params?: StatsProgressParams) {
  if (!params) return ''
  const searchParams = new URLSearchParams()
  if (params.days !== undefined) {
    if (params.days < 1 || params.days > 365) {
      throw new Error('Days must be between 1 and 365')
    }
  }
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    searchParams.append(key, value.toString())
  })
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export function createStatsApi(http: HttpClient) {
  return {
    getStatsSummary(): Promise<StatsSummary> {
      return http.request('/v1/stats/summary')
    },

    getPracticeLog(params?: PracticeLogParams): Promise<PracticeLogResponse> {
      const query = buildPracticeLogQuery(params)
      return http.request(`/v1/stats/practice-log${query}`)
    },

    getItemStats(id: number): Promise<ItemStatsResponse> {
      return http.request(`/v1/stats/items/${id}`)
    },

    getStatsProgress(params?: StatsProgressParams): Promise<StatsProgressResponse> {
      const query = buildStatsProgressQuery(params)
      return http.request(`/v1/stats/progress${query}`)
    },
  }
}
