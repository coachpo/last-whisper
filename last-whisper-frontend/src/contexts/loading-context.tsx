import {createContext, ReactNode, useContext, useEffect, useState} from 'react'
import {useLocation, useSearchParams} from 'react-router-dom'

interface LoadingContextType {
    isLoading: boolean
    setLoading: (loading: boolean) => void
    startLoading: () => void
    stopLoading: () => void
    setNavigatingTo: (href: string | null) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({children}: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false)
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const pathname = location.pathname
    const searchValue = searchParams?.toString() ?? ''

    const defer = (fn: () => void) => {
        if (typeof queueMicrotask === 'function') {
            queueMicrotask(fn)
        } else {
            Promise.resolve().then(fn)
        }
    }

    // Stop loading when pathname changes (page is ready)
    useEffect(() => {
        if (!navigatingTo) {
            return
        }
        const currentPath = searchValue ? `${pathname}?${searchValue}` : pathname

        if (currentPath === navigatingTo || pathname === navigatingTo) {
            setIsLoading(false)
            setNavigatingTo(null)
        }
    }, [pathname, searchValue, navigatingTo])

    useEffect(() => {
        const nav = (window as typeof window & { navigation?: { addEventListener?: typeof window.addEventListener; removeEventListener?: typeof window.removeEventListener } }).navigation
        if (!nav || !nav.addEventListener) {
            return
        }

        const handleNavigate = (event: Event & { destination?: { url?: string } }) => {
            defer(() => {
                setIsLoading(true)
                const nextUrl = event.destination?.url
                if (nextUrl) {
                    try {
                        const parsed = new URL(nextUrl)
                        const nextPath = parsed.search ? `${parsed.pathname}?${parsed.searchParams.toString()}` : parsed.pathname
                        setNavigatingTo(nextPath)
                    } catch {
                        setNavigatingTo(null)
                    }
                } else {
                    setNavigatingTo(null)
                }
            })
        }

        nav.addEventListener('navigate', handleNavigate as EventListener)
        return () => {
            nav.removeEventListener?.('navigate', handleNavigate as EventListener)
        }
    }, [])

    // Stop loading on SPA route change
    useEffect(() => {
        setIsLoading(false)
        setNavigatingTo(null)
    }, [location.key])

    const setLoading = (loading: boolean) => {
        setIsLoading(loading)
    }

    const startLoading = () => {
        setIsLoading(true)
    }

    const stopLoading = () => {
        setIsLoading(false)
    }

    return (
        <LoadingContext.Provider value={{
            isLoading,
            setLoading,
            startLoading,
            stopLoading,
            setNavigatingTo
        }}>
            {children}
        </LoadingContext.Provider>
    )
}

export function useLoading() {
    const context = useContext(LoadingContext)
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider')
    }
    return context
}
