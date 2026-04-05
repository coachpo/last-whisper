
import {useEffect, useId, useMemo, useState} from 'react'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {apiClient} from '@/lib/api'
import {debug} from '@/lib/debug'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {CreateItemRequest} from '@/types/api'
import {TagSelector} from '@/components/tags/tag-selector'
import {useToast} from '@/components/ui/use-toast'
import {AlertTriangle, X} from 'lucide-react'
import {useMetadata} from '@/contexts/metadata-context'

interface CreateItemDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function CreateItemDialog({open, onOpenChange, onSuccess}: CreateItemDialogProps) {
    const dialogTitleId = useId()
    const dialogDescriptionId = useId()
    const { localeOptions, limits, ttsServiceAvailable } = useMetadata()
    const defaultLocale = useMemo(() => localeOptions[0]?.value ?? 'fi', [localeOptions])
    const [formData, setFormData] = useState<CreateItemRequest>({
        locale: defaultLocale,
        text: '',
        difficulty: 0,
        tags: []
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const textLimit = limits.maxTextLength
    const tagsLimit = limits.maxTagsPerItem
    const tagLengthLimit = limits.maxTagLength
    const isSubmissionBlocked = ttsServiceAvailable === false

    const { toast } = useToast()
    const queryClient = useQueryClient()
    const createItemMutation = useMutation({
        mutationFn: (data: CreateItemRequest) => {
            const payload = {...data}

            if (payload.difficulty === 0) {
                delete payload.difficulty
            }

            return apiClient.createItem(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['items']})
            onSuccess()
            toast({
                title: "Item created",
                description: "The dictation item has been created successfully.",
            })
            // Reset form
            setFormData({
                locale: defaultLocale,
                text: '',
                difficulty: 0,
                tags: []
            })
        },
        onError: (error: Error) => {
            debug.error('Failed to create item:', error)

            // Provide more specific error messages based on the error content
            let title = "Error creating item"
            let description = error.message || "Failed to create item. Please check your input and try again."

            if (error.message.includes("text") && error.message.includes("too_long")) {
                title = "Text too long"
                description = "The text content exceeds the maximum allowed length. Please shorten your text and try again."
            } else if (error.message.includes("text") && error.message.includes("too_short")) {
                title = "Text too short"
                description = "The text content is too short. Please add more content and try again."
            } else if (error.message.includes("difficulty")) {
                title = "Invalid difficulty"
                description = "The difficulty level is invalid. Please select a valid difficulty level (0-5)."
            } else if (error.message.includes("tags")) {
                title = "Invalid tags"
                description = "There's an issue with the tags. Please check your tag selection and try again."
            } else if (error.message.includes("locale")) {
                title = "Invalid language"
                description = "The selected language is not supported. Please select a valid language."
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

    useEffect(() => {
        setFormData(prev => {
            if (localeOptions.some(option => option.value === prev.locale)) {
                return prev
            }
            return {...prev, locale: defaultLocale}
        })
    }, [localeOptions, defaultLocale])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSubmissionBlocked) {
            toast({
                title: "Audio generation unavailable",
                description: "The TTS service is offline right now. Please try again once it recovers.",
                variant: "destructive",
            })
            return
        }
        if (!formData.text.trim()) return

        // Client-side validation according to API documentation
        if (formData.text.length > textLimit) {
            toast({
                title: "Text too long",
                description: `Text must be ${textLimit} characters or less. Please shorten your text and try again.`,
                variant: "destructive",
            })
            return
        }

        if (formData.text.length < 1) {
            toast({
                title: "Text too short",
                description: "Text must be at least 1 character long. Please add content and try again.",
                variant: "destructive",
            })
            return
        }

        if (formData.locale.length < 2 || formData.locale.length > 10) {
            toast({
                title: "Invalid locale",
                description: "Locale must be between 2 and 10 characters. Please select a valid language code.",
                variant: "destructive",
            })
            return
        }

        if (formData.difficulty && (formData.difficulty < 1 || formData.difficulty > 5)) {
            toast({
                title: "Invalid difficulty",
                description: "Difficulty must be between 1 and 5. Please select a valid difficulty level.",
                variant: "destructive",
            })
            return
        }

        if (formData.tags && formData.tags.length > tagsLimit) {
            toast({
                title: "Too many tags",
                description: `You can only add up to ${tagsLimit} tags per item. Please remove some tags and try again.`,
                variant: "destructive",
            })
            return
        }

        // Validate individual tag lengths
        if (formData.tags && formData.tags.some(tag => tag.length > tagLengthLimit)) {
            toast({
                title: "Tag too long",
                description: `Each tag must be ${tagLengthLimit} characters or less. Please shorten your tags and try again.`,
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)
        createItemMutation.mutate(formData)
    }

    const handleTagsChange = (tags: string[]) => {
        setFormData(prev => ({
            ...prev,
            tags
        }))
    }

    useEffect(() => {
        if (!open) return
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onOpenChange(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [open, onOpenChange])

    if (!open) {
        return null
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogTitleId}
                aria-describedby={dialogDescriptionId}
                className="relative z-10 w-full max-w-[600px] rounded-lg border bg-background p-6 shadow-lg"
            >
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 id={dialogTitleId} className="text-lg font-semibold">Create New Dictation Item</h2>
                        <p id={dialogDescriptionId} className="text-sm text-muted-foreground">
                            Add a new text for dictation practice. The system will automatically generate audio.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Close dialog"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {isSubmissionBlocked && (
                    <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>
                            Audio generation workers are currently offline. New items will queue but won&apos;t process until service recovers.
                        </span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="locale">Language</Label>
                            <Select
                                value={formData.locale}
                                onValueChange={(value) => setFormData(prev => ({...prev, locale: value}))}
                            >
                                <SelectTrigger id="locale">
                                    <SelectValue/>
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
                            <Label htmlFor="difficulty">Difficulty Level</Label>
                            <Select
                                value={(formData.difficulty ?? 0).toString()}
                                onValueChange={(value) => setFormData(prev => ({...prev, difficulty: parseInt(value)}))}
                            >
                            <SelectTrigger id="difficulty">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Auto</SelectItem>
                                <SelectItem value="1">1 - Beginner</SelectItem>
                                <SelectItem value="2">2 - Easy</SelectItem>
                                <SelectItem value="3">3 - Medium</SelectItem>
                                <SelectItem value="4">4 - Challenging</SelectItem>
                                <SelectItem value="5">5 - Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="text">Text Content</Label>
                        <Textarea
                            id="text"
                            placeholder="Enter the text for dictation practice..."
                            value={formData.text}
                            onChange={(e) => setFormData(prev => ({...prev, text: e.target.value}))}
                            className="min-h-[120px]"
                            required
                        />
                        <p className={`text-sm ${formData.text.length > textLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {formData.text.length} / {textLimit.toLocaleString()} characters
                            {formData.text.length > textLimit && (
                                <span className="block mt-1 font-medium">
                                     Text exceeds maximum length · Text too long
                                </span>
                            )}
                        </p>
                    </div>

                    <TagSelector
                        selectedTags={formData.tags || []}
                        onTagsChange={handleTagsChange}
                        placeholder="Select or add tags..."
                        maxTags={tagsLimit}
                        maxTagLength={tagLengthLimit}
                    />

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
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
                            disabled={
                                isSubmitting ||
                                isSubmissionBlocked ||
                                !formData.text.trim() ||
                                formData.text.length > textLimit ||
                                formData.text.length < 1 ||
                                formData.locale.length < 2 ||
                                formData.locale.length > 10 ||
                                (formData.difficulty && (formData.difficulty < 1 || formData.difficulty > 5)) ||
                                (formData.tags && formData.tags.length > tagsLimit) ||
                                (formData.tags && formData.tags.some(tag => tag.length > tagLengthLimit))
                            }
                        >
                            {isSubmissionBlocked
                              ? 'TTS offline'
                              : isSubmitting ? 'Creating...' : 'Create Item'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
