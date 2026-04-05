
import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {apiClient} from '@/lib/api'
import {debug} from '@/lib/debug'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Clock, Download, Globe, Play, RefreshCw, Tag, Target, Trash2, Volume2, AlertTriangle, Info, Loader2, RotateCcw} from 'lucide-react'
import {formatDate, getDifficultyColor, getDifficultyLabel, getTTSStatusColor, getTTSStatusLabel} from '@/lib/utils'
import {Item, ItemTTSStatusResponse, Translation} from '@/types/api'
import {AudioPlayer} from '../audio/audio-player'
import {useToast} from '@/components/ui/use-toast'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {TagSelector} from '@/components/tags/tag-selector'
import {useMetadata} from '@/contexts/metadata-context'

interface ItemDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item
  onUpdate: () => void
}

export function ItemDetailsDialog({ open, onOpenChange, item, onUpdate }: ItemDetailsDialogProps) {
  const navigate = useNavigate()
  const { translationOptions, limits, ttsServiceAvailable } = useMetadata()
  const isTtsOffline = ttsServiceAvailable === false
  const [activeTab, setActiveTab] = useState('details')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentTags, setCurrentTags] = useState<string[]>(item.tags || [])
  const [tagInput, setTagInput] = useState<string[]>(item.tags || [])
  const [currentDifficulty, setCurrentDifficulty] = useState<number | null>(item.difficulty)
  const [difficultyInput, setDifficultyInput] = useState<number | null>(item.difficulty)
  const [isRefreshingAudio, setIsRefreshingAudio] = useState(false)
  const [targetLang, setTargetLang] = useState<string>(() => {
    const alternative = translationOptions.find((lang) => lang.value !== item.locale)
    return alternative?.value ?? translationOptions[0]?.value ?? 'en'
  })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    setCurrentTags(item.tags || [])
    setTagInput(item.tags || [])
    setCurrentDifficulty(item.difficulty)
    setDifficultyInput(item.difficulty)
    const alternative = translationOptions.find((lang) => lang.value !== item.locale)
    setTargetLang(alternative?.value ?? translationOptions[0]?.value ?? 'en')
  }, [item, translationOptions])

  useEffect(() => {
    if (!translationOptions.length) {
      return
    }
    setTargetLang(prev => {
      if (translationOptions.some(option => option.value === prev)) {
        return prev
      }
      return translationOptions[0]?.value ?? prev
    })
  }, [translationOptions])

  const {
    data: ttsStatusData,
    isLoading: isTtsStatusLoading,
    isFetching: isTtsStatusFetching,
    refetch: refetchTtsStatus,
    error: ttsStatusError
  } = useQuery<ItemTTSStatusResponse>({
    queryKey: ['item-tts-status', item.id],
    queryFn: () => apiClient.getItemTTSStatus(item.id),
    enabled: open,
    refetchInterval: (query) => {
      const status = query.state.data?.tts_status ?? item.tts_status
      return status === 'ready' ? false : 10000
    }
  })

  const derivedTtsStatus = ttsStatusData?.tts_status ?? item.tts_status
  const translationQueryKey = ['item-translation', item.id, targetLang]

  const {
    data: translation,
    isLoading: isTranslationLoading,
    isFetching: isTranslationFetching,
    refetch: refetchTranslation,
    error: translationError
  } = useQuery<Translation | null>({
    queryKey: translationQueryKey,
    queryFn: () => apiClient.getCachedTranslation(item.id, targetLang),
    enabled: open && !!targetLang,
    retry: false,
  })

  const translateMutation = useMutation({
    mutationFn: (options?: { forceRefresh?: boolean }) =>
      apiClient.translateItem(item.id, { target_lang: targetLang, force_refresh: options?.forceRefresh }),
    onSuccess: (result, variables) => {
      queryClient.setQueryData(translationQueryKey, result)
      toast({
        title: variables?.forceRefresh ? 'Translation refreshed' : 'Translation ready',
        description: result.cached ? 'Returned from cache.' : 'Fetched fresh translation.',
      })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to translate item.'
      toast({
        title: 'Translation failed',
        description: message,
        variant: 'destructive',
      })
    }
  })

  const refreshTranslationMutation = useMutation({
    mutationFn: async () => {
      if (translation?.translation_id) {
        return apiClient.refreshTranslation(translation.translation_id)
      }
      return apiClient.translateItem(item.id, { target_lang: targetLang, force_refresh: true })
    },
    onSuccess: (result) => {
      queryClient.setQueryData(translationQueryKey, result)
      toast({
        title: 'Translation refreshed',
        description: result.cached ? 'Loaded from cache.' : 'Fetched fresh translation.',
      })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to refresh translation.'
      toast({
        title: 'Refresh failed',
        description: message,
        variant: 'destructive',
      })
    }
  })

  const isTranslationBusy = isTranslationLoading || isTranslationFetching || translateMutation.isPending || refreshTranslationMutation.isPending

  const ensureValidTargetLanguage = () => {
    if (targetLang === item.locale) {
      toast({
        title: 'Choose a different language',
        description: 'Target language must differ from the item locale.',
        variant: 'destructive',
      })
      return false
    }
    return true
  }

  const normalizeTags = (tags: string[]) => [...tags].sort((a, b) => a.localeCompare(b))
  const areTagsEqual = (left: string[], right: string[]) => {
    if (left.length !== right.length) {
      return false
    }
    const normalizedLeft = normalizeTags(left)
    const normalizedRight = normalizeTags(right)
    return normalizedLeft.every((tag, index) => tag === normalizedRight[index])
  }

  const tagsDirty = !areTagsEqual(tagInput, currentTags)
  const difficultyDirty = difficultyInput !== currentDifficulty
  const isDifficultyValid = typeof difficultyInput === 'number' && difficultyInput >= 1 && difficultyInput <= 5

  const renderTimestamp = (label: string, value?: string) => (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ? formatDate(value) : '—'}</p>
    </div>
  )

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      onUpdate()
      onOpenChange(false)
      setShowDeleteDialog(false)
    },
    onError: (error) => {
      debug.error('Failed to delete item:', error)
    }
  })

  const updateDifficultyMutation = useMutation({
    mutationFn: (nextDifficulty: number) => apiClient.updateItemDifficulty(item.id, { difficulty: nextDifficulty }),
    onSuccess: (result) => {
      setCurrentDifficulty(result.current_difficulty)
      setDifficultyInput(result.current_difficulty)
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['stats-summary'] })
      toast({
        title: 'Difficulty updated',
        description: 'Difficulty level saved successfully.',
      })
      onUpdate()
    },
    onError: (error: unknown) => {
      debug.error('Failed to update difficulty:', error)
      toast({
        title: 'Difficulty update failed',
        description: error instanceof Error ? error.message : 'Failed to update difficulty. Please try again.',
        variant: 'destructive',
      })
    }
  })

  const updateTagsMutation = useMutation({
    mutationFn: (tags: string[]) => apiClient.updateItemTags(item.id, { tags }),
    onSuccess: (result) => {
      setCurrentTags(result.current_tags || [])
      setTagInput(result.current_tags || [])
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['stats-summary'] })
      toast({
        title: 'Tags updated',
        description: 'Tags saved successfully.',
      })
      onUpdate()
    },
    onError: (error: unknown) => {
      debug.error('Failed to update tags:', error)
      toast({
        title: 'Tag update failed',
        description: error instanceof Error ? error.message : 'Failed to update tags. Please try again.',
        variant: 'destructive',
      })
    }
  })

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    deleteItemMutation.mutate(item.id)
  }

  const handleDifficultySelection = (value: string) => {
    const parsed = Number(value)
    setDifficultyInput(Number.isNaN(parsed) ? currentDifficulty : parsed)
  }

  const handleSaveDifficulty = () => {
    if (!difficultyDirty || !isDifficultyValid || difficultyInput === null) {
      return
    }
    updateDifficultyMutation.mutate(difficultyInput)
  }

  const handleSaveTags = () => {
    if (!tagsDirty) {
      return
    }
    if (tagInput.length > limits.maxTagsPerItem) {
      toast({
        title: 'Too many tags',
        description: `You can only attach up to ${limits.maxTagsPerItem} tags per item.`,
        variant: 'destructive',
      })
      return
    }
    if (tagInput.some(tag => tag.length > limits.maxTagLength)) {
      toast({
        title: 'Tag too long',
        description: `Tags must be ${limits.maxTagLength} characters or less.`,
        variant: 'destructive',
      })
      return
    }
    updateTagsMutation.mutate(tagInput)
  }

  const handleResetTags = () => {
    setTagInput(currentTags)
  }

  const handlePractice = () => {
    navigate(`/practice?item=${item.id}`)
  }

  const handleDownload = async () => {
    try {
      const audioBlob = await apiClient.getItemAudio(item.id)
      const url = URL.createObjectURL(audioBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dictation-${item.id}.wav`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({
        title: "Download started",
        description: "Audio file download has started.",
      })
    } catch (error: unknown) {
      debug.error('Failed to download audio:', error)
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download audio file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRegenerate = async () => {
    if (isTtsOffline) {
      toast({
        title: 'Audio generation unavailable',
        description: 'TTS workers are offline. Please try again once they recover.',
        variant: 'destructive',
      })
      return
    }
    try {
      setIsRefreshingAudio(true)
      const response = await apiClient.refreshItemAudio(item.id)
      toast({
        title: 'Audio refresh queued',
        description: `Task ${response.task_id} started. Status: ${response.status}.`,
      })
      void refetchTtsStatus()
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: error instanceof Error ? error.message : 'Could not refresh audio. Please retry.',
        variant: 'destructive',
      })
    } finally {
      setIsRefreshingAudio(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Item Details</span>
            <Badge variant="outline">#{item.id}</Badge>
          </DialogTitle>
          <DialogDescription>
            View and manage this dictation item
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="translations">Translations</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Text</h4>
                  <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {item.text}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Language</h4>
                    <Badge variant="outline">{item.locale}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Difficulty</h4>
                    <Badge className={getDifficultyColor(currentDifficulty)}>
                      {getDifficultyLabel(currentDifficulty)}
                    </Badge>
                  </div>
                </div>

                {currentTags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <Tag className="h-4 w-4" />
                      <span>Tags</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentTags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Created</span>
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <Target className="h-4 w-4" />
                      <span>Status</span>
                    </h4>
                    <Badge
                        className={getTTSStatusColor(derivedTtsStatus)}
                    >
                      {getTTSStatusLabel(derivedTtsStatus)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Manage Metadata</CardTitle>
                    <CardDescription>Adjust difficulty and tags after creation.</CardDescription>
                  </div>
                  {(difficultyDirty || tagsDirty) && (
                    <Badge variant="outline">Unsaved changes</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Difficulty</h4>
                      <p className="text-sm text-muted-foreground">
                        Current level: {getDifficultyLabel(currentDifficulty)}
                      </p>
                    </div>
                    <Badge className={getDifficultyColor(currentDifficulty)}>
                      {getDifficultyLabel(currentDifficulty)}
                    </Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                    <div className="space-y-2">
                      <Label htmlFor="difficulty-select">Adjust difficulty</Label>
                      <Select value={difficultyInput !== null ? difficultyInput.toString() : undefined} onValueChange={handleDifficultySelection}>
                        <SelectTrigger id="difficulty-select">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          {['1', '2', '3', '4', '5'].map((value) => (
                            <SelectItem key={value} value={value}>
                              {value} - {getDifficultyLabel(Number(value))}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleSaveDifficulty}
                        disabled={!difficultyDirty || !isDifficultyValid || updateDifficultyMutation.isPending}
                      >
                        {updateDifficultyMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDifficultyInput(currentDifficulty)}
                        disabled={!difficultyDirty || updateDifficultyMutation.isPending}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Tags</h4>
                    <p className="text-sm text-muted-foreground">
                      Current tags: {currentTags.length > 0 ? currentTags.length : 'None'}
                    </p>
                  </div>
                  <TagSelector
                    selectedTags={tagInput}
                    onTagsChange={setTagInput}
                    placeholder="Select or add tags..."
                    disabled={updateTagsMutation.isPending}
                    maxTags={limits.maxTagsPerItem}
                    maxTagLength={limits.maxTagLength}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleSaveTags}
                      disabled={!tagsDirty || updateTagsMutation.isPending}
                    >
                      {updateTagsMutation.isPending ? 'Saving...' : 'Save tags'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetTags}
                      disabled={!tagsDirty || updateTagsMutation.isPending}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
            </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="translations" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Translations</span>
                    </CardTitle>
                    <CardDescription>Cache-first item-bound translations.</CardDescription>
                  </div>
                  {translation?.cached !== undefined && (
                    <Badge variant={translation.cached ? 'secondary' : 'default'}>
                      {translation.cached ? 'Cached' : 'Fresh from provider'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="translation-target">Target language</Label>
                    <Select value={targetLang} onValueChange={setTargetLang}>
                      <SelectTrigger id="translation-target">
                        <SelectValue placeholder="Choose language" />
                      </SelectTrigger>
                      <SelectContent>
                        {translationOptions.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value} disabled={lang.value === item.locale}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      onClick={() => {
                        if (!ensureValidTargetLanguage()) return
                        translateMutation.mutate({})
                      }}
                      disabled={isTranslationBusy}
                    >
                      {translateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Translating…
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {translation ? 'Update' : 'Translate'}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!ensureValidTargetLanguage()) return
                        refreshTranslationMutation.mutate()
                      }}
                      disabled={isTranslationBusy}
                    >
                      {refreshTranslationMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Refreshing…
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Force refresh
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void refetchTranslation()}
                      disabled={isTranslationBusy}
                    >
                      Check cache
                    </Button>
                  </div>
                </div>

                {translationError && (
                  <div className="flex items-start space-x-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <span>{translationError instanceof Error ? translationError.message : 'Failed to load translation.'}</span>
                  </div>
                )}

                {isTranslationLoading || isTranslationFetching ? (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground" aria-live="polite">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading translation…</span>
                  </div>
                ) : translation ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {(translation.source_lang || item.locale || 'unknown').toUpperCase()} → {(translation.target_lang || targetLang || 'unknown').toUpperCase()}
                      </Badge>
                      <Badge variant={translation.cached ? 'secondary' : 'default'}>
                        {translation.cached ? 'Cached' : 'Fresh'}
                      </Badge>
                      <Badge variant="outline">{translation.provider}</Badge>
                      <Badge variant="outline">{translation.status}</Badge>
                    </div>
                    <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                      {translation.translated_text}
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-4">
                      <span>Updated {formatDate(translation.updated_at)}</span>
                      <span>Last refreshed {translation.last_refreshed_at ? formatDate(translation.last_refreshed_at) : '—'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground" aria-live="polite">
                    No cached translation for {targetLang.toUpperCase()} yet. Translate to fetch one. 404s are treated as missing rather than errors.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Volume2 className="h-4 w-4" />
                  <span>Audio Player</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {derivedTtsStatus === 'ready' ? (
                  <div className="space-y-4" aria-live="polite">
                    <AudioPlayer
                      itemId={item.id}
                      onRefreshAudio={handleRegenerate}
                      refreshLoading={isRefreshingAudio}
                      refreshDisabled={isTtsOffline}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download audio
                      </Button>
                    </div>
                  </div>
                ) : derivedTtsStatus === 'pending' || derivedTtsStatus === 'processing' ? (
                  <div className="flex items-center gap-3" aria-live="polite">
                    <Loader2 className="h-5 w-5 animate-spin text-info" />
                    <span className="text-sm text-muted-foreground">
                      {derivedTtsStatus === 'processing'
                        ? 'Audio is being processed. Hang tight.'
                        : 'Audio is being generated. Hang tight.'}
                    </span>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 space-y-3" aria-live="polite" role="alert">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Audio not available</span>
                    </div>
                    <p className="text-sm text-muted-foreground">We couldn’t load the audio. Try again or regenerate.</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => void refetchTtsStatus()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Check status
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleRegenerate}
                        disabled={isTtsOffline || isRefreshingAudio}
                        title={isTtsOffline ? 'Audio generation unavailable' : undefined}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Refresh Audio
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>TTS status snapshot</span>
                </CardTitle>
                <CardDescription>
                  Latest metadata returned by the speech backend for this item.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isTtsStatusLoading ? (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading latest status…</span>
                  </div>
                ) : ttsStatusError ? (
                  <div className="flex items-start space-x-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <span>{ttsStatusError instanceof Error ? ttsStatusError.message : 'Failed to load TTS status.'}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={getTTSStatusColor(derivedTtsStatus)}>
                        {getTTSStatusLabel(derivedTtsStatus)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Last updated {ttsStatusData?.updated_at ? formatDate(ttsStatusData.updated_at) : '—'}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void refetchTtsStatus()}
                        disabled={isTtsStatusFetching}
                      >
                        {isTtsStatusFetching ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Refreshing
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="rounded-md border bg-muted/30 p-3 text-sm">
                      <p className="text-xs uppercase text-muted-foreground mb-1">Current text snapshot</p>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {ttsStatusData?.text ?? item.text}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {renderTimestamp('Created', ttsStatusData?.created_at ?? item.created_at)}
                      {renderTimestamp('Snapshot updated', ttsStatusData?.updated_at ?? item.updated_at)}
                    </div>

                    {derivedTtsStatus !== 'ready' && (
                      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground" aria-live="polite" role="status">
                        {derivedTtsStatus === 'pending' && 'Audio generation has not started yet. This usually resolves within a few minutes.'}
                        {derivedTtsStatus === 'processing' && 'Audio is being processed and will be ready shortly.'}
                        {derivedTtsStatus === 'failed' && 'Audio generation failed. Try refreshing or regenerating the audio.'}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Available actions for this item
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <Button 
                    onClick={handlePractice}
                    disabled={derivedTtsStatus !== 'ready'}
                    className="w-full justify-start"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Practice This Item
                  </Button>

                  <Button 
                    variant="outline"
                    onClick={handleDownload}
                    disabled={derivedTtsStatus !== 'ready'}
                    className="w-full justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Audio
                  </Button>

                  <Button
                    variant="warning"
                    onClick={handleRegenerate}
                    disabled={isTtsOffline || isRefreshingAudio}
                    className="w-full justify-start"
                    title={isTtsOffline ? 'Audio generation unavailable' : undefined}
                  >
                    {isRefreshingAudio ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Refreshing audio…
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Refresh Audio
                      </>
                    )}
                  </Button>

                  <Button 
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteItemMutation.isPending}
                    className="w-full justify-start"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteItemMutation.isPending ? 'Deleting...' : 'Delete Item'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Item</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this item? This action cannot be undone.
            <br />
            <br />
            <strong>Item:</strong> {item.text.length > 50 ? `${item.text.substring(0, 50)}...` : item.text}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            disabled={deleteItemMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteItemMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
