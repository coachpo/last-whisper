import type {HealthCheck} from '@/types/api'
import {HttpClient} from './http'

export function createHealthApi(http: HttpClient) {
  return {
    getHealth(): Promise<HealthCheck> {
      return http.request('/health')
    },
  }
}
