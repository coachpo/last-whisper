
import {useCallback, useEffect, useRef} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Textarea} from '@/components/ui/textarea'
import {Badge} from '@/components/ui/badge'
import {CheckCircle, HelpCircle, RotateCcw, Target} from 'lucide-react'
import {getDifficultyColor, getDifficultyLabel} from '@/lib/utils'
import {Item} from '@/types/api'

interface PracticeFormProps {
    currentItem: Item | null
    userText: string
    setUserText: (text: string) => void
    isSubmitting: boolean
    showResult: boolean
    onSubmit: () => void
    onReset: () => void
}

export function PracticeForm({
                                 currentItem,
                                 userText,
                                 setUserText,
                                 isSubmitting,
                                 showResult,
                                 onSubmit,
                                 onReset
                             }: PracticeFormProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleFocusInput = useCallback(() => {
        textareaRef.current?.focus()
    }, [])

    const handleGlobalKeyDown = useCallback((event: KeyboardEvent) => {
        const target = event.target as HTMLElement

        // Handle Enter key to focus textarea
        if (event.key === 'Enter' &&
            document.activeElement !== textareaRef.current &&
            !(target instanceof HTMLInputElement) &&
            !(target instanceof HTMLButtonElement) &&
            !(target instanceof HTMLTextAreaElement) &&
            !(target instanceof HTMLSelectElement) &&
            !(target instanceof HTMLAnchorElement) &&
            !target?.closest('button') &&
            !target?.closest('input') &&
            !target?.closest('textarea') &&
            !target?.closest('select') &&
            !target?.closest('a')) {
            // Don't prevent default, just focus the textarea
            handleFocusInput()
        }

        // Handle Ctrl+R or Cmd+R to reset
        if ((event.key === 'r' || event.key === 'R') &&
            (event.ctrlKey || event.metaKey) &&
            !(target instanceof HTMLInputElement) &&
            !(target instanceof HTMLTextAreaElement) &&
            !target?.closest('input') &&
            !target?.closest('textarea')) {
            event.preventDefault()
            onReset()
            // Focus textarea after reset
            setTimeout(() => {
                handleFocusInput()
            }, 0)
        }
    }, [onReset, handleFocusInput])

    const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter') {
            // Always prevent Enter from adding line breaks
            event.preventDefault()

            // If not Shift+Enter, try to submit
            if (!event.shiftKey) {
                // Check if submit button is enabled before submitting
                if (
                    userText.trim() &&
                    !isSubmitting &&
                    !showResult &&
                    currentItem?.tts_status === 'ready' &&
                    userText.length <= 10000
                ) {
                    // Call onSubmit directly
                    onSubmit()
                }
            }
        }
    }

    const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Remove any line breaks from the input
        const value = event.target.value
        const cleanValue = value.replace(/[\r\n]/g, '')
        setUserText(cleanValue)
    }

    useEffect(() => {
        document.addEventListener('keydown', handleGlobalKeyDown)
        return () => {
            document.removeEventListener('keydown', handleGlobalKeyDown)
        }
    }, [handleGlobalKeyDown])

    if (!currentItem) {
        return null
    }

    return (
        <Card className="transition-all duration-200 ease-in-out">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5"/>
                    <span>Your Answer</span>
                    <div className="relative group">
                        <HelpCircle
                            className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-help transition-colors"/>
                        <div
                            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            <div className="space-y-1">
                                <div className="font-semibold">Keyboard shortcuts:</div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Enter</kbd> -
                                        Focus textarea or submit answer
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <kbd
                                            className="px-1.5 py-0.5 text-xs bg-muted rounded border">Ctrl+R</kbd> / <kbd
                                        className="px-1.5 py-0.5 text-xs bg-muted rounded border">Cmd+R</kbd> - Reset
                                        and try again
                                    </div>
                                </div>
                            </div>
                            {/* Arrow pointing down */}
                            <div
                                className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-popover"></div>
                        </div>
                    </div>
                </CardTitle>
                <CardDescription>
                    Type what you hear in the audio
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 mb-4 min-h-[32px]">
                    <Badge variant="outline">{currentItem.locale}</Badge>
                    <Badge className={getDifficultyColor(currentItem.difficulty)}>
                        {getDifficultyLabel(currentItem.difficulty)}
                    </Badge>
                    {currentItem.tags && currentItem.tags.length > 0 && (
                        <Badge variant="secondary">
                            {currentItem.tags[0]}
                        </Badge>
                    )}
                </div>

                <Textarea
                    ref={textareaRef}
                    placeholder="Type what you hear here..."
                    value={userText}
                    onChange={handleTextareaChange}
                    onKeyDown={handleTextareaKeyDown}
                    className="min-h-[200px]"
                    disabled={isSubmitting || showResult}
                />

                <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                        onClick={onSubmit}
                        disabled={
                            !userText.trim() ||
                            isSubmitting ||
                            showResult ||
                            currentItem.tts_status !== 'ready' ||
                            userText.length > 10000
                        }
                        className="flex-1"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2"/>
                                Submit Answer
                            </>
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={onReset}
                        disabled={isSubmitting}
                        className="sm:w-auto"
                    >
                        <RotateCcw className="h-4 w-4 mr-2"/>
                        Reset
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
