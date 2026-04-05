import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useQuery, type QueryObserverResult} from '@tanstack/react-query'
import {apiClient} from '@/lib/api'
import {serializeItemsFilters} from '@/lib/query-utils'
import type {Item, ItemsListParams, ItemsListResponse} from '@/types/api'

const DEFAULT_FILTERS: ItemsListParams = {
  page: 1,
  per_page: 20,
  sort: 'created_at.asc',
}

interface UsePaginatedItemsOptions {
  initialFilters?: ItemsListParams
  specificItemId?: number | null
  onItemChange?: (item: Item | null) => void
}

interface UsePaginatedItemsReturn {
  filters: ItemsListParams
  allItems: Item[]
  totalItems: number
  currentItem: Item | null
  currentItemIndex: number
  hasNextPage: boolean
  isInitialLoading: boolean
  isFilterChanging: boolean
  isLoadingMore: boolean
  updateFilters: (updates: Partial<ItemsListParams>) => void
  clearAllFilters: () => void
  handleSelectItem: (item: Item) => boolean
  handleNextItem: () => boolean
  handlePreviousItem: () => boolean
  refetchItems: () => Promise<QueryObserverResult<ItemsListResponse, Error>>
  specificItemLoading: boolean
  requestMoreItems: () => void
}

export function usePaginatedItems(options?: UsePaginatedItemsOptions): UsePaginatedItemsReturn {
  const initialFilters = useMemo(() => ({
    ...DEFAULT_FILTERS,
    ...(options?.initialFilters ?? {}),
  }), [options?.initialFilters])

  const onItemChange = options?.onItemChange

  const [filters, setFilters] = useState<ItemsListParams>(initialFilters)
  const [allItems, setAllItems] = useState<Item[]>([])
  const [currentItem, setCurrentItem] = useState<Item | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [totalItems, setTotalItems] = useState(0)

  const previousCurrentItemRef = useRef<Item | null>(null)

  const filtersKey = useMemo(() => serializeItemsFilters(filters), [filters])

  const itemsQuery = useQuery({
    queryKey: ['items', filtersKey],
    queryFn: () => apiClient.getItems(filters),
    refetchOnWindowFocus: false,
    staleTime: 0,
  })

  const specificItemQuery = useQuery({
    queryKey: ['item', options?.specificItemId],
    queryFn: () => apiClient.getItem(options!.specificItemId!),
    enabled: !!options?.specificItemId,
  })

  const isInitialLoading = itemsQuery.isLoading && (filters.page ?? 1) === 1
  const isFilterChanging = itemsQuery.isFetching && (filters.page ?? 1) === 1

  const setCurrentItemWithCallback = useCallback((item: Item | null, index: number, forceNotify = false) => {
    setCurrentItem(item)
    setCurrentItemIndex(index)
    const previousId = previousCurrentItemRef.current?.id
    previousCurrentItemRef.current = item
    if ((forceNotify || previousId !== item?.id) && onItemChange) {
      onItemChange(item)
    }
  }, [onItemChange])

  const updateFilters = useCallback((updates: Partial<ItemsListParams>) => {
    setIsLoadingMore(false)
    setAllItems([])
    setCurrentItemWithCallback(null, 0)
    setHasNextPage(false)
    setFilters(prev => ({
      ...prev,
      ...updates,
      page: 1,
    }))
  }, [setCurrentItemWithCallback])

  const clearAllFilters = useCallback(() => {
    setIsLoadingMore(false)
    setAllItems([])
    setCurrentItemWithCallback(null, 0)
    setHasNextPage(false)
    setFilters(initialFilters)
  }, [initialFilters, setCurrentItemWithCallback])

  const loadMoreItems = useCallback(() => {
    if (hasNextPage && !isLoadingMore && !isInitialLoading && !isFilterChanging) {
      setIsLoadingMore(true)
      setFilters(prev => ({
        ...prev,
        page: (prev.page ?? 1) + 1,
      }))
    }
  }, [hasNextPage, isLoadingMore, isInitialLoading, isFilterChanging])

  const checkAndLoadMoreItems = useCallback((targetIndex: number) => {
    if (targetIndex >= allItems.length - 3 && hasNextPage && !isLoadingMore && !isInitialLoading && !isFilterChanging) {
      loadMoreItems()
    }
  }, [allItems.length, hasNextPage, isLoadingMore, isInitialLoading, isFilterChanging, loadMoreItems])

  const handleSelectItem = useCallback((item: Item) => {
    const index = allItems.findIndex(i => i.id === item.id)
    if (index === -1) {
      return false
    }
    checkAndLoadMoreItems(index)
    setCurrentItemWithCallback(item, index)
    return true
  }, [allItems, checkAndLoadMoreItems, setCurrentItemWithCallback])

  const handleNextItem = useCallback(() => {
    const nextIndex = currentItemIndex + 1
    checkAndLoadMoreItems(nextIndex)
    if (nextIndex < allItems.length) {
      setCurrentItemWithCallback(allItems[nextIndex], nextIndex)
      return true
    }
    return false
  }, [allItems, checkAndLoadMoreItems, currentItemIndex, setCurrentItemWithCallback])

  const handlePreviousItem = useCallback(() => {
    if (currentItemIndex > 0) {
      const prevIndex = currentItemIndex - 1
      setCurrentItemWithCallback(allItems[prevIndex], prevIndex)
      return true
    }
    return false
  }, [allItems, currentItemIndex, setCurrentItemWithCallback])

  useEffect(() => {
    if (specificItemQuery.data) {
      setAllItems([specificItemQuery.data])
      setCurrentItemWithCallback(specificItemQuery.data, 0)
      setHasNextPage(false)
      setTotalItems(1)
      return
    }

    const itemsData = itemsQuery.data
    if (!itemsData?.items) {
      return
    }

    if ((filters.page ?? 1) === 1) {
      setAllItems(itemsData.items)
      if (itemsData.items.length > 0) {
        const existingIndex = previousCurrentItemRef.current
          ? itemsData.items.findIndex(item => item.id === previousCurrentItemRef.current!.id)
          : -1

        if (existingIndex >= 0) {
          setCurrentItemWithCallback(itemsData.items[existingIndex], existingIndex)
        } else {
          setCurrentItemWithCallback(itemsData.items[0], 0, true)
        }
      } else {
        setCurrentItemWithCallback(null, 0, true)
      }
    } else {
      setAllItems(prev => [...prev, ...itemsData.items])
    }

    setHasNextPage((itemsData.page ?? 1) < (itemsData.total_pages ?? 1))
    setIsLoadingMore(false)
    setTotalItems(itemsData.total ?? 0)
  }, [filters.page, itemsQuery.data, specificItemQuery.data, setCurrentItemWithCallback])

  useEffect(() => {
    if (currentItem) {
      const index = allItems.findIndex(item => item.id === currentItem.id)
      if (index !== -1 && index !== currentItemIndex) {
        setCurrentItemIndex(index)
      }
    }
  }, [currentItem, allItems, currentItemIndex])

  useEffect(() => {
    if (isLoadingMore && (filters.page ?? 1) === 1) {
      setIsLoadingMore(false)
    }
  }, [filters.page, isLoadingMore])

  useEffect(() => {
    if (isLoadingMore) {
      setIsLoadingMore(false)
    }
  }, [filters.locale, filters.difficulty, filters.practiced, filters.sort, filters.tag, isLoadingMore])

  return {
    filters,
    allItems,
    totalItems,
    currentItem,
    currentItemIndex,
    hasNextPage,
    isInitialLoading,
    isFilterChanging,
    isLoadingMore,
    updateFilters,
    clearAllFilters,
    handleSelectItem,
    handleNextItem,
    handlePreviousItem,
    refetchItems: itemsQuery.refetch,
    specificItemLoading: specificItemQuery.isLoading,
    requestMoreItems: loadMoreItems,
  }
}
