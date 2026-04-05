import {describe, expect, it} from 'vitest'

import {normalizeItemsFilters, serializeItemsFilters} from '@/lib/query-utils'

describe('query utils', () => {
  it('normalizes filters by removing undefined values and sorting tags', () => {
    const normalized = normalizeItemsFilters({
      locale: 'en',
      difficulty: undefined,
      tag: ['b', 'a'],
      per_page: 20,
    })

    expect(normalized).toEqual({
      locale: 'en',
      tag: ['a', 'b'],
      per_page: 20,
    })
  })

  it('serializes filters consistently for identical inputs', () => {
    const a = serializeItemsFilters({ locale: 'en', tag: ['foo', 'bar'] })
    const b = serializeItemsFilters({ locale: 'en', tag: ['bar', 'foo'] })

    expect(a).toBe(b)
  })
})
