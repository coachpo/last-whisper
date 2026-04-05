
import {useEffect, useRef, useState} from 'react'
import {useSearchParams} from 'react-router-dom'
import {List, Target} from 'lucide-react'
import {AudioPlayerSectionRef} from '@/components/audio/audio-player-section'
import {WalkmanInterface} from '@/components/walkman/walkman-interface'

import type {Item} from '@/types/api'

import {FiltersPanel} from '@/components/shared/filters-panel'
import {ItemsListPanel} from '@/components/shared/items-list-panel'
import {LoadingItemsPanel} from '@/components/shared/loading-items-panel'
import {useToast} from '@/components/ui/use-toast'
import {usePaginatedItems} from '@/hooks/usePaginatedItems'
import {useItemTranslation} from '@/hooks/useItemTranslation'
import {useAudioRefresh} from '@/hooks/useAudioRefresh'
import {usePersistentBoolean} from '@/hooks/usePersistentBoolean'
import {TranslationHelperCard} from '@/components/shared/translation-helper-card'
import {useMetadata} from '@/contexts/metadata-context'

const WALKMAN_AUDIO_REGION_ID = 'walkman-audio-region'

export function WalkmanPage() {
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const { translationOptions } = useMetadata()

  const [translationLang, setTranslationLang] = useState<string>(() => translationOptions[0]?.value ?? 'en')
  const [showFilters, setShowFilters] = usePersistentBoolean('lw:walkman:filters-visible', false)
  const [showItemList, setShowItemList] = usePersistentBoolean('lw:walkman:item-list-visible', false)

  const itemId = searchParams.get('item')
  const specificItemId = itemId ? parseInt(itemId, 10) : null

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
  })

  const audioPlayerRef = useRef<AudioPlayerSectionRef>(null)

  useEffect(() => {
    if (itemId) {
      setShowItemList(false)
    }
  }, [itemId, setShowItemList])

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
    queryKeyPrefix: 'walkman-translation',
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

  const ensureValidTargetLanguage = () => {
    if (!currentItem) {
      toast({
        title: 'No item selected',
        description: 'Select an item to translate.',
        variant: 'destructive',
      })
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

  const handleCheckCache = () => {
    void refetchTranslation()
  }

  const handleRefreshAudio = () => {
    refreshAudio()
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

  const isTranslationLoadingState = isTranslationLoading || isTranslationFetching

  if (isInitialLoading || isFilterChanging || specificItemLoading) {
    return (
      <LoadingItemsPanel
        title="Walkman"
        description="Listen to audio content with continuous playback"
        loadingMessage="Loading audio items..."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Walkman</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Listen to audio content with continuous playback
          </p>
        </div>
      </div>

      <FiltersPanel
        filters={filters}
        onFiltersChange={updateFilters}
        onClearFilters={clearAllFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        isInitialLoading={isInitialLoading}
        isFilterChanging={isFilterChanging}
        totalItems={totalItems}
        description="Filter items for audio playback"
      />

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
        description="Select items for audio playback"
        icon={<List className="h-5 w-5"/>}
        emptyStateIcon={<Target className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>}
        emptyStateTitle="No items found"
        emptyStateDescription="No items match your current filters. Try adjusting your search criteria."
        layout="grid"
      />

      <WalkmanInterface
        ref={audioPlayerRef}
        currentItem={currentItem}
        currentItemIndex={currentItemIndex}
        totalItems={totalItems}
        isInitialLoading={isInitialLoading}
        isFilterChanging={isFilterChanging}
        allItems={allItems}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onClearFilters={clearAllFilters}
        onShowItemList={() => setShowItemList(true)}
        onRefreshAudio={handleRefreshAudio}
        audioRefreshLoading={isRefreshingAudio}
        audioRefreshDisabled={isRefreshDisabled}
            audioRegionId={WALKMAN_AUDIO_REGION_ID}
      />

      {currentItem && (
        <TranslationHelperCard
          translation={translation ?? null}
          translationLang={translationLang}
          translationOptions={translationOptions}
          currentLocale={currentItem.locale}
          isBusy={isTranslationBusy}
          isLoading={isTranslationLoadingState}
          errorMessage={translationErrorMessage}
          onTranslate={handleTranslate}
          onRefresh={handleRefreshTranslation}
          onTargetLangChange={setTranslationLang}
          onCheckCache={handleCheckCache}
        />
      )}
    </div>
  )
}
