import {useMutation} from '@tanstack/react-query'
import {apiClient} from '@/lib/api'
import type {Item, AudioRefreshResponse} from '@/types/api'
import {useMetadata} from '@/contexts/metadata-context'

interface UseAudioRefreshOptions {
  currentItem: Item | null
  onSuccess?: (result: AudioRefreshResponse) => void
  onError?: (error: Error) => void
}

export function useAudioRefresh({ currentItem, onSuccess, onError }: UseAudioRefreshOptions) {
  const { ttsServiceAvailable } = useMetadata()
  const isRefreshDisabled = ttsServiceAvailable === false
  const mutation = useMutation({
    mutationFn: async () => {
      if (!currentItem) {
        throw new Error('No item selected')
      }
      return apiClient.refreshItemAudio(currentItem.id)
    },
    onSuccess,
    onError: (error: unknown) => {
      const err = error instanceof Error ? error : new Error('Failed to refresh audio.')
      onError?.(err)
    },
  })

  return {
    refreshAudio: () => {
      if (!currentItem) {
        return
      }
      if (isRefreshDisabled) {
        onError?.(new Error('Audio generation is currently unavailable.'))
        return
      }
      mutation.mutate()
    },
    isRefreshingAudio: mutation.isPending,
    isRefreshDisabled,
  }
}
