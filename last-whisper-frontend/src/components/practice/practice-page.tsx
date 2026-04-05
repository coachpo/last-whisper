
import {useCallback, useEffect, useRef, useState} from 'react'
import {Link} from 'react-router-dom'
import {useSearchParams} from 'react-router-dom'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {apiClient} from '@/lib/api'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Clock, List, Maximize, Minimize} from 'lucide-react'
import {AudioPlayerSectionRef} from '@/components/audio/audio-player-section'
import {PracticeInterface} from '@/components/practice/practice-interface'
import {MainLayout} from '@/components/layout/main-layout'

import {CreateAttemptRequest, Item} from '@/types/api'
import {useToast} from '@/components/ui/use-toast'
import {FiltersPanel} from '@/components/shared/filters-panel'
import {ItemsListPanel} from '@/components/shared/items-list-panel'
import {LoadingItemsPanel} from '@/components/shared/loading-items-panel'
import {debug} from '@/lib/debug'
import {usePaginatedItems} from '@/hooks/usePaginatedItems'
import {useItemTranslation} from '@/hooks/useItemTranslation'
import {useAudioRefresh} from '@/hooks/useAudioRefresh'
import {usePersistentBoolean} from '@/hooks/usePersistentBoolean'
import {useMetadata} from '@/contexts/metadata-context'

const PRACTICE_AUDIO_REGION_ID = 'practice-audio-region'

export function PracticePage() {
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { translationOptions } = useMetadata()

  // State for practice flow
  const [userText, setUserText] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [focusMode, setFocusMode] = usePersistentBoolean('lw:practice:focus-mode', false)
  const [focusTimer, setFocusTimer] = useState(0)
  const [translationLang, setTranslationLang] = useState<string>(() => translationOptions[0]?.value ?? 'en')

  // UI state
  const [showFilters, setShowFilters] = usePersistentBoolean('lw:practice:filters-visible', false)
  const [showItemList, setShowItemList] = usePersistentBoolean('lw:practice:item-list-visible', false)

  const itemId = searchParams.get('item')
  const specificItemId = itemId ? parseInt(itemId, 10) : null

  const resetPracticeState = useCallback(() => {
    setUserText('')
    setShowResult(false)
    setLastScore(null)
  }, [])

  const {
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
    handleSelectItem: selectItemFromHook,
    handleNextItem,
    handlePreviousItem,
    specificItemLoading,
    requestMoreItems,
  } = usePaginatedItems({
    initialFilters: {
      page: 1,
      per_page: 20,
      sort: 'created_at.asc',
    },
    specificItemId,
    onItemChange: resetPracticeState,
  })

  const audioPlayerRef = useRef<AudioPlayerSectionRef>(null)

  useEffect(() => {
    if (itemId) {
      setShowItemList(false)
    }
  }, [itemId, setShowItemList])

  useEffect(() => {
    if (!focusMode) {
      return
    }

    const region = document.getElementById(PRACTICE_AUDIO_REGION_ID) as (HTMLElement | null)
    if (region) {
      region.focus({preventScroll: true})
      region.scrollIntoView({behavior: 'smooth', block: 'center'})
    }
  }, [focusMode])

  const { refreshAudio, isRefreshingAudio, isRefreshDisabled } = useAudioRefresh({
    currentItem,
    onSuccess: (result) => {
      toast({
        title: 'Audio refresh queued',
        description: `Task ${result.task_id} started. Status: ${result.status}.`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Refresh failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const {
    translation,
    isTranslationLoading,
    isTranslationFetching,
    translationErrorMessage,
    translate,
    refreshTranslation,
    refetchTranslation,
    isTranslationBusy,
  } = useItemTranslation({
    currentItem,
    translationLang,
    queryKeyPrefix: 'practice-translation',
    onTranslateSuccess: (result, variables) => {
      toast({
        title: variables?.forceRefresh ? 'Translation refreshed' : 'Translation ready',
        description: result.cached ? 'Returned from cache.' : 'Fresh from provider.',
      })
    },
    onTranslateError: (error) => {
      toast({
        title: 'Translation failed',
        description: error.message,
        variant: 'destructive',
      })
    },
    onRefreshSuccess: (result) => {
      toast({
        title: 'Translation refreshed',
        description: result.cached ? 'Loaded from cache.' : 'Fetched fresh translation.',
      })
    },
    onRefreshError: (error) => {
      toast({
        title: 'Refresh failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const submitAttemptMutation = useMutation({
    mutationFn: (data: CreateAttemptRequest) => apiClient.createAttempt(data),
    onSuccess: (result) => {
      setLastScore(result.percentage)
      setShowResult(true)
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['attempts'] }),
        queryClient.invalidateQueries({ queryKey: ['stats-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['practice-log'] }),
        queryClient.invalidateQueries({ queryKey: ['stats-progress'] }),
        queryClient.invalidateQueries({ queryKey: ['stats-item'] }),
      ])
    },
    onError: (error: Error) => {
        debug.error('Failed to submit attempt:', error)

      // Provide more specific error messages based on the error content
      let title = "Error submitting attempt"
      let description = error.message || "Failed to submit your attempt. Please try again."

      if (error.message.includes("text") && error.message.includes("too_long")) {
        title = "Text too long"
        description = "Your attempt text exceeds the maximum allowed length. Please shorten it and try again."
      } else if (error.message.includes("text") && error.message.includes("too_short")) {
        title = "Text too short"
        description = "Your attempt text is too short. Please add more content and try again."
      } else if (error.message.includes("item_id")) {
        title = "Invalid item"
        description = "The item you're trying to practice is no longer available. Please refresh and try again."
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      })
    },
    onSettled: () => {
      setIsSubmitting(false)
    }
  })


  const ensureValidTargetLanguage = () => {
    if (!currentItem) {
      return false
    }
    if (translationLang === currentItem.locale) {
      toast({
        title: 'Choose another language',
        description: 'Target language must differ from the item locale.',
        variant: 'destructive',
      })
      return false
    }
    return true
  }

  const handleTranslate = () => {
    if (!ensureValidTargetLanguage()) {
      return
    }
    translate()
  }

  const handleRefreshTranslation = () => {
    if (!ensureValidTargetLanguage()) {
      return
    }
    refreshTranslation()
  }

  const handleRefreshAudio = () => {
    refreshAudio()
  }

  // Focus mode session timer for clarity
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (focusMode) {
      setFocusTimer(0)
      interval = setInterval(() => {
        setFocusTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [focusMode])

  // Keep translation target different from source locale by default
  useEffect(() => {
    if (!translationOptions.length) {
      return
    }
    setTranslationLang(prev => {
      if (prev && translationOptions.some(option => option.value === prev)) {
        return prev
      }
      return translationOptions[0]?.value ?? prev
    })
  }, [translationOptions])

  useEffect(() => {
    if (!currentItem || !translationOptions.length) {
      return
    }
        if (translationLang === currentItem.locale) {
      const alternative = translationOptions.find((lang) => lang.value !== currentItem.locale)
      if (alternative) {
        setTranslationLang(alternative.value)
      }
    }
  }, [currentItem, translationLang, translationOptions])

  const handleSubmit = async () => {
    if (!currentItem || !userText.trim() || isSubmitting) return

    // Client-side validation according to API documentation
    if (userText.length > 10000) {
      toast({
        title: "Text too long",
        description: "Your attempt text must be 10,000 characters or less. Please shorten it and try again.",
        variant: "destructive",
      })
      return
    }

    // Note: API allows min_length=0, so we don't need to check for minimum length

    setIsSubmitting(true)
    submitAttemptMutation.mutate({
      item_id: currentItem.id,
      text: userText.trim()
    })
  }

  const handleNext = () => {
    handleNextItem()
  }

  const handlePrevious = () => {
    handlePreviousItem()
  }

  const handleSelectItem = (item: Item) => {
    const didSelect = selectItemFromHook(item)
    if (didSelect) {
      setShowItemList(false)
    }
  }

  const handleReset = () => {
    resetPracticeState()
  }



    // Show full-page loading for initial load and filter changes, not for infinite scroll
    if (isInitialLoading || isFilterChanging || specificItemLoading) {
    return (
        <LoadingItemsPanel
            title="Practice"
            description="Practice your dictation skills with audio content"
            loadingMessage="Loading practice items..."
        />
    )
  }

  return (
      <MainLayout focusMode={focusMode}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Practice</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Practice your dictation skills with filtering and item selection
          </p>
        </div>
          <div className="flex items-center gap-2">
             <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setFocusMode(!focusMode)}
                 aria-pressed={focusMode}
                 aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
             >
                 {focusMode ? <Minimize className="h-4 w-4 mr-2"/> : <Maximize className="h-4 w-4 mr-2"/>}
                 {focusMode ? 'Exit Focus' : 'Focus Mode'}
             </Button>
             {focusMode && (
               <span className="text-xs text-muted-foreground" aria-live="polite">
                 Focus session: {Math.floor(focusTimer / 60)}m {focusTimer % 60}s
               </span>
             )}
          </div>
      </div>

        {/* Filters Panel */}
        {!focusMode && (
        <FiltersPanel
            filters={filters}
            onFiltersChange={updateFilters}
            onClearFilters={clearAllFilters}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            isInitialLoading={isInitialLoading}
            isFilterChanging={isFilterChanging}
            totalItems={totalItems}
            description="Filter items for practice"
        />
        )}

        {/* Available Items Section */}
        <ItemsListPanel
            allItems={allItems}
            currentItem={currentItem}
            onSelectItem={handleSelectItem}
            showItemList={showItemList}
            onToggleItemList={() => setShowItemList(!showItemList)}
            isInitialLoading={isInitialLoading}
            isFilterChanging={isFilterChanging}
            isLoadingMore={isLoadingMore}
            hasNextPage={hasNextPage}
            totalItems={totalItems}
            onClearFilters={clearAllFilters}
            onRequestLoadMore={requestMoreItems}
            title="Available Items"
            description="Select items for practice"
            icon={<List className="h-5 w-5"/>}
            emptyStateIcon={<List className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>}
            emptyStateTitle="No items found"
            emptyStateDescription="No items match your current filters. Try adjusting your search criteria."
            layout="grid"
        />

      {/* Practice Interface */}
        <PracticeInterface
            ref={audioPlayerRef}
            currentItem={currentItem}
            currentItemIndex={currentItemIndex}
            totalItems={totalItems}
            userText={userText}
            setUserText={setUserText}
            isSubmitting={isSubmitting}
            showResult={showResult}
            lastScore={lastScore}
            isInitialLoading={isInitialLoading}
            isFilterChanging={isFilterChanging}
            allItems={allItems}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
            onReset={handleReset}
            onClearFilters={clearAllFilters}
            onShowItemList={() => setShowItemList(true)}
            onRefreshAudio={handleRefreshAudio}
            audioRefreshLoading={isRefreshingAudio}
            audioRefreshDisabled={isRefreshDisabled}
            translation={translation ?? null}
            translationError={translationErrorMessage}
            translationLang={translationLang}
            translationOptions={translationOptions}
            onSelectTranslationLang={setTranslationLang}
            onTranslate={handleTranslate}
            onRefreshTranslation={handleRefreshTranslation}
            onCheckCache={() => void refetchTranslation()}
            isTranslationLoading={isTranslationLoading || isTranslationFetching}
            isTranslationBusy={isTranslationBusy}
            audioRegionId={PRACTICE_AUDIO_REGION_ID}
        />

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <Clock className="h-4 w-4 inline mr-1" />
              Practice session: {allItems.length} items available
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" asChild>
                <Link to="/items">Browse Items</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/stats">View Stats</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
      </MainLayout>
  )
}
