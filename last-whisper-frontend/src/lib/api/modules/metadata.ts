import type {MetadataQueryParams, MetadataResponse} from '@/types/api'
import {HttpClient} from './http'

function buildMetadataPath(params?: MetadataQueryParams) {
  if (!params) {
    return '/metadata'
  }

  const searchParams = new URLSearchParams()

  if (params.detail) {
    searchParams.set('detail', params.detail)
  }

  if (params.fields?.length) {
    searchParams.set('fields', params.fields.join(','))
  }

  const queryString = searchParams.toString()
  return queryString ? `/metadata?${queryString}` : '/metadata'
}

export function createMetadataApi(http: HttpClient) {
  return {
    getMetadata(params?: MetadataQueryParams): Promise<MetadataResponse> {
      const endpoint = buildMetadataPath(params)
      return http.request(endpoint)
    },
  }
}
