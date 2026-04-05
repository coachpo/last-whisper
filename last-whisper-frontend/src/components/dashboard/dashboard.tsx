
import React from 'react'
import {useQuery} from '@tanstack/react-query'
import {apiClient} from '@/lib/api'
import {debug} from '@/lib/debug'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {ArrowRight, BarChart3, BookOpen, Clock, Play, Target, Trophy} from 'lucide-react'
import {Link} from 'react-router-dom'
import {
  formatScore,
  getDifficultyColor,
  getDifficultyLabel,
  cn
} from '@/lib/utils'

export function Dashboard() {
    const {data: stats, isLoading: statsLoading, error: statsError} = useQuery({
    queryKey: ['stats-summary'],
    queryFn: () => apiClient.getStatsSummary(),
  })

    const {data: items, isLoading: itemsLoading, error: itemsError} = useQuery({
      queryKey: ['items', {per_page: 5}],
      queryFn: () => apiClient.getItems({per_page: 5}),
  })

    const {data: attempts, isLoading: attemptsLoading, error: attemptsError} = useQuery({
      queryKey: ['attempts', {per_page: 5}],
      queryFn: () => apiClient.getAttempts({per_page: 5}),
  })

    // Debug logging
    React.useEffect(() => {
        if (stats) debug.component.dataLoaded('Dashboard', {type: 'stats', data: stats})
        if (statsError) debug.component.error('Dashboard', {type: 'stats', error: statsError})
    }, [stats, statsError])

    React.useEffect(() => {
        if (items) debug.component.dataLoaded('Dashboard', {type: 'items', data: items})
        if (itemsError) debug.component.error('Dashboard', {type: 'items', error: itemsError})
    }, [items, itemsError])

    React.useEffect(() => {
        if (attempts) debug.component.dataLoaded('Dashboard', {type: 'attempts', data: attempts})
        if (attemptsError) debug.component.error('Dashboard', {type: 'attempts', error: attemptsError})
    }, [attempts, attemptsError])

  if (statsLoading || itemsLoading || attemptsLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-foreground shadow-xl md:px-12 md:py-16">
        <div className="relative z-10 max-w-2xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Ready to practice?
          </h1>
          <p className="text-lg text-primary-foreground/90 md:text-xl">
            You&#39;ve completed {stats?.total_attempts || 0} sessions so far. Keep the momentum going!
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" variant="secondary" className="h-12 px-8 text-base font-semibold text-primary shadow-sm hover:bg-secondary/90">
              <Link to="/practice">
                <Play className="mr-2 h-5 w-5 fill-current" />
                Start Session
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/items">
                Browse Library
              </Link>
            </Button>
          </div>
        </div>
        {/* Decorative background pattern */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute -bottom-24 right-12 h-80 w-80 rounded-full bg-primary-foreground/10 blur-3xl" />
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Attempts"
          value={stats?.total_attempts || 0}
          icon={Trophy}
          description="Lifetime sessions"
        />
        <StatsCard
          title="Unique Items"
          value={stats?.unique_items_practiced || 0}
          icon={BookOpen}
          description="Stories learned"
        />
        <StatsCard
          title="Average Score"
          value={stats?.average_score ? formatScore(stats.average_score) : '0%'}
          icon={BarChart3}
          description="Overall accuracy"
        />
        <StatsCard
          title="Best Score"
          value={stats?.best_score ? formatScore(stats.best_score) : '0%'}
          icon={Target}
          description="Personal record"
        />
      </div>

      {/* Activity Feed */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">New Arrivals</CardTitle>
              <CardDescription>Latest dictation items added to library</CardDescription>
            </div>
            <Link to="/items" className="text-sm font-medium text-primary hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent className="px-0">
            {items?.items && items.items.length > 0 ? (
              <div className="divide-y">
                {items.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {item.text.length > 50 ? `${item.text.substring(0, 50)}...` : item.text}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="uppercase">{item.locale}</span>
                        <span>•</span>
                        <span className={getDifficultyColor(item.difficulty ?? 0)}>{getDifficultyLabel(item.difficulty ?? 0)}</span>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="ghost" className="shrink-0">
                      <Link to={`/items?id=${item.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No items found" />
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Recent Activity</CardTitle>
              <CardDescription>Your latest practice history</CardDescription>
            </div>
            <Link to="/attempts" className="text-sm font-medium text-primary hover:underline">
              View History
            </Link>
          </CardHeader>
          <CardContent className="px-0">
            {attempts?.attempts && attempts.attempts.length > 0 ? (
              <div className="divide-y">
                {attempts.attempts.map((attempt) => (
                  <div key={attempt.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      attempt.percentage >= 80 ? "bg-success/10 text-success" :
                      attempt.percentage >= 50 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                    )}>
                      <span className="text-xs font-bold">{formatScore(attempt.percentage)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {attempt.text ? attempt.text : 'Unknown item'}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(attempt.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No activity yet" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

type IconComponent = React.ComponentType<{className?: string}>

function StatsCard({ title, value, icon: Icon, description }: { title: string; value: string | number; icon: IconComponent; description: string }) {
  return (
    <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
      <p>{message}</p>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-64 w-full animate-pulse rounded-3xl bg-muted" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-96 rounded-xl bg-muted animate-pulse" />
        <div className="h-96 rounded-xl bg-muted animate-pulse" />
      </div>
    </div>
  )
}
