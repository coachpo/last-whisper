
import {Sidebar} from './sidebar'
import {Header} from './header'
import {BottomNav} from './bottom-nav'

import {PageLoading} from '@/components/ui/page-loading'
import {useSidebar} from '@/contexts/sidebar-context'
import {useLoading} from '@/contexts/loading-context'
import {cn} from '@/lib/utils'
import {AppFooter} from '@/components/layout/app-footer'

interface MainLayoutProps {
  children: React.ReactNode
  focusMode?: boolean
}

export function MainLayout({ children, focusMode = false }: MainLayoutProps) {
    const {isCollapsed, isMobile} = useSidebar()
    const {isLoading} = useLoading()

  return (
    <div className="flex h-screen bg-background">
      {!focusMode && <Sidebar />}
        <div className={cn(
            "flex flex-1 flex-col overflow-hidden transition-all duration-300",
            !focusMode && !isMobile && isCollapsed && "ml-0"
        )}>
        {!focusMode && (
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Skip to main content
          </a>
        )}
        {!focusMode && <Header />}
            <main
                id="main-content"
                className="relative flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6"
                aria-busy={isLoading}
            >
          {children}
                <PageLoading isLoading={isLoading}/>
                <AppFooter/>
        </main>
        {!focusMode && <BottomNav />}
      </div>

    </div>
  )
}
