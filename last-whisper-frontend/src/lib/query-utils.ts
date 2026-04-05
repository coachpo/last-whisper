import type {ItemsListParams} from '@/types/api'

export function normalizeItemsFilters(filters: ItemsListParams): ItemsListParams {
  const normalized: ItemsListParams = {}

  if (filters.locale) normalized.locale = filters.locale
  if (filters.difficulty) normalized.difficulty = filters.difficulty
  if (filters.practiced !== undefined) normalized.practiced = filters.practiced
  if (filters.sort) normalized.sort = filters.sort
  if (filters.page) normalized.page = filters.page
  if (filters.per_page) normalized.per_page = filters.per_page

  if (filters.tag?.length) {
    normalized.tag = [...filters.tag].sort()
  }

  return normalized
}

export function serializeItemsFilters(filters: ItemsListParams): string {
  const normalized = normalizeItemsFilters(filters)
  return JSON.stringify(normalized)
}
