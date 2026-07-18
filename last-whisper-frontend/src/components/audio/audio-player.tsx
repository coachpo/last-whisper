
import {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react'

import {Slider} from '@/components/ui/slider'
import {Button} from '@/components/ui/button'
import {Loader2, Pause, Play, RotateCcw} from 'lucide-react'
import {audioCache} from '@/lib/audio-cache'
import {apiClient} from '@/lib/api'


interface AudioPlayerProps {
    itemId: number
    onEnded?: () => void
    onPlayStateChange?: (isPlaying: boolean) => void
    onRefreshAudio?: () => void
    refreshLoading?: boolean
    refreshDisabled?: boolean
}

export interface AudioPlayerRef {
    play: () => Promise<void>
    pause: () => void
    reset: () => void
    isPlaying: boolean
    isReady: boolean
}

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(({
                                                                             itemId,
                                                                             onEnded,
                                                                             onPlayStateChange,
                                                                             onRefreshAudio,
                                                                             refreshLoading,
                                                                             refreshDisabled
                                                                         }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isReady, setIsReady] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)

    const [error, setError] = useState<string | null>(null)

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const previousItemIdRef = useRef<number | null>(null)
    const currentAudioBlobRef = useRef<Blob | null>(null)
    const playPromiseRef = useRef<Promise<void> | null>(null)
    const isDestroyingRef = useRef(false)

    // Notify parent of play state changes
    const notifyPlayStateChange = useCallback((playing: boolean) => {
        onPlayStateChange?.(playing)
    }, [onPlayStateChange])

    // Shared reset function for all controllers
    const resetAllControllers = useCallback(() => {
        setIsPlaying(false)
        notifyPlayStateChange(false)
        setCurrentTime(0)
    }, [notifyPlayStateChange])

    // Expose control methods to parent component
    useImperativeHandle(ref, () => ({
        play: async () => {

            if (audioRef.current && !isPlaying && isReady && !isDestroyingRef.current) {
                try {
                    // Check if the audio element has a valid source before playing
                    if (!audioRef.current.src || !audioRef.current.src.startsWith('blob:')) {
                        return
                    }

                    // Cancel any existing play promise
                    if (playPromiseRef.current) {
                        try {
                            await playPromiseRef.current
                        } catch {
                            // Ignore errors from cancelled promises
                        }
                    }



                    // Check if duration is valid before playing
                    if (isNaN(audioRef.current.duration) || audioRef.current.duration <= 0) {
                        setError('Audio file appears to be corrupted or empty')
                        return
                    }

                    // Store the play promise to handle race conditions
                    playPromiseRef.current = audioRef.current.play()
                    await playPromiseRef.current
                    playPromiseRef.current = null

                    // Only set playing if we're still not destroying
                    if (!isDestroyingRef.current) {
                        setIsPlaying(true)
                        notifyPlayStateChange(true)
                    }
                } catch (error) {
                    playPromiseRef.current = null
                    if (error instanceof Error && error.name !== 'AbortError') {
                        setError(`Failed to play audio: ${error.message}`)
                    }
                }
            }
        },
        pause: () => {
            if (audioRef.current && isPlaying) {
                // Cancel any pending play promise
                if (playPromiseRef.current) {
                    playPromiseRef.current = null
                }

                audioRef.current.pause()
                setIsPlaying(false)
                notifyPlayStateChange(false)
            }
        },
        reset: () => {
            // Always reset controllers regardless of audio element state
            resetAllControllers()

            // If audio element exists, also reset audio-specific properties
            if (audioRef.current) {
                // Cancel any pending play promise
                if (playPromiseRef.current) {
                    playPromiseRef.current = null
                }

                audioRef.current.pause()
                audioRef.current.currentTime = 0
            }
        },
        isPlaying,
        isReady
    }), [isPlaying, isReady, notifyPlayStateChange, resetAllControllers])


    // Check if browser supports the audio format
    const isAudioFormatSupported = (mimeType: string): boolean => {
        const audio = new Audio()
        return audio.canPlayType(mimeType) !== ''
    }

    // Load audio from cache or API
    useEffect(() => {
        // Only load audio if itemId has actually changed
        if (previousItemIdRef.current === itemId) {
            return
        }

        // If we already have the audio blob for this item, don't reload
        if (currentAudioBlobRef.current && audioRef.current && audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
            return
        }

        previousItemIdRef.current = itemId

        // Reset all controllers when item changes
        resetAllControllers()

        const loadAudio = async () => {
            setIsLoading(true)
            setError(null)

            // Clear previous audio blob and give time for cleanup
            setAudioBlob(null)
            currentAudioBlobRef.current = null
            await new Promise(resolve => setTimeout(resolve, 10))

            try {
                // Try to get from cache first
                const cachedAudio = await audioCache.getAudio(itemId)

                if (!cachedAudio) {
                    // If not in cache, fetch from API
                    let blob = await apiClient.getItemAudio(itemId)

                    // Validate the blob
                    if (blob.size === 0) {
                        throw new Error('Received empty audio file from server')
                    }

                    // Handle missing MIME type - try to detect from content or use fallback
                    let mimeType = blob.type
                    if (!mimeType || !mimeType.startsWith('audio/')) {
                        // Try to detect MIME type from content or use common audio formats
                        // Most browsers support MP3, so we'll try that first
                        const commonAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']

                        // Find the first supported format
                        mimeType = commonAudioTypes.find(type => isAudioFormatSupported(type)) || 'audio/mpeg'

                        // Create a new blob with the detected/fallback MIME type
                        blob = new Blob([blob], {type: mimeType})
                    }

                    // Check if browser supports this format
                    if (!isAudioFormatSupported(mimeType)) {
                        throw new Error(`Audio format not supported by browser: ${mimeType}`)
                    }

                    const audioData = await blob.arrayBuffer()

                    // Cache the audio with MIME type
                    await audioCache.setAudio(itemId, audioData, blob.type)
                    setAudioBlob(blob) // Use original blob with correct MIME type
                    currentAudioBlobRef.current = blob
                } else {
                    // If from cache, recreate blob with correct MIME type
                    let mimeType = cachedAudio.mimeType

                    // Handle missing or invalid cached MIME type
                    if (!mimeType || !mimeType.startsWith('audio/')) {
                        // Use fallback MIME type
                        const commonAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
                        mimeType = commonAudioTypes.find(type => isAudioFormatSupported(type)) || 'audio/mpeg'
                    }

                    const blob = new Blob([cachedAudio.audioData], {type: mimeType})

                    // Validate cached blob
                    if (blob.size === 0) {
                        throw new Error('Cached audio file is empty')
                    }

                    if (!isAudioFormatSupported(mimeType)) {
                        throw new Error(`Cached audio format not supported by browser: ${mimeType}`)
                    }

                    setAudioBlob(blob)
                    currentAudioBlobRef.current = blob
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error'
                if (message.includes('404')) {
                    setError('Audio not found. Use Refresh audio to regenerate this item.')
                } else {
                    setError(`Failed to load audio: ${message}`)
                }
            } finally {
                setIsLoading(false)
            }
        }

        loadAudio()
    }, [itemId, resetAllControllers])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isDestroyingRef.current = true

            // Cancel any pending play promise
            if (playPromiseRef.current) {
                playPromiseRef.current = null
            }

            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.src = ''
            }
        }
    }, [])

    // Initialize audio element
    useEffect(() => {
        if (audioBlob && audioBlob.size > 0) {
            // Don't preserve playing state for new items - always start fresh
            const preservedCurrentTime = 0
            const preservedDuration = 0

            // Reset state first - always start with stopped state
            setIsPlaying(false)
            notifyPlayStateChange(false)
            setIsReady(false)
            setCurrentTime(preservedCurrentTime)
            setDuration(preservedDuration)
            setError(null) // Clear any previous errors

            const audio = new Audio()

            // Validate blob before creating URL
            if (audioBlob.size === 0) {
                setError('Empty audio file')
                return
            }

            // Check if the blob type is supported (should be handled by now, but double-check)
            if (!audioBlob.type || !audioBlob.type.startsWith('audio/')) {
                setError(`Audio format could not be determined: ${audioBlob.type || 'unknown'}`)
                return
            }

            const url = URL.createObjectURL(audioBlob)



            // Set src and validate it was set correctly
            audio.src = url
            if (!audio.src || !audio.src.startsWith('blob:')) {
                setError('Failed to set audio source')
                URL.revokeObjectURL(url)
                return
            }

            audio.volume = 1

            audio.addEventListener('canplay', () => {
                setIsReady(true)
            })

            audio.addEventListener('canplaythrough', () => {
                setIsReady(true)
            })

            // Fallback: set ready after a reasonable timeout if events don't fire
            const readyTimeout = setTimeout(() => {
                setIsReady(true)
            }, 3000) // 3 second timeout

            audio.addEventListener('loadedmetadata', () => {
                // Check for invalid duration
                if (isNaN(audio.duration) || audio.duration <= 0) {
                    setError('Audio file appears to be corrupted or empty')
                    return
                }
                
                setDuration(audio.duration)
                // Audio might be ready to play after metadata is loaded
                if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
                    setIsReady(true)
                }
            })

            audio.addEventListener('timeupdate', () => {
                setCurrentTime(audio.currentTime)
            })

            audio.addEventListener('ended', () => {
                setIsPlaying(false)
                notifyPlayStateChange(false)
                setCurrentTime(0)
                onEnded?.()
            })

            audio.addEventListener('error', () => {
                // Only handle errors for the current audio element with proper blob URL
                if (audioRef.current === audio && audio.src.startsWith('blob:')) {
                    // Provide more specific error messages
                    let errorMessage = 'Unknown playback error'
                    if (audio.error) {
                        switch (audio.error.code) {
                            case MediaError.MEDIA_ERR_ABORTED:
                                errorMessage = 'Audio playback was aborted'
                                break
                            case MediaError.MEDIA_ERR_NETWORK:
                                errorMessage = 'Network error while loading audio'
                                break
                            case MediaError.MEDIA_ERR_DECODE:
                                errorMessage = 'Audio format not supported or corrupted'
                                break
                            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                                errorMessage = 'Audio format not supported by browser'
                                break
                            default:
                                errorMessage = audio.error.message || 'Unknown playback error'
                        }
                    }

                    setError(`Audio playback error: ${errorMessage}`)
                    setIsPlaying(false)
                    notifyPlayStateChange(false)

                    // If it's a format/source error, try clearing the cache for this item
                    if (audio.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ||
                        audio.error?.code === MediaError.MEDIA_ERR_DECODE) {
                        audioCache.removeAudio(itemId).catch(() => {
                            // Silently handle cache clearing errors
                        })
                    }
                }
            })

            // Store reference to old audio element for cleanup
            const oldAudio = audioRef.current

            // Set new audio element as current first
            audioRef.current = audio
            isDestroyingRef.current = false // Reset destroying flag

            // Now clean up the old audio element
            if (oldAudio) {
                // Set destroying flag to prevent race conditions
                isDestroyingRef.current = true

                // Cancel any pending play promise
                if (playPromiseRef.current) {
                    playPromiseRef.current = null
                }

                // Pause and clear the old audio element immediately
                oldAudio.pause()
                oldAudio.src = ''
                oldAudio.load() // Reset the audio element state

                // Remove all event listeners to prevent stale events
                oldAudio.onloadstart = null
                oldAudio.oncanplay = null
                oldAudio.oncanplaythrough = null
                oldAudio.onloadedmetadata = null
                oldAudio.ontimeupdate = null
                oldAudio.onended = null
                oldAudio.onerror = null


            }

            return () => {
                if (audio) {
                    audio.pause()
                    audio.src = ''
                    // Remove all event listeners
                    audio.onloadstart = null
                    audio.oncanplay = null
                    audio.oncanplaythrough = null
                    audio.onloadedmetadata = null
                    audio.ontimeupdate = null
                    audio.onended = null
                    audio.onerror = null
                }
                clearTimeout(readyTimeout)
                URL.revokeObjectURL(url)
            }
        }
    }, [audioBlob, itemId, notifyPlayStateChange, onEnded])

    const togglePlayPause = useCallback(async () => {
        if (!audioRef.current) {
            return
        }

        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
            notifyPlayStateChange(false)
        } else {
            try {
                // Check if the audio source is valid before attempting to play
                if (!audioRef.current.src || !audioRef.current.src.startsWith('blob:')) {
                    setError('Audio source is invalid')
                    return
                }
                
                // Check if duration is valid before playing
                if (isNaN(audioRef.current.duration) || audioRef.current.duration <= 0) {
                    setError('Audio file appears to be corrupted or empty')
                    return
                }
                
                const playPromise = audioRef.current.play()
                await playPromise
                
                setIsPlaying(true)
                notifyPlayStateChange(true)
            } catch (error) {
                setError(`Failed to play audio: ${error instanceof Error ? error.message : 'Unknown error'}`)
                setIsPlaying(false)
                notifyPlayStateChange(false)
            }
        }
    }, [audioRef, isPlaying, notifyPlayStateChange])

    const handleSeek = (value: number[]) => {
        if (!audioRef.current) return

        const newTime = value[0]
        audioRef.current.currentTime = newTime
        setCurrentTime(newTime)
    }


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
                case ' ':
                    event.preventDefault()
                    togglePlayPause()
                    break
            }
        }

        // Add event listener to document
        document.addEventListener('keydown', handleKeyDown)

        // Cleanup
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [togglePlayPause])

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    if (isLoading) {
        return (
            <div className="h-16 flex items-center justify-center">
                <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    <span className="ml-2 text-sm">Loading audio...</span>
                </div>
            </div>
        )
    }

    const refreshButtonDisabled = (refreshDisabled ?? false) || (refreshLoading ?? false)

    if (error) {
        return (
            <div className="h-16 flex items-center justify-center text-center text-sm px-4">
                <div className="space-y-2">
                    <div className="text-destructive">{error}</div>
                    {onRefreshAudio && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onRefreshAudio}
                            disabled={refreshButtonDisabled}
                            title={refreshDisabled ? 'Audio generation unavailable' : undefined}
                            className="inline-flex items-center gap-2"
                        >
                            {refreshLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RotateCcw className="h-4 w-4" />
                            )}
                            Refresh audio
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    if (!audioBlob) {
        return (
            <div className="h-16 flex items-center justify-center text-muted-foreground text-sm">
                <span>No audio available</span>
            </div>
        )
    }

    // Audio player with compact controls
    return (
        <div className="h-16 flex items-center w-full px-4">
            <div className="flex items-center space-x-3 w-full">
                {/* Play/Pause Button */}
                <button
                    onClick={togglePlayPause}
                    disabled={!audioRef.current}
                    className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-white flex items-center justify-center flex-shrink-0"
                >
                    {isPlaying ? (
                        <Pause className="h-4 w-4"/>
                    ) : (
                        <Play className="h-4 w-4 ml-0.5"/>
                    )}
                </button>
                
                {/* Progress Bar */}
                <div className="flex-1">
                    <Slider
                        value={[currentTime]}
                        max={duration || 0}
                        step={0.1}
                        onValueChange={handleSeek}
                        className="w-full"
                    />
                </div>
                
                {/* Time Display - inline with progress bar */}
                <div className="flex items-center space-x-2 text-xs text-muted-foreground flex-shrink-0">
                    <span>{formatTime(currentTime)}</span>
                    <span>/</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    )
})

AudioPlayer.displayName = 'AudioPlayer'
