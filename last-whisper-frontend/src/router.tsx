import {Route, Routes} from 'react-router-dom'
import {MainLayout} from '@/components/layout/main-layout'
import {Dashboard} from '@/components/dashboard/dashboard'
import {ItemsPage} from '@/components/items/items-page'
import {PracticePage} from '@/components/practice/practice-page'
import {WalkmanPage} from '@/components/walkman/walkman-page'
import {StatsPage} from '@/components/stats/stats-page'
import {AttemptsPage} from '@/components/attempts/attempts-page'
import {TagsPage} from '@/components/tags/tags-page'
import {ErrorBoundary} from '@/components/ui/error-boundary'

function DashboardRoute() {
  return (
    <MainLayout>
      <ErrorBoundary>
        <Dashboard />
      </ErrorBoundary>
    </MainLayout>
  )
}

function LayoutRoute({children}: {children: React.ReactNode}) {
  return <MainLayout>{children}</MainLayout>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardRoute />} />
      <Route path="/items" element={<LayoutRoute><ItemsPage /></LayoutRoute>} />
      <Route path="/practice" element={<PracticePage />} />
      <Route path="/walkman" element={<LayoutRoute><WalkmanPage /></LayoutRoute>} />
      <Route path="/stats" element={<LayoutRoute><StatsPage /></LayoutRoute>} />
      <Route path="/attempts" element={<LayoutRoute><AttemptsPage /></LayoutRoute>} />
      <Route path="/tags" element={<LayoutRoute><TagsPage /></LayoutRoute>} />
    </Routes>
  )
}
