
import React from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Filter} from 'lucide-react'
import {TagSelector} from '@/components/tags/tag-selector'
import {ItemsListParams} from '@/types/api'
import {useMetadata} from '@/contexts/metadata-context'

interface FiltersPanelProps {
    filters: ItemsListParams
    onFiltersChange: (newFilters: Partial<ItemsListParams>) => void
    onClearFilters: () => void
    showFilters: boolean
    onToggleFilters: () => void
    isInitialLoading: boolean
    isFilterChanging: boolean
    totalItems: number
    title?: string
    description?: string
}

export function FiltersPanel({
                                 filters,
                                 onFiltersChange,
                                 onClearFilters,
                                 showFilters,
                                 onToggleFilters,
                                 isInitialLoading,
                                 isFilterChanging,
                                 title = "Filters",
                                 description = "Filter items"
                             }: FiltersPanelProps) {
    const {localeOptions, difficultyFilterOptions} = useMetadata()
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        <Filter className="h-5 w-5"/>
                        <span>{title}</span>
                        {(isInitialLoading || isFilterChanging) && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onToggleFilters}
                            disabled={isInitialLoading || isFilterChanging}
                        >
                            <Filter className="h-4 w-4 mr-2"/>
                            <span className="hidden sm:inline">
                {showFilters ? 'Hide' : 'Show'} Filters
              </span>
                            <span className="sm:hidden">
                {showFilters ? 'Hide' : 'Show'}
              </span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClearFilters}
                            disabled={isInitialLoading || isFilterChanging}
                        >
                            Reset Filters
                        </Button>
                    </div>
                </CardTitle>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Filters Section */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    showFilters ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                    <div className="space-y-4 pb-4">
                        <div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
                            {/* Locale Filter */}
                            <div className="space-y-2">
                                <Label>Locale</Label>
                                <Select
                                    value={filters.locale || 'all'}
                                    onValueChange={(value) => onFiltersChange({locale: value === 'all' ? undefined : value})}
                                    disabled={isInitialLoading || isFilterChanging}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Any locale"/>
                                    </SelectTrigger>
                                <SelectContent>
                                        <SelectItem value="all">Any locale</SelectItem>
                                        {localeOptions.map((locale) => (
                                            <SelectItem key={locale.value} value={locale.value}>
                                                {locale.label}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                                </Select>
                            </div>

                            {/* Difficulty Filter */}
                            <div className="space-y-2">
                                <Label>Difficulty</Label>
                                <Select
                                    value={filters.difficulty || 'all'}
                                    onValueChange={(value) => onFiltersChange({difficulty: value === 'all' ? undefined : value})}
                                    disabled={isInitialLoading || isFilterChanging}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Any difficulty"/>
                                    </SelectTrigger>
                                <SelectContent>
                                        <SelectItem value="all">Any difficulty</SelectItem>
                                        {difficultyFilterOptions.map((level) => (
                                            <SelectItem key={level.value} value={level.value}>
                                                {level.label}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                                </Select>
                            </div>

                            {/* Practice Status Filter */}
                            <div className="space-y-2">
                                <Label>Practice Status</Label>
                                <Select
                                    value={filters.practiced === undefined ? 'all' : filters.practiced ? 'true' : 'false'}
                                    onValueChange={(value) => onFiltersChange({practiced: value === 'all' ? undefined : value === 'true'})}
                                    disabled={isInitialLoading || isFilterChanging}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Any status"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any status</SelectItem>
                                        <SelectItem value="false">Not practiced</SelectItem>
                                        <SelectItem value="true">Practiced</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Sort */}
                            <div className="space-y-2">
                                <Label>Sort By</Label>
                                <Select
                                    value={filters.sort || 'created_at.desc'}
                                    onValueChange={(value) => onFiltersChange({sort: value})}
                                    disabled={isInitialLoading || isFilterChanging}
                                >
                                    <SelectTrigger>
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="created_at.desc">Newest first</SelectItem>
                                        <SelectItem value="created_at.asc">Oldest first</SelectItem>
                                        <SelectItem value="difficulty.asc">Easiest first</SelectItem>
                                        <SelectItem value="difficulty.desc">Hardest first</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Tags Filter */}
                        <TagSelector
                            selectedTags={filters.tag || []}
                            onTagsChange={(tags) => onFiltersChange({tag: tags})}
                            placeholder="Filter by tags..."
                            maxTags={10}
                            disabled={isInitialLoading || isFilterChanging}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
