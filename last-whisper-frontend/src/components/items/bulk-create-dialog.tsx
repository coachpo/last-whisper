
import {useEffect, useMemo, useState} from 'react'
import {AlertTriangle} from 'lucide-react'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {apiClient} from '@/lib/api'
import {debug} from '@/lib/debug'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Badge} from '@/components/ui/badge'
import {BulkCreateItemsRequest, CreateItemRequest} from '@/types/api'
import {TagSelector} from '@/components/tags/tag-selector'
import {useToast} from '@/components/ui/use-toast'
import {getDifficultyColor, getDifficultyLabel} from '@/lib/utils'
import {useMetadata} from '@/contexts/metadata-context'

interface BulkCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BulkCreateDialog({ open, onOpenChange, onSuccess }: BulkCreateDialogProps) {
  const { localeOptions, limits, ttsServiceAvailable } = useMetadata()
  const resolvedDefaultLocale = useMemo(() => localeOptions[0]?.value ?? 'fi', [localeOptions])
  const [bulkText, setBulkText] = useState('')
  const [defaultLocale, setDefaultLocale] = useState(resolvedDefaultLocale)
  const [defaultDifficulty, setDefaultDifficulty] = useState(0)
  const [defaultTags, setDefaultTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewItems, setPreviewItems] = useState<CreateItemRequest[]>([])
  const maxItemsPerBatch = limits.maxItemsPerBulkRequest
  const maxTextLength = limits.maxTextLength
  const tagsLimit = limits.maxTagsPerItem
  const tagLengthLimit = limits.maxTagLength
  const isSubmissionBlocked = ttsServiceAvailable === false

  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    setDefaultLocale(prev => {
      if (localeOptions.some(option => option.value === prev)) {
        return prev
      }
      return resolvedDefaultLocale
    })
  }, [localeOptions, resolvedDefaultLocale])

  const bulkCreateMutation = useMutation({
    mutationFn: (data: BulkCreateItemsRequest) => apiClient.bulkCreateItems(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      onSuccess()
      // Reset form
      setBulkText('')
      setDefaultLocale(resolvedDefaultLocale)
      setDefaultDifficulty(0)
      setDefaultTags([])
      setPreviewItems([])
    },
    onError: (error: Error) => {
        debug.error('Failed to create items:', error)

      // Provide more specific error messages based on the error content
      let title = "Error creating items"
      let description = error.message || "Failed to create items. Please check your input and try again."

      if (error.message.includes("too_long") || error.message.includes("maximum allowed")) {
        title = "Too many items"
        description = `The server has a limit of ${maxItemsPerBatch} items per batch. Please reduce the number of items and try again.`
      } else if (error.message.includes("text") && error.message.includes("too_long")) {
        title = "Text too long"
        description = `One or more items have text longer than ${maxTextLength.toLocaleString()} characters. Please shorten the text and try again.`
      } else if (error.message.includes("text") && error.message.includes("too_short")) {
        title = "Text too short"
        description = "One or more items have empty text. Please add content to all items and try again."
      } else if (error.message.includes("locale")) {
        title = "Invalid locale"
        description = "One or more items have invalid locale values. Please check the language settings and try again."
      } else if (error.message.includes("difficulty")) {
        title = "Invalid difficulty"
        description = "One or more items have invalid difficulty values. Please check the difficulty settings and try again."
      } else if (error.message.includes("tags")) {
        title = "Invalid tags"
        description = "One or more items have invalid tags. Please check the tag settings and try again."
      } else if (error.message.includes("validation")) {
        title = "Validation error"
        description = "Please check your input data and try again."
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      })
    },
    onSettled: () => {
      setIsSubmitting(false)
    }
  })



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmissionBlocked) {
      toast({
        title: "Audio generation unavailable",
        description: "The TTS service is offline. Please wait until it recovers before queuing new items.",
        variant: "destructive",
      })
      return
    }
    if (previewItems.length === 0) return

    // Client-side validation according to API documentation
    if (previewItems.length > maxItemsPerBatch) {
      toast({
        title: "Too many items",
        description: `You can only create up to ${maxItemsPerBatch} items at once. You have ${previewItems.length} items. Please reduce the number of items and try again.`,
        variant: "destructive",
      })
      return
    }

    // Validate individual items
    for (let i = 0; i < previewItems.length; i++) {
      const item = previewItems[i]

      if (item.text.length > maxTextLength) {
        toast({
          title: "Text too long",
          description: `Item ${i + 1} has text longer than ${maxTextLength.toLocaleString()} characters. Please shorten it and try again.`,
          variant: "destructive",
        })
        return
      }

      if (item.text.length < 1) {
        toast({
          title: "Empty text",
          description: `Item ${i + 1} has no text content. Please add content and try again.`,
          variant: "destructive",
        })
        return
      }

      if (item.locale.length < 2 || item.locale.length > 10) {
        toast({
          title: "Invalid locale",
          description: `Item ${i + 1} has an invalid locale. Please check the language setting and try again.`,
          variant: "destructive",
        })
        return
      }

      if (item.difficulty && (item.difficulty < 1 || item.difficulty > 5)) {
        toast({
          title: "Invalid difficulty",
          description: `Item ${i + 1} has an invalid difficulty level. Please select a value between 1 and 5.`,
          variant: "destructive",
        })
        return
      }

      if (item.tags && item.tags.length > tagsLimit) {
        toast({
          title: "Too many tags",
          description: `Item ${i + 1} has more than ${tagsLimit} tags. Please reduce the number of tags and try again.`,
          variant: "destructive",
        })
        return
      }

      if (item.tags && item.tags.some(tag => tag.length > tagLengthLimit)) {
        toast({
          title: "Tag too long",
          description: `Item ${i + 1} has a tag longer than ${tagLengthLimit} characters. Please shorten the tags and try again.`,
          variant: "destructive",
        })
        return
      }
    }

    setIsSubmitting(true)

      // Debug: Log the request data to see if tags are included
      debug.log('Bulk create request data:', {items: previewItems})
      debug.log('First item tags:', previewItems[0]?.tags)
    
    bulkCreateMutation.mutate({ items: previewItems })
  }

  const handleBulkTextChange = (value: string) => {
    setBulkText(value)
    // Auto-parse when text changes
    if (value.trim()) {
      const lines = value.split('\n').filter(line => line.trim())
      const items: CreateItemRequest[] = lines.map(line => {
        const item: CreateItemRequest = {
          locale: defaultLocale,
          text: line.trim(),
            tags: defaultTags || [] // Ensure tags is always an array
        }
        // Only include difficulty if not Auto (0)
        if (defaultDifficulty !== 0) {
          item.difficulty = defaultDifficulty
        }
        return item
      })

        // Debug: Log auto-parsed items
        debug.log('Auto-parsed items with tags:', items)
        debug.log('Current default tags:', defaultTags)
      
      setPreviewItems(items)
    } else {
      setPreviewItems([])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Create Dictation Items</DialogTitle>
          <DialogDescription>
            Create multiple dictation items at once. Enter one text per line.
          </DialogDescription>
        </DialogHeader>

        {isSubmissionBlocked && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>TTS workers are offline. Submissions will pause until the service is restored.</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-locale">Default Language</Label>
              <Select
                value={defaultLocale}
                onValueChange={(value) => {
                  setDefaultLocale(value)
                    // Re-parse with new locale if there's text content
                    if (bulkText.trim()) {
                        const lines = bulkText.split('\n').filter(line => line.trim())
                        const items: CreateItemRequest[] = lines.map(line => {
                            const item: CreateItemRequest = {
                                locale: value,
                                text: line.trim(),
                                tags: defaultTags || []
                            }
                            if (defaultDifficulty !== 0) {
                                item.difficulty = defaultDifficulty
                            }
                            return item
                        })
                        setPreviewItems(items)
                    }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {localeOptions.map(locale => (
                    <SelectItem key={locale.value} value={locale.value}>
                      {locale.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-difficulty">Default Difficulty</Label>
              <Select
                value={defaultDifficulty.toString()}
                onValueChange={(value) => {
                    const newDifficulty = parseInt(value)
                    setDefaultDifficulty(newDifficulty)
                    // Re-parse with new difficulty if there's text content
                    if (bulkText.trim()) {
                        const lines = bulkText.split('\n').filter(line => line.trim())
                        const items: CreateItemRequest[] = lines.map(line => {
                            const item: CreateItemRequest = {
                                locale: defaultLocale,
                                text: line.trim(),
                                tags: defaultTags || []
                            }
                            if (newDifficulty !== 0) {
                                item.difficulty = newDifficulty
                            }
                            return item
                        })
                        setPreviewItems(items)
                    }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Auto</SelectItem>
                  <SelectItem value="1">1 - Beginner</SelectItem>
                  <SelectItem value="2">2 - Easy</SelectItem>
                  <SelectItem value="3">3 - Medium</SelectItem>
                  <SelectItem value="4">4 - Hard</SelectItem>
                  <SelectItem value="5">5 - Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TagSelector
            selectedTags={defaultTags}
            onTagsChange={(tags) => {
              setDefaultTags(tags)
                // Re-parse the text with new tags if there's text content
                if (bulkText.trim()) {
                    const lines = bulkText.split('\n').filter(line => line.trim())
                    const items: CreateItemRequest[] = lines.map(line => {
                        const item: CreateItemRequest = {
                            locale: defaultLocale,
                            text: line.trim(),
                            tags: tags || [] // Use the new tags
                        }
                        // Only include difficulty if not Auto (0)
                        if (defaultDifficulty !== 0) {
                            item.difficulty = defaultDifficulty
                        }
                        return item
                    })

                    debug.log('Re-parsed items with new tags:', items)
                    debug.log('New tags applied:', tags)

                    setPreviewItems(items)
                }
            }}
            placeholder="Select default tags for all items..."
            maxTags={tagsLimit}
            maxTagLength={tagLengthLimit}
          />

          <div className="space-y-2">
            <Label htmlFor="bulk-text">Text Content (one per line)</Label>
            <Textarea
              id="bulk-text"
              placeholder="Enter texts for dictation practice, one per line...&#10;&#10;Example:&#10;The quick brown fox jumps over the lazy dog.&#10;She sells seashells by the seashore.&#10;How much wood would a woodchuck chuck?"
              value={bulkText}
              onChange={(e) => handleBulkTextChange(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            <p className={`text-sm ${previewItems.length > maxItemsPerBatch ? 'text-destructive' : 'text-muted-foreground'}`}>
              {previewItems.length} items will be created
              {previewItems.length > maxItemsPerBatch && (
                  <span className="block mt-1 font-medium">
                   Maximum {maxItemsPerBatch} items allowed per batch
                </span>
              )}
            </p>
          </div>

          {previewItems.length > 0 && (
            <div className="space-y-2">
              <Label>Preview ({previewItems.length} items)</Label>
              <div className="max-h-[200px] overflow-y-auto border rounded-md p-4 space-y-2">
                {previewItems.slice(0, 10).map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <Badge variant="outline" className="text-xs">
                      {item.locale}
                    </Badge>
                      <Badge
                          className={`text-xs ${item.difficulty === undefined ? 'bg-gray-100 text-gray-600' : getDifficultyColor(item.difficulty)}`}>
                          {item.difficulty === undefined ? 'Auto' : getDifficultyLabel(item.difficulty)}
                    </Badge>
                    <span className="flex-1 truncate">
                      {item.text.length > 60 ? `${item.text.substring(0, 60)}...` : item.text}
                    </span>
                  </div>
                ))}
                {previewItems.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center">
                    ... and {previewItems.length - 10} more items
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || isSubmissionBlocked || previewItems.length === 0 || previewItems.length > maxItemsPerBatch}
            >
              {isSubmissionBlocked
                ? 'TTS offline'
                : isSubmitting ? 'Creating...' : `Create ${previewItems.length} Items`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
