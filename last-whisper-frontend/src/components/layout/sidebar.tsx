
import {Navigation} from './navigation'
import {Mic} from 'lucide-react'
import {useSidebar} from '@/contexts/sidebar-context'
import {cn} from '@/lib/utils'

export function Sidebar() {
    const {isCollapsed, isMobile, toggleSidebar, closeSidebar} = useSidebar()

  return (
      <>
          {/* Mobile overlay */}
          {isMobile && !isCollapsed && (
              <div
                  className="fixed inset-0 z-40 bg-black/50 md:hidden"
                  onClick={closeSidebar}
              />
          )}

          {/* Sidebar */}
          <div className={cn(
              "flex h-full flex-col border-r bg-background transition-all duration-300",
              isMobile
                  ? "fixed left-0 top-0 z-50 w-64 transform"
                  : "relative w-64",
              isMobile && isCollapsed && "-translate-x-full",
              !isMobile && isCollapsed && "w-24"
          )}>
              {/* Header */}
              <button
                  type="button"
                  className={cn(
                      "relative flex h-16 w-full items-center border-b transition-colors duration-200",
                      !isMobile && "cursor-pointer hover:bg-accent/30",
                      isMobile && "cursor-pointer active:bg-accent/30",
                      isCollapsed ? "justify-center px-2" : "px-6"
                  )}
                  onClick={isMobile ? closeSidebar : toggleSidebar}
                  title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  aria-expanded={!isCollapsed}
                  aria-label={isMobile ? "Close sidebar" : "Toggle sidebar"}
              >
                  {!isCollapsed && (
                      <div className="flex items-center gap-3">
                          <div
                              className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm">
                              <Mic className="h-5 w-5"/>
                        </div>
                          <h1 className="text-lg font-semibold tracking-tight text-foreground">Last
                              Whisper</h1>
                      </div>
                  )}
                  {isCollapsed && (
                      <div className="flex w-full items-center justify-center">
                          <div
                              className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm">
                              <Mic className="h-5 w-5"/>
                          </div>
                      </div>
                  )}


              </button>

              {/* Navigation */}
              <div className={cn(
                  "flex-1",
                  isCollapsed ? "p-2" : "p-3"
              )}>
                  <Navigation isCollapsed={isCollapsed}/>
              </div>


          </div>
      </>
  )
}
