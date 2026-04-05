
import {forwardRef} from 'react'
import {Link} from 'react-router-dom'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Target} from 'lucide-react'
import {AudioPlayerSection, AudioPlayerSectionRef} from '@/components/audio/audio-player-section'
import {Item} from '@/types/api'

interface WalkmanInterfaceProps {
    currentItem: Item | null
    currentItemIndex: number
    totalItems: number
    isInitialLoading: boolean
    isFilterChanging: boolean
    allItems: Item[]
    onPrevious: () => void
    onNext: () => void
    onClearFilters: () => void
    onShowItemList: () => void
    onRefreshAudio?: (itemId: number) => void
    audioRefreshLoading?: boolean
    audioRefreshDisabled?: boolean
    audioRegionId?: string
    audioRegionLabel?: string
}

export const WalkmanInterface = forwardRef<AudioPlayerSectionRef, WalkmanInterfaceProps>(({
                                                                                              currentItem,
                                                                                              currentItemIndex,
                                                                                              totalItems,
                                                                                              isInitialLoading,
                                                                                              isFilterChanging,
                                                                                              allItems,
                                                                                              onPrevious,
                                                                                              onNext,
                                                                                              onClearFilters,
                                                                                              onShowItemList,
                                                                                             onRefreshAudio,
                                                                                              audioRefreshLoading,
                                                                                              audioRefreshDisabled,
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
                                    : "Select an item from the list above to start listening"
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

    return (
        <div className="space-y-6">
            {/* Audio Section */}
            <AudioPlayerSection
                ref={ref}
                currentItem={currentItem}
                currentItemIndex={currentItemIndex}
                totalItems={totalItems}
                onPrevious={onPrevious}
                onNext={onNext}
                onRefreshAudio={onRefreshAudio}
                refreshLoading={audioRefreshLoading}
                refreshDisabled={audioRefreshDisabled}
                regionId={audioRegionId}
                regionLabel={audioRegionLabel ?? 'Walkman audio player'}
            />
        </div>
    )
})

WalkmanInterface.displayName = 'WalkmanInterface'
