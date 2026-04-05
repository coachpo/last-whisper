
import {createContext, ReactNode, useContext, useEffect, useRef, useState} from 'react'

interface SidebarContextType {
    isCollapsed: boolean
    isMobile: boolean
    toggleSidebar: () => void
    closeSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({children}: { children: ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const lastWasMobile = useRef(false)

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768 // md breakpoint
            setIsMobile(mobile)
            setIsCollapsed(prev => {
                if (mobile) {
                    return true
                }
                if (lastWasMobile.current && !mobile) {
                    // When returning to desktop, expand by default
                    return false
                }
                return prev
            })
            lastWasMobile.current = mobile
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const toggleSidebar = () => {
        setIsCollapsed(prev => {
            if (isMobile) {
                return !prev
            }
            return !prev
        })
    }

    const closeSidebar = () => {
        setIsCollapsed(true)
    }

    return (
        <SidebarContext.Provider value={{
            isCollapsed,
            isMobile,
            toggleSidebar,
            closeSidebar
        }}>
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider')
    }
    return context
}
