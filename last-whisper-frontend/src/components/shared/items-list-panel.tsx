
import React, {useCallback} from 'react'
import {Virtuoso, VirtuosoGrid} from 'react-virtuoso'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {List, Target} from 'lucide-react'
import {
    getDifficultyColor,
    getDifficultyLabel,
    getPracticedColor,
    getPracticedLabel,
    getTTSStatusColor,
    getTTSStatusLabel
} from '@/lib/utils'
import {Item} from '@/types/api'

interface ItemsListPanelProps {
    allItems: Item[]
    currentItem: Item | null
    onSelectItem: (item: Item) => void
    showItemList: boolean
    onToggleItemList: () => void
    isInitialLoading: boolean
    isFilterChanging: boolean
    isLoadingMore: boolean
    hasNextPage: boolean
    totalItems: number
    onClearFilters: () => void
    onRequestLoadMore: () => void
    title?: string
    description?: string
    icon?: React.ReactNode
    emptyStateIcon?: React.ReactNode
    emptyStateTitle?: string
    emptyStateDescription?: string
    layout?: 'grid' | 'list'
}

export function ItemsListPanel({
                                   allItems,
                                   currentItem,
                                   onSelectItem,
                                   showItemList,
                                   onToggleItemList,
                                   isInitialLoading,
                                   isFilterChanging,
                                   isLoadingMore,
                                   hasNextPage,
                                   totalItems,
                                   onRequestLoadMore,
                                   onClearFilters,
                                   title = "Available Items",
                                   description = "Select items",
                                   icon = <List className="h-5 w-5"/>,
                                   emptyStateIcon = <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>,
                                   emptyStateTitle = "No items found",
                                   emptyStateDescription = "No items match your current filters. Try adjusting your search criteria.",
                                   layout = 'grid'
                               }: ItemsListPanelProps) {
    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isLoadingMore && !isInitialLoading && !isFilterChanging) {
            onRequestLoadMore()
        }
    }, [hasNextPage, isFilterChanging, isInitialLoading, isLoadingMore, onRequestLoadMore])

    const renderFooter = useCallback((isGridLayout = false) => {
        if (!hasNextPage) {
            return null
        }

        return (
            <div
                className={`p-6 text-center border-2 border-dashed border-muted-foreground/20 rounded-lg ${
                    isGridLayout ? 'col-span-full' : ''
                }`}
                role="status"
                aria-live="polite"
            >
                {isLoadingMore ? (
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="text-sm font-medium text-muted-foreground">Loading more items...</span>
                        <span className="text-xs text-muted-foreground">
                            {allItems.length} of {totalItems} items loaded
                        </span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">
                            Scroll to load more items
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {allItems.length} of {totalItems} items loaded
                        </div>
                    </div>
                )}
            </div>
        )
    }, [allItems.length, hasNextPage, isLoadingMore, totalItems])

    const ListFooter = useCallback(() => renderFooter(false), [renderFooter])
    const GridFooter = useCallback(() => renderFooter(true), [renderFooter])

    const renderItemCard = (item: Item | undefined, index: number) => {
        if (!item) {
            return null
        }
        const isSelected = currentItem?.id === item.id

        if (layout === 'list') {
            // Single-column vertical list for Walkman
            return (
                <div
                    key={`${item.id}-${index}`}
                    className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected
                            ? 'bg-primary/10 border-primary shadow-sm'
                            : 'hover:bg-muted'
                    }`}
                    data-testid="item-card"
                    onClick={() => onSelectItem(item)}
                >
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                    {item.locale}
                                </Badge>
                                <Badge className={`text-xs ${getDifficultyColor(item.difficulty)}`}>
                                    {getDifficultyLabel(item.difficulty)}
                                </Badge>
                                <Badge className={`text-xs ${getTTSStatusColor(item.tts_status)}`}>
                                    {getTTSStatusLabel(item.tts_status)}
                                </Badge>
                                <Badge className={`text-xs ${getPracticedColor(item.practiced)}`}>
                                    {getPracticedLabel(item.practiced)}
                                </Badge>
                            </div>
                            <div className="flex items-center space-x-1">
                <span className="text-xs text-muted-foreground">
                  #{index + 1}
                </span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-tight">
                                {item.text}
                            </p>

                            {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {item.tags.map(tag => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
        } else {
            // Grid layout for Practice
            return (
                <div
                    key={`${item.id}-${index}`}
                    className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected
                            ? 'bg-primary/10 border-primary shadow-sm'
                            : 'hover:bg-muted'
                    }`}
                    data-testid="item-card"
                    onClick={() => onSelectItem(item)}
                >
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                    {item.locale}
                                </Badge>
                                <Badge className={`text-xs ${getDifficultyColor(item.difficulty)}`}>
                                    {getDifficultyLabel(item.difficulty)}
                                </Badge>
                                <Badge className={`text-xs ${getTTSStatusColor(item.tts_status)}`}>
                                    {getTTSStatusLabel(item.tts_status)}
                                </Badge>
                                <Badge className={`text-xs ${getPracticedColor(item.practiced)}`}>
                                    {getPracticedLabel(item.practiced)}
                                </Badge>
                            </div>
                            <div className="flex items-center space-x-1">
                <span className="text-xs text-muted-foreground">
                  #{index + 1}
                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium leading-tight line-clamp-4">
                                {item.text}
                            </p>

                            {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {item.tags.slice(0, 3).map(tag => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                    {item.tags.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{item.tags.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        {icon}
                        <span>{title}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2" aria-label="Items list controls">
                        <Badge variant="outline" className="whitespace-nowrap">
                            {totalItems} items
                            {(isInitialLoading || isFilterChanging) && " (loading...)"}
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onToggleItemList}
                            disabled={isInitialLoading || isFilterChanging}
                        >
                            <List className="h-4 w-4 mr-2"/>
                            <span className="hidden sm:inline">
                {showItemList ? 'Hide' : 'Show'} {title}
              </span>
                            <span className="sm:hidden">
                {showItemList ? 'Hide' : 'Show'}
              </span>
                        </Button>
                        {!isInitialLoading && !isFilterChanging && (
                          <Button variant="ghost" size="sm" onClick={onClearFilters}>
                            Clear filters
                          </Button>
                        )}
                    </div>
                </CardTitle>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    showItemList ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                    {allItems.length === 0 ? (
                        <div className="text-center py-8">
                            {emptyStateIcon}
                            <h3 className="text-lg font-semibold mb-2">{emptyStateTitle}</h3>
                            <p className="text-muted-foreground mb-4">
                                {isInitialLoading || isFilterChanging
                                    ? "Loading items..."
                                    : emptyStateDescription
                                }
                            </p>
                            <div className="flex space-x-2 justify-center">
                                <Button variant="outline" onClick={onClearFilters}>
                                    Clear Filters
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-h-[600px] overflow-hidden" aria-live="polite">
                            {isFilterChanging && allItems.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                        <p className="text-sm text-muted-foreground">Loading filtered items...</p>
                                    </div>
                                </div>
                            ) : layout === 'grid' ? (
                                <VirtuosoGrid
                                    style={{height: 600}}
                                    totalCount={allItems.length}
                                    itemContent={(index) => renderItemCard(allItems[index], index)}
                                    endReached={handleEndReached}
                                    listClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1"
                                    components={{
                                        Footer: GridFooter,
                                    }}
                                />
                            ) : (
                                <Virtuoso
                                    style={{height: 600}}
                                    totalCount={allItems.length}
                                    itemContent={(index) => renderItemCard(allItems[index], index)}
                                    endReached={handleEndReached}
                                    components={{
                                        Footer: ListFooter,
                                    }}
                                    className="space-y-2 p-1"
                                />
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
