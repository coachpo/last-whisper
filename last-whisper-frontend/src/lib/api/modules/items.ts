import {debug} from '@/lib/debug'
import type {
  AudioRefreshResponse,
  BulkCreateItemsRequest,
  BulkItemCreateResponse,
  CreateItemRequest,
  DifficultyUpdateResponse,
  Item,
  ItemTTSStatusResponse,
  ItemsListParams,
  ItemsListResponse,
  TagUpdateResponse,
  UpdateItemDifficultyRequest,
  UpdateItemTagsRequest,
} from '@/types/api'
import {HttpClient} from './http'

function buildItemsQuery(params?: ItemsListParams) {
  const searchParams = new URLSearchParams()
  if (!params) {
    return ''
  }

  const {page, per_page, sort, tag, ...rest} = params

  if (page !== undefined) {
    if (page < 1) throw new Error('Page number must be 1 or greater')
    searchParams.set('page', String(page))
  }

  if (per_page !== undefined) {
    if (per_page < 1 || per_page > 100) throw new Error('Per page must be between 1 and 100')
    searchParams.set('per_page', String(per_page))
  }

  if (sort) {
    const allowedSort = ['created_at.asc', 'created_at.desc', 'difficulty.asc', 'difficulty.desc']
    if (!allowedSort.includes(sort)) {
      throw new Error('Sort must be one of: created_at.asc, created_at.desc, difficulty.asc, difficulty.desc')
    }
    searchParams.set('sort', sort)
  }

  if (tag && Array.isArray(tag)) {
    tag.forEach(value => searchParams.append('tag', value))
  }

  Object.entries(rest).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    searchParams.set(key, value.toString())
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export function createItemsApi(http: HttpClient) {
  return {
    getItems(params?: ItemsListParams): Promise<ItemsListResponse> {
      const query = buildItemsQuery(params)
      return http.request(`/v1/items${query}`)
    },

    createItem(data: CreateItemRequest): Promise<Item> {
      return http.request('/v1/items', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },

    getItem(id: number): Promise<Item> {
      return http.request(`/v1/items/${id}`)
    },

    deleteItem(id: number): Promise<void> {
      return http.request(`/v1/items/${id}`, { method: 'DELETE' })
    },

    updateItemTags(id: number, data: UpdateItemTagsRequest): Promise<TagUpdateResponse> {
      return http.request(`/v1/items/${id}/tags`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    },

    updateItemDifficulty(id: number, data: UpdateItemDifficultyRequest): Promise<DifficultyUpdateResponse> {
      return http.request(`/v1/items/${id}/difficulty`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    },

    bulkCreateItems(data: BulkCreateItemsRequest): Promise<BulkItemCreateResponse> {
      return http.request('/v1/items/bulk', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },

    async getItemAudio(id: number): Promise<Blob> {
      const blob = await http.requestBlob(`/v1/items/${id}/audio`)
      debug.log(`Audio for item ${id}:`, {
        type: blob.type,
        size: blob.size,
      })
      return blob
    },

    refreshItemAudio(id: number): Promise<AudioRefreshResponse> {
      return http.request(`/v1/items/${id}/audio/refresh`, { method: 'POST' })
    },

    getItemTTSStatus(id: number): Promise<ItemTTSStatusResponse> {
      return http.request(`/v1/items/${id}/tts-status`)
    },
  }
}
