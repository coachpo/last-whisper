
import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {ChevronLeft, ChevronRight, HelpCircle, Volume2, Eye, EyeOff} from 'lucide-react'
import {AudioPlayer, AudioPlayerRef} from '@/components/audio/audio-player'
import {Item} from '@/types/api'

interface AudioPlayerSectionProps {
    currentItem: Item
    currentItemIndex: number
    totalItems: number
    onPrevious: () => void
    onNext: () => void
    className?: string
    showTextDisplay?: boolean
    onRefreshAudio?: (itemId: number) => void
    refreshLoading?: boolean
    refreshDisabled?: boolean
    regionId?: string
    regionLabel?: string
}

export interface AudioPlayerSectionRef {
    play: () => Promise<void>
    pause: () => void
    isPlaying: boolean
    isReady: boolean
}

export const AudioPlayerSection = React.memo(forwardRef<AudioPlayerSectionRef, AudioPlayerSectionProps>(({
                                                                                                  currentItem,
                                                                                                  currentItemIndex,
                                                                                                  totalItems,
                                                                                                  onPrevious,
                                                                                                  onNext,
                                                                                                  className,
                                                                                                  showTextDisplay = true,
                                                                                                  onRefreshAudio,
                                                                                                  refreshLoading,
                                                                                                  refreshDisabled,
                                                                                                  regionId,
                                                                                                  regionLabel
                                                                                              }, ref) => {
    const audioPlayerRef = useRef<AudioPlayerRef>(null)

    const [isPlaying, setIsPlaying] = useState(false)
    const [isTextBlurred, setIsTextBlurred] = useState(true)

    // Handle navigation
    const handlePrevious = useCallback(() => {
        // Immediately reset all playback controls
        if (audioPlayerRef.current) {
            audioPlayerRef.current.reset()
        }
        setIsPlaying(false)
        onPrevious()
    }, [onPrevious])

    const handleNext = useCallback(() => {
        // Immediately reset all playback controls
        if (audioPlayerRef.current) {
            audioPlayerRef.current.reset()
        }
        setIsPlaying(false)
        onNext()
    }, [onNext])

    // Reset playing state when current item changes
    useEffect(() => {
        setIsPlaying(false)
    }, [currentItem.id])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only handle shortcuts when the component is focused or when no input/textarea is focused
            const activeElement = document.activeElement
            const isInputFocused = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                (activeElement as HTMLElement).contentEditable === 'true'
            )

            // Don't handle shortcuts if user is typing in an input field
            if (isInputFocused) {
                return
            }

            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault()
                    if (currentItemIndex > 0) {
                        handlePrevious()
                    }
                    break
                case 'ArrowRight':
                    event.preventDefault()
                    if (currentItemIndex < totalItems - 1) {
                        handleNext()
                    }
                    break
                case 'ArrowUp':
                    event.preventDefault()
                    if (showTextDisplay) {
                        setIsTextBlurred(false) // Show text
                    }
                    break
                case 'ArrowDown':
                    event.preventDefault()
                    if (showTextDisplay) {
                        setIsTextBlurred(true) // Blur text
                    }
                    break
            }
        }

        // Add event listener to document
        document.addEventListener('keydown', handleKeyDown)

        // Cleanup
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [currentItemIndex, totalItems, handlePrevious, handleNext, showTextDisplay])

    // Expose audio player methods through ref
    useImperativeHandle(ref, () => ({
        play: async () => {
            if (audioPlayerRef.current) {
                await audioPlayerRef.current.play()
                setIsPlaying(true)
            }
        },
        pause: () => {
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause()
                setIsPlaying(false)
            }
        },
        get isPlaying() {
            return isPlaying
        },
        get isReady() {
            return audioPlayerRef.current?.isReady || false
        }
    }), [isPlaying])

    const liveRegionLabel = regionLabel ?? 'Audio player'

    return (
        <Card
            id={regionId}
            role="region"
            aria-label={liveRegionLabel}
            tabIndex={-1}
            className={`transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${className || ''}`}
        >
            <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        <Volume2 className="h-5 w-5"/>
                        <span>Audio Player</span>
                        <div className="relative group">
                            <HelpCircle
                                className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-help transition-colors"/>
                            <div
                                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                <div className="space-y-1">
                                    <div className="font-semibold">Keyboard shortcuts:</div>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1">
                                            <kbd
                                                className="px-1.5 py-0.5 text-xs bg-muted rounded border">←</kbd> - Previous
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <kbd
                                                className="px-1.5 py-0.5 text-xs bg-muted rounded border">→</kbd> - Next
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Space</kbd> -
                                            Play/Pause
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">↑</kbd> -
                                            Show Text
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">↓</kbd> -
                                            Blur Text
                                        </div>
                                    </div>
                                </div>
                                {/* Arrow pointing down */}
                                <div
                                    className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-popover"></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center sm:justify-end space-x-3">
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={handlePrevious}
                            disabled={currentItemIndex <= 0}
                            className="h-12 w-12 p-0 touch-manipulation border-border/50 bg-background/50 hover:bg-muted/50 hover:border-border transition-colors"
                        >
                            <ChevronLeft className="h-6 w-6"/>
                        </Button>
                        <span className="text-sm text-muted-foreground min-w-[60px] text-center" aria-live="polite">
              {currentItemIndex + 1} / {totalItems}
            </span>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={handleNext}
                            disabled={currentItemIndex >= totalItems - 1}
                            className="h-12 w-12 p-0 touch-manipulation border-border/50 bg-background/50 hover:bg-muted/50 hover:border-border transition-colors"
                        >
                            <ChevronRight className="h-6 w-6"/>
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-4">
                {/* Text Display Section - Only show if showTextDisplay is true */}
                {showTextDisplay && (
                    <div 
                        className="bg-muted/50 rounded-lg p-3 border cursor-pointer transition-all duration-200 hover:bg-muted/70"
                        onClick={() => setIsTextBlurred(!isTextBlurred)}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div 
                                className={`text-base leading-relaxed select-none transition-all duration-300 flex-1 ${
                                    isTextBlurred 
                                        ? 'blur-sm filter' 
                                        : 'blur-none'
                                }`}
                                style={{
                                    filter: isTextBlurred ? 'blur(4px)' : 'none'
                                }}
                            >
                                {currentItem.text || 'No text available'}
                            </div>
                            <div className="flex-shrink-0 mt-0.5">
                                {isTextBlurred ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground opacity-70" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground opacity-70" />
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Audio Player Section */}
                <div className="h-20 flex items-center justify-center">
                    {currentItem.tts_status === 'ready' ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <AudioPlayer
                                ref={audioPlayerRef}
                                itemId={currentItem.id}
                                onPlayStateChange={setIsPlaying}
                                onRefreshAudio={onRefreshAudio ? () => onRefreshAudio(currentItem.id) : undefined}
                                refreshLoading={refreshLoading}
                                refreshDisabled={refreshDisabled}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-2" role="status" aria-live="assertive">
                            <Volume2 className="h-6 w-6 text-muted-foreground mx-auto mb-1"/>
                            <p className="text-muted-foreground text-sm">
                                {currentItem.tts_status === 'pending' && 'Audio is being generated...'}
                                {currentItem.tts_status === 'processing' && 'Audio is being processed...'}
                                {currentItem.tts_status === 'failed' && 'Audio generation failed'}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}))

AudioPlayerSection.displayName = 'AudioPlayerSection'
