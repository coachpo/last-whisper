
import {Button} from '@/components/ui/button'
import {Menu} from 'lucide-react'
import {ThemeToggle} from '@/components/theme/theme-toggle'
import {useSidebar} from '@/contexts/sidebar-context'
import {HealthStatus} from './health-status'
import {CacheCleanupButton} from '@/components/cache/cache-cleanup-button'
import {EnvironmentIndicator} from '@/components/layout/environment-indicator'

export function Header() {
  const {toggleSidebar} = useSidebar()

  const handleToggle = () => {
    // On mobile, if it's collapsed (closed), we want to open it (make isCollapsed false)
    // If it's not collapsed (open), we want to close it (make isCollapsed true)
    toggleSidebar()
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="md:hidden -ml-2 text-muted-foreground hover:text-foreground"
            aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5"/>
        </Button>
          <div className="flex items-center gap-2">
            <HealthStatus/>
            <div className="hidden md:block">
                <EnvironmentIndicator/>
            </div>
          </div>
      </div>

      <div className="flex items-center gap-2">
        <CacheCleanupButton />
        <ThemeToggle/>
      </div>
    </header>
  )
}
