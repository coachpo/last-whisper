import type {CreateTranslationRequest, Translation} from '@/types/api'
import {HttpClient} from './http'

export function createTranslationsApi(http: HttpClient) {
  return {
    async getCachedTranslation(itemId: number, targetLang: string): Promise<Translation | null> {
      const searchParams = new URLSearchParams({ target_lang: targetLang })
      const endpoint = `/v1/items/${itemId}/translations?${searchParams.toString()}`

      try {
        return await http.request<Translation>(endpoint)
      } catch (error) {
        const status = (error as { status?: number }).status
        if (status === 404) {
          return null
        }
        throw error
      }
    },

    translateItem(itemId: number, data: CreateTranslationRequest): Promise<Translation> {
      return http.request(`/v1/items/${itemId}/translations`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },

    refreshTranslation(translationId: number): Promise<Translation> {
      return http.request(`/v1/translations/${translationId}/refresh`, {
        method: 'POST',
      })
    },
  }
}
