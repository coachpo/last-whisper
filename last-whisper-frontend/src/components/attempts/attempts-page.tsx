
import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {apiClient} from '@/lib/api'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {ChevronDown, Eye, Filter, Loader2, Play, Target, TrendingDown, TrendingUp} from 'lucide-react'
import {formatDate, formatScore, getDifficultyColor, getDifficultyLabel, getScoreColor, truncateText} from '@/lib/utils'
import {FilterOptions, FilterPanel} from './filter-panel'
import {Pagination} from '@/components/ui/pagination'
import {Attempt, AttemptsListParams} from '@/types/api'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'

export function AttemptsPage() {
  const navigate = useNavigate()
  const [selectedTab, setSelectedTab] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    page: 1,
    per_page: 20,
  })
  const [showAttemptDialog, setShowAttemptDialog] = useState(false)
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null)

  // Build API parameters - only include defined values
  const buildApiParams = (): AttemptsListParams => {
    const page = filters.page || 1
    const perPage = filters.per_page || 20
    const params: AttemptsListParams = {
      page,
      per_page: perPage,
    }

    if (filters.since && filters.since.trim()) {
      params.since = filters.since
    }

    if (filters.until && filters.until.trim()) {
      params.until = filters.until
    }

    if (filters.item_id) {
      params.item_id = filters.item_id
    }

    return params
  }

  const apiParams = buildApiParams()

  const { data: attemptsData, isLoading } = useQuery({
    queryKey: ['attempts', apiParams],
    queryFn: () => apiClient.getAttempts(apiParams),
  })

  const attemptDetailId = selectedAttempt?.id ?? null

  const { data: attemptDetailData, isFetching: isAttemptDetailFetching } = useQuery({
    queryKey: ['attempt-detail', attemptDetailId],
    queryFn: () => apiClient.getAttempt(attemptDetailId as number),
    enabled: showAttemptDialog && !!attemptDetailId,
  })

  const attempts = attemptsData?.attempts || []
  const total = attemptsData?.total || 0
  const currentPage = attemptsData?.page || filters.page || 1
  const totalPages = attemptsData?.total_pages || Math.ceil(total / (filters.per_page || 20))

  // Filter attempts based on tab (client-side filtering for performance categories)
  const filteredAttempts = attempts.filter(attempt => {
    return selectedTab === 'all' || 
      (selectedTab === 'excellent' && attempt.percentage >= 90) ||
      (selectedTab === 'good' && attempt.percentage >= 70 && attempt.percentage < 90) ||
      (selectedTab === 'needs-work' && attempt.percentage < 70)
  })

  // Calculate statistics
  const stats = {
    total: attempts.length,
    excellent: attempts.filter(a => a.percentage >= 90).length,
    good: attempts.filter(a => a.percentage >= 70 && a.percentage < 90).length,
    needsWork: attempts.filter(a => a.percentage < 70).length,
    average: attempts.length > 0 ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length : 0,
    best: attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage)) : 0,
    worst: attempts.length > 0 ? Math.min(...attempts.map(a => a.percentage)) : 0,
  }

  const attemptDetail = attemptDetailData ?? selectedAttempt

  const handleViewDetails = (attempt: Attempt) => {
    setSelectedAttempt(attempt)
    setShowAttemptDialog(true)
  }

  const handlePracticeItem = (itemId: number) => {
    navigate(`/practice?item=${itemId}`)
  }

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
  }

  const handleFilterReset = () => {
    const defaultFilters: FilterOptions = {
      page: 1,
      per_page: 20,
    }
    setFilters(defaultFilters)
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Practice Attempts</h1>
          <p className="text-muted-foreground">
            Review your dictation practice history
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Practice Attempts</h1>
        <p className="text-muted-foreground">
          Review your dictation practice history and track your progress
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Practice sessions
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
              {formatScore(stats.average)}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatScore(stats.best)}
            </div>
            <p className="text-xs text-muted-foreground">
              Personal best
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Work</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.needsWork}
            </div>
            <p className="text-xs text-muted-foreground">
              Below 70%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attempts List */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="excellent">Excellent ({stats.excellent})</TabsTrigger>
          <TabsTrigger value="good">Good ({stats.good})</TabsTrigger>
          <TabsTrigger value="needs-work">Needs Work ({stats.needsWork})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {/* Filter Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <CardTitle>Filter Attempts</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="transition-all duration-200"
                >
                  <ChevronDown className={`h-4 w-4 mr-2 transition-transform duration-200 ${
                    showFilters ? 'rotate-180' : 'rotate-0'
                  }`} />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>
            </CardHeader>
            
            {/* Collapsible Filter Content */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <CardContent className="pt-0">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onReset={handleFilterReset}
                  isLoading={isLoading}
                />
              </CardContent>
            </div>
          </Card>

          {/* Results Summary */}
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div>
              Showing {filteredAttempts.length} of {total} attempts
              {filters.item_id && ` for item #${filters.item_id}`}
              {filters.since && ` since ${new Date(filters.since).toLocaleDateString()}`}
              {filters.until && ` until ${new Date(filters.until).toLocaleDateString()}`}
            </div>
            <div>
              Page {currentPage} of {totalPages}
            </div>
          </div>

          {filteredAttempts.length > 0 ? (
            <div className="space-y-4">
              {filteredAttempts.map((attempt) => (
                <Card key={attempt.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Item Info */}
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            #{attempt.item_id}
                          </Badge>
                          {attempt.item && (
                            <>
                              <Badge variant="outline">
                                {attempt.item.locale}
                              </Badge>
                              <Badge className={getDifficultyColor(attempt.item.difficulty ?? 0)}>
                                {getDifficultyLabel(attempt.item.difficulty ?? 0)}
                              </Badge>
                            </>
                          )}
                          <Badge 
                            className={getScoreColor(attempt.percentage)}
                          >
                            {formatScore(attempt.percentage)}
                          </Badge>
                        </div>

                        {/* Original Text */}
                        {attempt.item && (
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">
                              Original Text:
                            </h4>
                            <p className="text-sm bg-muted p-2 rounded">
                              {truncateText(attempt.item.text, 150)}
                            </p>
                          </div>
                        )}

                        {/* User's Answer */}
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">
                            Your Answer:
                          </h4>
                          <p className="text-sm bg-muted p-2 rounded">
                            {truncateText(attempt.text, 150)}
                          </p>
                        </div>

                        {/* Performance Details */}
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Words Correct</p>
                            <p className="font-medium">
                              {attempt.words_correct} / {attempt.words_ref}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Word Error Rate</p>
                            <p className="font-medium">
                              {(attempt.wer * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Date</p>
                            <p className="font-medium">
                              {formatDate(attempt.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col space-y-2 ml-4">
                        {attempt.item && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePracticeItem(attempt.item_id)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Practice Again
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(attempt)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No attempts found</h3>
                  <p className="text-muted-foreground mb-4">
                    Start practicing to see your attempts here
                  </p>
                  <Button onClick={() => navigate('/practice')}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Practicing
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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

      <Dialog
        open={showAttemptDialog}
        onOpenChange={(open) => {
          setShowAttemptDialog(open)
          if (!open) {
            setSelectedAttempt(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[720px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Attempt #{attemptDetail?.id ?? '—'}
            </DialogTitle>
            <DialogDescription>
              {attemptDetail ? `Submitted ${formatDate(attemptDetail.created_at)}` : 'Detailed scoring data'}
            </DialogDescription>
          </DialogHeader>

          {isAttemptDetailFetching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Fetching latest data…</span>
            </div>
          )}

          {attemptDetail ? (
            <div className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className={`text-3xl font-semibold ${getScoreColor(attemptDetail.percentage)}`}>
                    {formatScore(attemptDetail.percentage)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Word error rate</p>
                  <p className="text-2xl font-semibold">{(attemptDetail.wer * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Words correct</p>
                  <p className="text-lg font-medium">
                    {attemptDetail.words_correct} / {attemptDetail.words_ref}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Item</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline">#{attemptDetail.item_id}</Badge>
                    {attemptDetail.item?.locale && (
                      <Badge variant="outline">{attemptDetail.item.locale}</Badge>
                    )}
                    {attemptDetail.item?.difficulty && (
                      <Badge className={getDifficultyColor(attemptDetail.item.difficulty)}>
                        {getDifficultyLabel(attemptDetail.item.difficulty)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {attemptDetail.item?.text && (
                <div>
                  <p className="text-sm font-medium mb-2">Original text</p>
                  <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {attemptDetail.item.text}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Your answer</p>
                <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                  {attemptDetail.text}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mt-4">
              Select an attempt to view details.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAttemptDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
