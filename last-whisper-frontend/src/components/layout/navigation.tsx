
import {Link} from 'react-router-dom'
import {useLocation, useNavigate} from 'react-router-dom'
import {useEffect, useState} from 'react'
import {cn} from '@/lib/utils'
import {BarChart3, BookOpen, Home, List, Music, Play, Tag} from 'lucide-react'
import {useSidebar} from '@/contexts/sidebar-context'
import {useLoading} from '@/contexts/loading-context'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Items', href: '/items', icon: BookOpen },
  { name: 'Practice', href: '/practice', icon: Play },
    {name: 'Walkman', href: '/walkman', icon: Music},
  { name: 'Attempts', href: '/attempts', icon: List },
  { name: 'Stats', href: '/stats', icon: BarChart3 },
  { name: 'Tags', href: '/tags', icon: Tag },
]

interface NavigationProps {
    isCollapsed?: boolean
}

export function Navigation({isCollapsed = false}: NavigationProps) {
    const {pathname} = useLocation()
    const navigate = useNavigate()
    const {isMobile, closeSidebar} = useSidebar()
    const {startLoading, setNavigatingTo} = useLoading()
    const [localNavigatingTo, setLocalNavigatingTo] = useState<string | null>(null)

    // Clear local navigating state when pathname changes
    useEffect(() => {
        if (localNavigatingTo && pathname === localNavigatingTo) {
            setLocalNavigatingTo(null)
        }
    }, [pathname, localNavigatingTo])

    const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        // Don't show loading for same page navigation
        if (pathname === href) return

        // Set the navigating state immediately for visual feedback
        setLocalNavigatingTo(href)
        setNavigatingTo(href)

        // On mobile, prevent default navigation and handle it after sidebar animation
        if (isMobile) {
            e.preventDefault()
            startLoading()
            closeSidebar()

            // Wait for sidebar closing animation to complete (300ms as defined in sidebar)
            setTimeout(() => {
                navigate(href)
                // Loading will be stopped by useEffect when pathname changes
            }, 300)
        } else {
            // On desktop, show loading immediately
            startLoading()
            // Loading will be stopped by useEffect when pathname changes
        }
    }

  return (
    <nav className="flex flex-col gap-1 py-2">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        const isNavigating = localNavigatingTo === item.href
        const isCurrent = isActive || isNavigating

        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={(e) => handleItemClick(e, item.href)}
            className={cn(
                'group flex items-center rounded-md text-sm font-medium transition-all duration-200 ease-in-out',
                isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
                isCurrent
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
                // Add a subtle scaling effect on hover for non-active items
                !isCurrent && !isCollapsed && 'hover:translate-x-1'
            )}
            title={isCollapsed ? item.name : undefined}
          >
              <item.icon className={cn(
                  "transition-colors",
                  isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
                  isCurrent ? "text-accent-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
              )}/>
              {!isCollapsed && <span>{item.name}</span>}
              
              {/* Optional: Add a small dot for active state if we wanted to be very minimal, but background is better */}
          </Link>
        )
      })}
    </nav>
  )
}
