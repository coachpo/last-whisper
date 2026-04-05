
import {forwardRef} from 'react'
import {Link} from 'react-router-dom'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Target} from 'lucide-react'
import {AudioPlayerSection, AudioPlayerSectionRef} from '@/components/audio/audio-player-section'
import {PracticeForm} from '@/components/practice/practice-form'
import {PracticeResult} from '@/components/practice/practice-result'
import {Item, Translation} from '@/types/api'
import type {SelectOption} from '@/lib/metadata'
import {TranslationHelperCard} from '@/components/shared/translation-helper-card'
import {Progress} from '@/components/ui/progress'

interface PracticeInterfaceProps {
// ... (same props)
    currentItem: Item | null
    currentItemIndex: number
    totalItems: number
    userText: string
    setUserText: (text: string) => void
    isSubmitting: boolean
    showResult: boolean
    lastScore: number | null
    isInitialLoading: boolean
    isFilterChanging: boolean
    allItems: Item[]
    onPrevious: () => void
    onNext: () => void
    onSubmit: () => void
    onReset: () => void
    onClearFilters: () => void
    onShowItemList: () => void
    onRefreshAudio?: (itemId: number) => void
    audioRefreshLoading?: boolean
    audioRefreshDisabled?: boolean
    translation: Translation | null
    translationError: string | null
    translationLang: string
    translationOptions: SelectOption[]
    onSelectTranslationLang: (lang: string) => void
    onTranslate: () => void
    onRefreshTranslation: () => void
    onCheckCache: () => void
    isTranslationLoading: boolean
    isTranslationBusy: boolean
    audioRegionId?: string
    audioRegionLabel?: string
}

export const PracticeInterface = forwardRef<AudioPlayerSectionRef, PracticeInterfaceProps>(({
                                                                                                currentItem,
                                                                                                currentItemIndex,
                                                                                                totalItems,
                                                                                                userText,
                                                                                                setUserText,
                                                                                                isSubmitting,
                                                                                                showResult,
                                                                                                lastScore,
                                                                                                isInitialLoading,
                                                                                                isFilterChanging,
                                                                                                allItems,
                                                                                                onPrevious,
                                                                                                onNext,
                                                                                                onSubmit,
                                                                                                onReset,
                                                                                                onClearFilters,
                                                                                                onShowItemList,
                                                                                                onRefreshAudio,
                                                                                                audioRefreshLoading,
                                                                                                audioRefreshDisabled,
                                                                                                translation,
                                                                                                translationError,
                                                                                                translationLang,
                                                                                                translationOptions,
                                                                                                onSelectTranslationLang,
                                                                                                onTranslate,
                                                                                                onRefreshTranslation,
                                                                                                onCheckCache,
                                                                                                isTranslationLoading,
                                                                                                isTranslationBusy,
                                                                                                audioRegionId,
                                                                                                audioRegionLabel
                                                                                            }, ref) => {
    if (!currentItem) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                        <h3 className="text-lg font-semibold mb-2">No items available</h3>
                        <p className="text-muted-foreground mb-4">
                            {isInitialLoading || isFilterChanging
                                ? "Loading items..."
                                : allItems.length === 0
                                    ? "No items match your current filters. Try adjusting your search criteria or create some items first."
                                    : "Select an item from the list above to start practicing"
                            }
                        </p>
                        <div className="flex space-x-2 justify-center">
                            {!(isInitialLoading || isFilterChanging) && allItems.length === 0 && (
                                <>
                                    <Button variant="outline" onClick={onClearFilters}>
                                        Clear Filters
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link to="/items">Go to Items</Link>
                                    </Button>
                                </>
                            )}
                            {allItems.length > 0 && (
                                <Button variant="outline" onClick={onShowItemList}>
                                    Show Item List
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const progress = totalItems > 0 ? ((currentItemIndex + 1) / totalItems) * 100 : 0

    return (
        <div className="w-full space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium text-muted-foreground">
                    <span>Item {currentItemIndex + 1} of {totalItems}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* Audio Section */}
            <AudioPlayerSection
                ref={ref}
                currentItem={currentItem}
                currentItemIndex={currentItemIndex}
                totalItems={totalItems}
                onPrevious={onPrevious}
                onNext={onNext}
                showTextDisplay={false}
                onRefreshAudio={onRefreshAudio}
                refreshLoading={audioRefreshLoading}
                refreshDisabled={audioRefreshDisabled}
                regionId={audioRegionId}
                regionLabel={audioRegionLabel ?? 'Practice audio player'}
                className="border-none shadow-lg ring-1 ring-border/50"
            />

            {/* Practice Form */}
            <PracticeForm
                currentItem={currentItem}
                userText={userText}
                setUserText={setUserText}
                isSubmitting={isSubmitting}
                showResult={showResult}
                onSubmit={onSubmit}
                onReset={onReset}
            />

            {/* Practice Result */}
            <PracticeResult
                showResult={showResult}
                lastScore={lastScore}
                userText={userText}
                currentItem={currentItem}
                onNext={onNext}
                onReset={onReset}
            />

            <TranslationHelperCard
                translation={translation}
                translationLang={translationLang}
                translationOptions={translationOptions}
                currentLocale={currentItem?.locale}
                isBusy={isTranslationBusy}
                isLoading={isTranslationLoading}
                errorMessage={translationError}
                onTranslate={onTranslate}
                onRefresh={onRefreshTranslation}
                onTargetLangChange={onSelectTranslationLang}
                onCheckCache={onCheckCache}
            />
        </div>
    )
})

PracticeInterface.displayName = 'PracticeInterface'
