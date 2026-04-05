
import {Button} from '@/components/ui/button'
import {ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight} from 'lucide-react'

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    isLoading?: boolean
}

export function Pagination({currentPage, totalPages, onPageChange, isLoading}: PaginationProps) {
    if (totalPages <= 1) return null

    const getVisiblePages = () => {
        const delta = 2
        const range = []
        const rangeWithDots = []

        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i)
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...')
        } else {
            rangeWithDots.push(1)
        }

        rangeWithDots.push(...range)

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages)
        } else {
            rangeWithDots.push(totalPages)
        }

        return rangeWithDots
    }

    const visiblePages = getVisiblePages()

    return (
        <div className="flex items-center justify-center space-x-2">
            {/* First Page */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1 || isLoading}
            >
                <ChevronsLeft className="h-4 w-4"/>
            </Button>

            {/* Previous Page */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
            >
                <ChevronLeft className="h-4 w-4"/>
            </Button>

            {/* Page Numbers */}
            {visiblePages.map((page, index) => (
                <div key={index}>
                    {page === '...' ? (
                        <span className="px-3 py-1 text-muted-foreground">...</span>
                    ) : (
                        <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => typeof page === 'number' && onPageChange(page)}
                            disabled={isLoading}
                            className="min-w-[40px]"
                        >
                            {page}
                        </Button>
                    )}
                </div>
            ))}

            {/* Next Page */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
            >
                <ChevronRight className="h-4 w-4"/>
            </Button>

            {/* Last Page */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages || isLoading}
            >
                <ChevronsRight className="h-4 w-4"/>
            </Button>
        </div>
    )
}
