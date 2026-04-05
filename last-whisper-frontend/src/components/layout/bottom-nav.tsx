
import {Link} from 'react-router-dom'
import {useLocation} from 'react-router-dom'
import {cn} from '@/lib/utils'
import {BarChart3, BookOpen, Home, Play} from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Library', href: '/items', icon: BookOpen },
  { name: 'Practice', href: '/practice', icon: Play },
  { name: 'Stats', href: '/stats', icon: BarChart3 },
]

export function BottomNav() {
  const {pathname} = useLocation()

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-background/80 backdrop-blur-lg md:hidden safe-area-inset">
      <nav className="grid h-16 grid-cols-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'group flex flex-col items-center justify-center space-y-1 rounded-md px-2 py-1 text-xs font-medium transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:bg-accent/20 hover:text-foreground'
              )}
            >
              <div className={cn(
                  "flex h-9 w-12 items-center justify-center rounded-full transition-colors duration-200",
                  isActive ? "bg-primary/10" : "bg-transparent group-hover:bg-accent/40"
              )}>
                  <item.icon className={cn("h-5 w-5", isActive && "fill-current")} />
              </div>
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
