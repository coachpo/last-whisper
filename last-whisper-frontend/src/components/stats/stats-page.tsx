
import {useEffect, useMemo, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {apiClient} from '@/lib/api'
import {StatsProgressParams} from '@/types/api'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Activity, Award, BookOpen, Loader2, Play, Target, TrendingUp} from 'lucide-react'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {DatePicker} from '@/components/ui/date-picker'
import {Pagination} from '@/components/ui/pagination'
import {formatDate, formatScore, getDifficultyColor, getDifficultyLabel, getScoreColor, truncateText} from '@/lib/utils'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

type StatsTabValue = 'overview' | 'performance' | 'practice-log'

export function StatsPage() {
  const navigate = useNavigate()
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [progressRange, setProgressRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [activeTab, setActiveTab] = useState<StatsTabValue>('overview')
  const practiceLogPageSize = 10
  const [practiceLogPage, setPracticeLogPage] = useState(1)
  const [practiceLogSince, setPracticeLogSince] = useState<Date | undefined>()
  const [practiceLogUntil, setPracticeLogUntil] = useState<Date | undefined>()
  const [practiceLogFilters, setPracticeLogFilters] = useState<{ since?: string; until?: string }>({})

  const progressParams = useMemo<StatsProgressParams>(() => {
    const days = progressRange === '7d' ? 7 : progressRange === '30d' ? 30 : 90
    return { days }
  }, [progressRange])

  const { data: summaryStats, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['stats-summary'],
    queryFn: () => apiClient.getStatsSummary(),
  })

  const practiceLogParams = useMemo(() => ({
    page: practiceLogPage,
    per_page: practiceLogPageSize,
    ...practiceLogFilters,
  }), [practiceLogPage, practiceLogFilters])

  const { data: practiceLog, isLoading: logLoading, error: logError } = useQuery({
    queryKey: ['practice-log', practiceLogParams],
    queryFn: () => apiClient.getPracticeLog(practiceLogParams),
  })

  const { data: attemptsData, isLoading: attemptsLoading, error: attemptsError } = useQuery({
    queryKey: ['attempts', 'all'],
    queryFn: async () => {
      let page = 1
      const per_page = 100
      let attempts: NonNullable<Awaited<ReturnType<typeof apiClient.getAttempts>>>['attempts'] = []

      // fetch all pages to avoid truncating stats
      // API enforces per_page <= 100; loop until all pages are loaded
      // stop if backend returns unexpected shape
      for (;;) {
        const result = await apiClient.getAttempts({ page, per_page })
        attempts = attempts.concat(result.attempts ?? [])
        const totalPages = result.total_pages ?? 1
        if (page >= totalPages) break
        page += 1
      }

      return { attempts }
    },
  })

  const { data: progressData, isLoading: progressLoading, error: progressError } = useQuery({
    queryKey: ['stats-progress', progressRange],
    queryFn: () => apiClient.getStatsProgress(progressParams),
  })

  const applyPracticeLogFilters = () => {
    setPracticeLogFilters({
      since: practiceLogSince ? practiceLogSince.toISOString() : undefined,
      until: practiceLogUntil ? practiceLogUntil.toISOString() : undefined,
    })
    setPracticeLogPage(1)
  }

  const resetPracticeLogFilters = () => {
    setPracticeLogSince(undefined)
    setPracticeLogUntil(undefined)
    setPracticeLogFilters({})
    setPracticeLogPage(1)
  }

  const attempts = attemptsData?.attempts || []
  const practiceLogEntries = useMemo(() => practiceLog?.practice_log || [], [practiceLog?.practice_log])
  const practiceLogTotal = practiceLog?.total || 0
  const practiceLogTotalPages = practiceLog?.total_pages ?? 1

  useEffect(() => {
    if (!selectedItemId && practiceLogEntries.length > 0) {
      setSelectedItemId(practiceLogEntries[0].item_id)
    }
  }, [practiceLogEntries, selectedItemId])

  const { data: itemStatsData, isFetching: isItemStatsFetching, error: itemStatsError } = useQuery({
    queryKey: ['stats-item', selectedItemId],
    queryFn: () => apiClient.getItemStats(selectedItemId as number),
    enabled: !!selectedItemId,
  })

  if (summaryLoading || logLoading || attemptsLoading || progressLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Statistics</h1>
          <p className="text-muted-foreground">
            Track your dictation practice progress
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Show error state if any API calls failed
  if (summaryError || logError || attemptsError || progressError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Statistics</h1>
          <p className="text-muted-foreground">
            Track your dictation practice progress
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Error loading statistics</h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading your practice statistics. Please try again.
              </p>
              <div className="text-sm text-red-600 space-y-1">
                {summaryError && <p>Summary stats error: {summaryError.message}</p>}
                {logError && <p>Practice log error: {logError.message}</p>}
                {attemptsError && <p>Attempts error: {attemptsError.message}</p>}
                {progressError && <p>Progress error: {progressError.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Prepare chart data
  const scoreDistribution = [
      {
          name: 'Excellent (90-100%)',
          value: attempts.filter(a => a.percentage >= 90).length,
          color: 'hsl(var(--success))'
      },
      {
          name: 'Good (70-89%)',
          value: attempts.filter(a => a.percentage >= 70 && a.percentage < 90).length,
          color: 'hsl(var(--warning))'
      },
      {
          name: 'Needs Work (<70%)',
          value: attempts.filter(a => a.percentage < 70).length,
          color: 'hsl(var(--destructive))'
      },
  ]

  const progressPoints = progressData?.progress || []
  const progressChartData = progressPoints.map((point) => ({
    date: new Date(point.date).toLocaleDateString(),
    score: Math.round(point.avg_percentage),
    attempts: point.attempts,
  }))

  // Difficulty performance
  const difficultyStats = practiceLogEntries.reduce((acc, entry) => {
    const key = entry.difficulty
    if (!acc[key]) {
      acc[key] = { difficulty: key, attempts: 0, averageScore: 0, totalScore: 0 }
    }
    acc[key].attempts += entry.attempt_count
    acc[key].totalScore += entry.average_score * entry.attempt_count
    acc[key].averageScore = acc[key].totalScore / acc[key].attempts
    return acc
  }, {} as Record<number, { difficulty: number; attempts: number; averageScore: number; totalScore: number }>)

  const difficultyChartData = Object.values(difficultyStats).map(stat => ({
    difficulty: getDifficultyLabel(stat.difficulty),
    averageScore: Math.round(stat.averageScore),
    attempts: stat.attempts,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Statistics</h1>
        <p className="text-muted-foreground">
          Track your dictation practice progress and performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats?.total_attempts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Practice sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Practiced</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats?.unique_items_practiced || 0}</div>
            <p className="text-xs text-muted-foreground">
              Unique items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats?.average_score ? formatScore(summaryStats.average_score) : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats?.best_score !== undefined ? formatScore(summaryStats.best_score) : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Personal best
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as StatsTabValue)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="practice-log">Practice Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>
                  Breakdown of your performance levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={scoreDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Performance Trend */}
            <Card>
              <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Recent Performance</CardTitle>
                  <CardDescription>
                    Backend progress series over the selected range
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="progress-range" className="text-sm text-muted-foreground">
                    Range
                  </Label>
                  <Select value={progressRange} onValueChange={(value) => setProgressRange(value as '7d' | '30d' | '90d')}>
                    <SelectTrigger id="progress-range" className="w-[140px]">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {progressChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={progressChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Average score']}
                        labelFormatter={(label, payload) => {
                          const attemptsForPoint = payload?.[0]?.payload?.attempts
                          return attemptsForPoint ? `${label} · Attempts: ${attemptsForPoint}` : label
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score"
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4}}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No progress data for this range yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Per-item insights</CardTitle>
              <CardDescription>
                Select an item to inspect consolidated stats from the backend.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {practiceLogEntries.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  You need at least one practiced item to view these insights.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="item-stat-select">Item</Label>
                    <Select
                      value={selectedItemId ? selectedItemId.toString() : undefined}
                      onValueChange={(value) => setSelectedItemId(parseInt(value))}
                    >
                      <SelectTrigger id="item-stat-select">
                        <SelectValue placeholder="Choose an item" />
                      </SelectTrigger>
                      <SelectContent>
                        {practiceLogEntries.map((entry) => (
                          <SelectItem key={entry.item_id} value={entry.item_id.toString()}>
                            #{entry.item_id} · {truncateText(entry.text, 40)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {itemStatsError && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                      {itemStatsError instanceof Error ? itemStatsError.message : 'Failed to load item stats.'}
                    </div>
                  )}

                  {isItemStatsFetching && !itemStatsData ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading item statistics…</span>
                    </div>
                  ) : itemStatsData ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Attempts</p>
                          <p className="text-2xl font-semibold">{itemStatsData.attempts_count}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Average score</p>
                          <p className="text-2xl font-semibold text-primary">
                            {formatScore(itemStatsData.avg_percentage)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Best score</p>
                          <p className="text-2xl font-semibold text-green-600">
                            {formatScore(itemStatsData.best_percentage)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Worst score</p>
                          <p className="text-2xl font-semibold text-destructive">
                            {formatScore(itemStatsData.worst_percentage)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last practiced</p>
                          <p className="text-base font-medium">
                            {itemStatsData.last_attempt_at
                              ? formatDate(itemStatsData.last_attempt_at)
                              : 'Never'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Difficulty & locale</p>
                          <div className="flex flex-wrap gap-2">
                            {itemStatsData.difficulty && (
                              <Badge className={getDifficultyColor(itemStatsData.difficulty)}>
                                {getDifficultyLabel(itemStatsData.difficulty)}
                              </Badge>
                            )}
                            {itemStatsData.locale && (
                              <Badge variant="outline">{itemStatsData.locale}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {itemStatsData.text && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Prompt</p>
                          <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                            {truncateText(itemStatsData.text, 180)}
                          </p>
                        </div>
                      )}

                      {itemStatsData.tags && itemStatsData.tags.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Tags</p>
                          <div className="flex flex-wrap gap-2">
                            {itemStatsData.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Select an item to view stats.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {/* Difficulty Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Difficulty</CardTitle>
                <CardDescription>
                  How well you perform at different difficulty levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={difficultyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="difficulty" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Average Score']}
                    />
                      <Bar dataKey="averageScore" fill="hsl(var(--primary))"/>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Performance Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Best Performance</span>
                    <Badge className="bg-green-100 text-green-800">
                      {summaryStats?.best_score !== undefined ? formatScore(summaryStats.best_score) : 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Worst Performance</span>
                    <Badge className="bg-red-100 text-red-800">
                      {summaryStats?.worst_score !== undefined ? formatScore(summaryStats.worst_score) : 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Practice Time</span>
                    <Badge variant="outline">
                      {summaryStats?.total_practice_time_minutes || 0} min
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Activity Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Items</span>
                    <Badge variant="outline">
                      {practiceLogEntries.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Most Practiced</span>
                    <Badge variant="outline">
                      {practiceLogEntries.length > 0 
                        ? Math.max(...practiceLogEntries.map(e => e.attempt_count))
                        : 0
                      } times
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average per Item</span>
                    <Badge variant="outline">
                      {practiceLogEntries.length > 0
                        ? Math.round(practiceLogEntries.reduce((sum, e) => sum + e.attempt_count, 0) / practiceLogEntries.length)
                        : 0
                      } attempts
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="practice-log" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Practice Filters</CardTitle>
              <CardDescription>Use server-side filters to narrow the log.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Since</Label>
                  <DatePicker
                    value={practiceLogSince}
                    onChange={setPracticeLogSince}
                    placeholder="Start date"
                    disabled={logLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Until</Label>
                  <DatePicker
                    value={practiceLogUntil}
                    onChange={setPracticeLogUntil}
                    placeholder="End date"
                    disabled={logLoading}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={applyPracticeLogFilters} disabled={logLoading}>
                  Apply filters
                </Button>
                <Button variant="outline" onClick={resetPracticeLogFilters} disabled={logLoading}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Practice Log</CardTitle>
              <CardDescription>
                Detailed breakdown of your practice by item ({practiceLogTotal} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {practiceLogEntries.length > 0 ? (
                <div className="space-y-4">
                  {practiceLogEntries.map((entry) => (
                    <div key={entry.item_id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">
                            {truncateText(entry.text, 80)}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{entry.locale}</Badge>
                            <Badge className={getDifficultyColor(entry.difficulty)}>
                              {getDifficultyLabel(entry.difficulty)}
                            </Badge>
                            {entry.tags && entry.tags.length > 0 && (
                              <Badge variant="secondary">
                                {entry.tags[0]}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/practice?item=${entry.item_id}`)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Practice
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Attempts</p>
                          <p className="font-medium">{entry.attempt_count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Best Score</p>
                          <p className={`font-medium ${getScoreColor(entry.best_score)}`}>
                            {formatScore(entry.best_score)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Average Score</p>
                          <p className={`font-medium ${getScoreColor(entry.average_score)}`}>
                            {formatScore(entry.average_score)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Practiced</p>
                          <p className="font-medium">
                            {entry.last_practiced_at 
                              ? formatDate(entry.last_practiced_at)
                              : 'Never'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {practiceLogTotalPages > 1 && (
                    <Pagination
                      currentPage={practiceLogPage}
                      totalPages={practiceLogTotalPages}
                      onPageChange={setPracticeLogPage}
                      isLoading={logLoading}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No practice data</h3>
                  <p className="text-muted-foreground mb-4">
                    Start practicing to see your detailed progress here
                  </p>
                  <Button onClick={() => navigate('/practice')}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Practicing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
