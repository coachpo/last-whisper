import type {CreateTagRequest, Tag, TagListResponse} from '@/types/api'
import {HttpClient} from './http'

export function createTagsApi(http: HttpClient) {
  return {
    getTags(limit: number = 100, offset: number = 0): Promise<TagListResponse> {
      if (limit < 1 || limit > 1000) {
        throw new Error('Limit must be between 1 and 1000')
      }
      if (offset < 0) {
        throw new Error('Offset must be 0 or greater')
      }
      const searchParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      })
      return http.request(`/v1/tags?${searchParams.toString()}`)
    },

    createTag(data: CreateTagRequest): Promise<Tag> {
      return http.request('/v1/tags', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },

    deleteTag(id: number): Promise<void> {
      return http.request(`/v1/tags/${id}`, { method: 'DELETE' })
    },
  }
}
