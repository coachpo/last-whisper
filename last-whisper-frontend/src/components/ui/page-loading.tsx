
import {cn} from '@/lib/utils'

interface PageLoadingProps {
    isLoading: boolean
    className?: string
}

export function PageLoading({isLoading, className}: PageLoadingProps) {
    if (!isLoading) return null

    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className={cn(
            "absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm",
            className
        )}
        >
            <div className="flex flex-col items-center space-y-4">
                {/* Spinning loader */}
                <div className="relative">
                    <div
                        className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
                    <div
                        className="absolute inset-0 h-12 w-12 animate-ping rounded-full border-2 border-primary/30"></div>
                </div>

                {/* Loading text */}
                <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Loading page...</p>
                    <p className="text-xs text-muted-foreground">Please wait</p>
                    <span className="sr-only">Content is loading</span>
                </div>
            </div>
        </div>
    )
}
