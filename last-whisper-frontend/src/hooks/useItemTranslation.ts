import {useMemo} from 'react'
import {useMutation, useQuery, useQueryClient, type QueryObserverResult} from '@tanstack/react-query'
import {apiClient} from '@/lib/api'
import type {Item, Translation} from '@/types/api'

interface UseItemTranslationOptions {
  currentItem: Item | null
  translationLang: string
  queryKeyPrefix?: string
  onTranslateSuccess?: (result: Translation, variables?: { forceRefresh?: boolean }) => void
  onTranslateError?: (error: Error) => void
  onRefreshSuccess?: (result: Translation) => void
  onRefreshError?: (error: Error) => void
}

interface UseItemTranslationReturn {
  translation: Translation | null | undefined
  isTranslationLoading: boolean
  isTranslationFetching: boolean
  translationErrorMessage: string | null
  translate: (options?: { forceRefresh?: boolean }) => void
  refreshTranslation: () => void
  refetchTranslation: () => Promise<QueryObserverResult<Translation | null, Error>>
  isTranslationBusy: boolean
}

export function useItemTranslation(options: UseItemTranslationOptions): UseItemTranslationReturn {
  const { currentItem, translationLang, queryKeyPrefix = 'item-translation' } = options
  const queryClient = useQueryClient()

  const translationQueryKey = useMemo(() => (
    [queryKeyPrefix, currentItem?.id, translationLang]
  ), [currentItem?.id, queryKeyPrefix, translationLang])

  const translationQuery = useQuery<Translation | null>({
    queryKey: translationQueryKey,
    queryFn: () => apiClient.getCachedTranslation(currentItem!.id, translationLang),
    enabled: !!currentItem && translationLang !== currentItem.locale,
    retry: false,
  })

  const translateMutation = useMutation({
    mutationFn: (variables?: { forceRefresh?: boolean }) => {
      if (!currentItem) {
        throw new Error('No item selected')
      }
      return apiClient.translateItem(currentItem.id, {
        target_lang: translationLang,
        force_refresh: variables?.forceRefresh,
      })
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData(translationQueryKey, result)
      options.onTranslateSuccess?.(result, variables)
    },
    onError: (error: unknown) => {
      const err = error instanceof Error ? error : new Error('Failed to translate item.')
      options.onTranslateError?.(err)
    },
  })

  const refreshTranslationMutation = useMutation({
    mutationFn: async () => {
      if (!currentItem) {
        throw new Error('No item selected')
      }
      const cached = translationQuery.data
      if (cached?.translation_id) {
        return apiClient.refreshTranslation(cached.translation_id)
      }
      return apiClient.translateItem(currentItem.id, {
        target_lang: translationLang,
        force_refresh: true,
      })
    },
    onSuccess: (result) => {
      queryClient.setQueryData(translationQueryKey, result)
      options.onRefreshSuccess?.(result)
    },
    onError: (error: unknown) => {
      const err = error instanceof Error ? error : new Error('Failed to refresh translation.')
      options.onRefreshError?.(err)
    },
  })

  return {
    translation: translationQuery.data,
    isTranslationLoading: translationQuery.isLoading,
    isTranslationFetching: translationQuery.isFetching,
    translationErrorMessage: translationQuery.error instanceof Error ? translationQuery.error.message : null,
    translate: (variables) => translateMutation.mutate(variables),
    refreshTranslation: () => refreshTranslationMutation.mutate(),
    refetchTranslation: translationQuery.refetch,
    isTranslationBusy: translationQuery.isFetching || translateMutation.isPending || refreshTranslationMutation.isPending,
  }
}
