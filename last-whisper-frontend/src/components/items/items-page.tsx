
import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {apiClient} from '@/lib/api'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Play, Plus, Trash2} from 'lucide-react'
import {CreateItemDialog} from './create-item-dialog'
import {BulkCreateDialog} from './bulk-create-dialog'
import {ItemDetailsDialog} from './item-details-dialog'
import {DeleteItemDialog} from './delete-item-dialog'
import {Pagination} from '@/components/ui/pagination'
import {FiltersPanel} from '@/components/shared/filters-panel'
import {
    formatDate,
    getDifficultyColor,
    getDifficultyLabel,
    getPracticedColor,
    getPracticedLabel,
    getTTSStatusColor,
    getTTSStatusLabel,
    truncateText
} from '@/lib/utils'
import {Item, ItemsListParams} from '@/types/api'
import {AlertCircle} from 'lucide-react'
import {useToast} from '@/components/ui/use-toast'

export function ItemsPage() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [filters, setFilters] = useState<ItemsListParams>({})
    const [showFilters, setShowFilters] = useState(false)
    const [selectedItem, setSelectedItem] = useState<Item | null>(null)
    const [deleteItem, setDeleteItem] = useState<Item | null>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showBulkDialog, setShowBulkDialog] = useState(false)
    const [showDetailsDialog, setShowDetailsDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [pagination, setPagination] = useState({
        page: 1,
        per_page: 20
    })

    // Build API parameters
    const buildApiParams = (): ItemsListParams => {
        const params: ItemsListParams = {
            page: pagination.page,
            per_page: pagination.per_page,
            ...filters
        }

        return params
    }

    const apiParams = buildApiParams()

    const {data: itemsData, isLoading, error, refetch, isFetching} = useQuery({
        queryKey: ['items', apiParams],
        queryFn: () => apiClient.getItems(apiParams),
        retry: 1,
    })

    useEffect(() => {
        if (!error) {
            return
        }

        const message = error instanceof Error ? error.message : 'Failed to load items.'
        toast({
            title: 'Items failed to load',
            description: message,
            variant: 'destructive',
        })
    }, [error, toast])

    const items = itemsData?.items || []
    const total = itemsData?.total || 0
    const currentPage = itemsData?.page || pagination.page
    const totalPages = itemsData?.total_pages || Math.ceil(total / pagination.per_page)

    const handleItemClick = (item: Item) => {
        setSelectedItem(item)
        setShowDetailsDialog(true)
    }

    const handleDeleteClick = (item: Item, e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleteItem(item)
        setShowDeleteDialog(true)
    }

    const handleDeleteSuccess = () => {
        refetch()
        setShowDeleteDialog(false)
        setDeleteItem(null)
    }

    const handleCreateSuccess = () => {
        refetch()
        setShowCreateDialog(false)
    }

    const handleBulkCreateSuccess = () => {
        refetch()
        setShowBulkDialog(false)
    }

    const handlePageChange = (page: number) => {
        setPagination(prev => ({...prev, page}))
    }

    const handleFiltersChange = (newFilters: Partial<ItemsListParams>) => {
        setFilters(prev => ({...prev, ...newFilters}))
        // Reset to first page when filters change
        setPagination(prev => ({...prev, page: 1}))
    }

    const handleClearFilters = () => {
        setFilters({})
        setPagination(prev => ({...prev, page: 1}))
    }

    const handleToggleFilters = () => {
        setShowFilters(prev => !prev)
    }

    const handleOpenCreateDialog = () => {
        setShowCreateDialog(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dictation Items</h1>
                    <p className="text-muted-foreground">
                        Manage your dictation practice items
                    </p>
                </div>
                <div className="flex flex-wrap gap-2" aria-label="Item actions">
                    <Button variant="outline" onClick={() => setShowBulkDialog(true)}>
                        <Plus className="h-4 w-4 mr-2"/>
                        Bulk Create
                    </Button>
                    <Button onClick={handleOpenCreateDialog}>
                        <Plus className="h-4 w-4 mr-2"/>
                        Add Item
                    </Button>
                </div>
            </div>

            {/* Filters Panel */}
            <FiltersPanel
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                showFilters={showFilters}
                onToggleFilters={handleToggleFilters}
                isInitialLoading={isLoading}
                isFilterChanging={false}
                totalItems={total}
                title="Items Filters"
                description="Filter and sort your dictation items"
            />

            {/* Results Summary */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center text-sm text-muted-foreground" aria-live="polite">
                <div>
                    Showing {items.length} of {total} items
                </div>
                <div>
                    Page {currentPage} of {totalPages}
                </div>
            </div>

            {error && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border border-destructive/40 bg-destructive/10 p-3" role="alert" aria-live="assertive">
                    <div className="flex items-start gap-2 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>{error instanceof Error ? error.message : 'Unable to fetch items. Please try again.'}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                            {isFetching ? 'Retrying…' : 'Retry'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Items Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {isLoading ? (
                    [...Array(8)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-4 w-3/4 bg-muted rounded"/>
                                <div className="h-3 w-1/2 bg-muted rounded"/>
                            </CardHeader>
                            <CardContent>
                                <div className="h-20 w-full bg-muted rounded mb-4"/>
                                <div className="flex space-x-2">
                                    <div className="h-6 w-16 bg-muted rounded"/>
                                    <div className="h-6 w-20 bg-muted rounded"/>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : items && items.length > 0 ? (
                    items.map((item) => (
                            <Card
                                key={item.id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                data-testid="item-card"
                                onClick={() => handleItemClick(item)}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">
                                                {truncateText(item.text, 60)}
                                            </CardTitle>
                                            <CardDescription>
                                                {formatDate(item.created_at)}
                                            </CardDescription>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => handleDeleteClick(item, e)}
                                            className="h-8 w-8 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            aria-label="Delete item"
                                        >
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <p className="text-sm text-muted-foreground">
                                            {truncateText(item.text, 100)}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline">
                                                {item.locale}
                                            </Badge>
                                            <Badge
                                                className={getDifficultyColor(item.difficulty)}
                                            >
                                                {getDifficultyLabel(item.difficulty)}
                                            </Badge>
                                            <Badge
                                                className={getTTSStatusColor(item.tts_status)}
                                            >
                                                {getTTSStatusLabel(item.tts_status)}
                                            </Badge>
                                            <Badge
                                                className={getPracticedColor(item.practiced)}
                                            >
                                                {getPracticedLabel(item.practiced)}
                                            </Badge>
                                        </div>

                                        {item.tags && item.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {item.tags.slice(0, 3).map((tag) => (
                                                    <Badge key={tag} variant="secondary" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {item.tags.length > 3 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{item.tags.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-start pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={item.tts_status !== 'ready'}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    navigate(`/practice?item=${item.id}`)
                                                }}
                                            >
                                                <Play className="h-4 w-4 mr-2"/>
                                                Practice
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                ) : (
                    <div className="col-span-full">
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold">No items found</h3>
                                    <p className="text-muted-foreground mb-4">
                                        {Object.keys(filters).length > 0
                                            ? 'No items match your filter criteria'
                                            : 'Get started by creating your first dictation item'
                                        }
                                    </p>
                                    <Button onClick={() => setShowCreateDialog(true)}>
                                        <Plus className="h-4 w-4 mr-2"/>
                                        Create First Item
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        isLoading={isLoading}
                    />
                </div>
            )}

            {/* Dialogs */}
            <CreateItemDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={handleCreateSuccess}
            />

            <BulkCreateDialog
                open={showBulkDialog}
                onOpenChange={setShowBulkDialog}
                onSuccess={handleBulkCreateSuccess}
            />

            {selectedItem && (
                <ItemDetailsDialog
                    open={showDetailsDialog}
                    onOpenChange={setShowDetailsDialog}
                    item={selectedItem}
                    onUpdate={refetch}
                />
            )}

            {deleteItem && (
                <DeleteItemDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    item={deleteItem}
                    onSuccess={handleDeleteSuccess}
                />
            )}
        </div>
    )
}
