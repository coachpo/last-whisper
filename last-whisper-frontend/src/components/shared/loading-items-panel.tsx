
import {Card, CardHeader} from '@/components/ui/card'
import {Skeleton} from '@/components/ui/skeleton'

interface LoadingItemsPanelProps {
    title: string
    description: string
    loadingMessage?: string
    className?: string
}

export function LoadingItemsPanel({
                                      title,
                                      description,
                                      loadingMessage = "Loading items...",
                                      className = ""
                                  }: LoadingItemsPanelProps) {
    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        {description}
                    </p>
                </div>
            </div>

            {loadingMessage && (
                <p className="text-sm text-muted-foreground" aria-live="polite">
                    {loadingMessage}
                </p>
            )}

            {/* Loading Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {[...Array(8)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader>
                            <Skeleton className="h-4 w-3/4 mb-2"/>
                            <Skeleton className="h-3 w-1/2"/>
                        </CardHeader>
                        <div className="p-6 pt-0 space-y-4">
                            <Skeleton className="h-20 w-full"/>
                            <div className="flex gap-2">
                                <Skeleton className="h-5 w-16 rounded-full"/>
                                <Skeleton className="h-5 w-16 rounded-full"/>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
