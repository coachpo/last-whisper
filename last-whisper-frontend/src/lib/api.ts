import {HttpClient, API_BASE_URL} from '@/lib/api/modules/http'
import {createItemsApi} from '@/lib/api/modules/items'
import {createAttemptsApi} from '@/lib/api/modules/attempts'
import {createStatsApi} from '@/lib/api/modules/stats'
import {createTagsApi} from '@/lib/api/modules/tags'
import {createTranslationsApi} from '@/lib/api/modules/translations'
import {createTtsApi} from '@/lib/api/modules/tts'
import {createHealthApi} from '@/lib/api/modules/health'
import {createMetadataApi} from '@/lib/api/modules/metadata'

export type ApiClient = ReturnType<typeof createApiClient>

export function createApiClient(baseUrl: string = API_BASE_URL) {
  const http = new HttpClient(baseUrl)

  const items = createItemsApi(http)
  const attempts = createAttemptsApi(http)
  const stats = createStatsApi(http)
  const tags = createTagsApi(http)
  const translations = createTranslationsApi(http)
  const tts = createTtsApi(http)
  const health = createHealthApi(http)
  const metadata = createMetadataApi(http)

  return {
    ...items,
    ...attempts,
    ...stats,
    ...tags,
    ...translations,
    ...tts,
    ...health,
    ...metadata,
  }
}

export const apiClient = createApiClient()

export {API_BASE_URL}
export type {TestApiMockOptions} from '@/lib/api/modules/http'
export default apiClient
