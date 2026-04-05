import type {TTSConversionRequest, TTSConversionResponse, TTSStatus} from '@/types/api'
import {HttpClient} from './http'

export function createTtsApi(http: HttpClient) {
  return {
    convertTTS(data: TTSConversionRequest): Promise<TTSConversionResponse> {
      return http.request('/api/v1/tts/convert', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },

    getTTSStatus(id: string): Promise<TTSStatus> {
      return http.request(`/api/v1/tts/${id}`)
    },

    getTTSConversions(): Promise<TTSStatus[]> {
      return http.request('/api/v1/tts')
    },
  }
}
