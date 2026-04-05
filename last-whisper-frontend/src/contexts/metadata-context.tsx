
import {createContext, useCallback, useContext, useEffect, useMemo, useRef} from 'react'
import {useQuery} from '@tanstack/react-query'
import {apiClient} from '@/lib/api'
import type {MetadataResponse} from '@/types/api'
import {
  DEFAULT_DIFFICULTY_FILTER_OPTIONS,
  DEFAULT_LOCALE_OPTIONS,
  DEFAULT_METADATA_LIMITS,
  DEFAULT_TRANSLATION_LANG_OPTIONS,
  SelectOption,
  buildOptionsFromCodes,
} from '@/lib/metadata'
import {useToast} from '@/components/ui/use-toast'

interface MetadataContextValue {
  metadata: MetadataResponse | null
  isLoading: boolean
  error: Error | null
  refresh: () => void
  translationOptions: SelectOption[]
  localeOptions: SelectOption[]
  difficultyFilterOptions: SelectOption[]
  schemaVersion?: string
  expectedSchemaVersion: string
  schemaVersionMismatch: boolean
  limits: {
    maxItemsPerBulkRequest: number
    maxTagsPerItem: number
    maxTagLength: number
    maxTextLength: number
  }
  workerRunning: boolean | null
  ttsServiceAvailable: boolean | null
  docsUrl?: string
}

const MetadataContext = createContext<MetadataContextValue | null>(null)

const EXPECTED_SCHEMA_VERSION = import.meta.env.VITE_EXPECTED_METADATA_SCHEMA_VERSION || '2025-11-22'

function resolveMetadataLink(path?: string) {
  if (!path) {
    return undefined
  }
  // With relative URLs, paths from the backend are already usable as-is.
  // If the path is already absolute, return it directly.
  try {
    new URL(path)
    return path
  } catch {
    // Relative path — return as-is (reverse proxy / Next.js rewrites handle routing)
    return path
  }
}

export function MetadataProvider({children}: { children: React.ReactNode }) {
  const { toast } = useToast()
  const query = useQuery({
    queryKey: ['metadata', 'full'],
    queryFn: () => apiClient.getMetadata({ detail: 'full' }),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchInterval: 30_000,
    retry: 2,
  })

  const metadata = query.data ?? null

  const translationOptions = useMemo(() => {
    const codes = metadata?.features?.translation_languages ?? metadata?.providers?.translation?.supported_languages
    return buildOptionsFromCodes(codes, DEFAULT_TRANSLATION_LANG_OPTIONS)
  }, [metadata?.features?.translation_languages, metadata?.providers?.translation?.supported_languages])

  const localeOptions = useMemo(() => {
    const codes = metadata?.features?.tts_languages ?? metadata?.providers?.tts?.supported_languages
    return buildOptionsFromCodes(codes, DEFAULT_LOCALE_OPTIONS)
  }, [metadata?.features?.tts_languages, metadata?.providers?.tts?.supported_languages])

  const limits = useMemo(() => ({
    maxItemsPerBulkRequest:
      metadata?.limits?.max_items_per_bulk_request ?? DEFAULT_METADATA_LIMITS.maxItemsPerBulkRequest,
    maxTagsPerItem: metadata?.limits?.max_tags_per_item ?? DEFAULT_METADATA_LIMITS.maxTagsPerItem,
    maxTagLength: metadata?.limits?.max_tag_length ?? DEFAULT_METADATA_LIMITS.maxTagLength,
    maxTextLength: metadata?.limits?.max_text_length ?? DEFAULT_METADATA_LIMITS.maxTextLength,
  }), [metadata?.limits?.max_items_per_bulk_request, metadata?.limits?.max_tags_per_item, metadata?.limits?.max_tag_length, metadata?.limits?.max_text_length])

  const schemaVersion = metadata?.service?.schema_version
  const schemaVersionMismatch = Boolean(
    schemaVersion && EXPECTED_SCHEMA_VERSION && schemaVersion !== EXPECTED_SCHEMA_VERSION,
  )

  const workerRunning = metadata?.runtime?.worker?.worker_running ?? null
  const ttsServiceAvailable = metadata?.runtime?.worker?.tts_service_available ?? null

  const previousWorkerState = useRef<boolean | null>(null)
  const previousTtsState = useRef<boolean | null>(null)

  useEffect(() => {
    if (workerRunning === false && previousWorkerState.current !== false) {
      toast({
        title: 'Background worker paused',
        description: 'Queue processing is paused. Submissions will be delayed until it resumes.',
        variant: 'destructive',
      })
    } else if (workerRunning === true && previousWorkerState.current === false) {
      toast({
        title: 'Background worker resumed',
        description: 'Processing queue is running again.',
      })
    }
    previousWorkerState.current = workerRunning
  }, [workerRunning, toast])

  useEffect(() => {
    if (ttsServiceAvailable === false && previousTtsState.current !== false) {
      toast({
        title: 'TTS service unavailable',
        description: 'Audio generation is disabled until the TTS service recovers.',
        variant: 'destructive',
      })
    } else if (ttsServiceAvailable === true && previousTtsState.current === false) {
      toast({
        title: 'TTS service restored',
        description: 'Audio submissions are enabled again.',
      })
    }
    previousTtsState.current = ttsServiceAvailable
  }, [ttsServiceAvailable, toast])

  const refresh = useCallback(() => {
    void query.refetch()
  }, [query])

  const value = useMemo<MetadataContextValue>(() => ({
    metadata,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
    refresh,
    translationOptions,
    localeOptions,
    difficultyFilterOptions: DEFAULT_DIFFICULTY_FILTER_OPTIONS,
    schemaVersion,
    expectedSchemaVersion: EXPECTED_SCHEMA_VERSION,
    schemaVersionMismatch,
    limits,
    workerRunning,
    ttsServiceAvailable,
    docsUrl: resolveMetadataLink(metadata?.links?.docs),
  }), [metadata, query.isLoading, query.error, refresh, translationOptions, localeOptions, limits, schemaVersion, schemaVersionMismatch, workerRunning, ttsServiceAvailable])

  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>
}

export function useMetadata() {
  const ctx = useContext(MetadataContext)
  if (!ctx) {
    throw new Error('useMetadata must be used within a MetadataProvider')
  }
  return ctx
}
