
import {Badge} from '@/components/ui/badge'
import {AlertCircle, AlertTriangle, CheckCircle, Info} from 'lucide-react'
import {useHealthStatus} from '@/hooks/use-health-status'
import {cn} from '@/lib/utils'
import {Button} from '@/components/ui/button'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import type {HealthCheckEntry, HealthServiceInfoEntry, HealthStatusValue} from '@/types/api'

const STATUS_META: Record<HealthStatusValue, {
  label: string
  icon: typeof CheckCircle
  badgeVariant: 'default' | 'secondary' | 'destructive'
  badgeClass: string
  iconClass: string
}> = {
  healthy: {
    label: 'Healthy',
    icon: CheckCircle,
    badgeVariant: 'default',
    badgeClass: 'text-success bg-success/10 border-success/20',
    iconClass: 'text-green-500'
  },
  unhealthy: {
    label: 'Unhealthy',
    icon: AlertTriangle,
    badgeVariant: 'secondary',
    badgeClass: 'text-warning bg-warning/10 border-warning/20',
    iconClass: 'text-orange-500'
  },
  error: {
    label: 'Error',
    icon: AlertCircle,
    badgeVariant: 'destructive',
    badgeClass: 'text-destructive bg-destructive/10 border-destructive/20',
    iconClass: 'text-red-500'
  },
  informational: {
    label: 'Informational',
    icon: Info,
    badgeVariant: 'secondary',
    badgeClass: 'text-info bg-info/10 border-info/20',
    iconClass: 'text-blue-500'
  }
}

function isHealthStatusValue(value: unknown): value is HealthStatusValue {
  return value === 'healthy' || value === 'unhealthy' || value === 'error' || value === 'informational'
}

function normalizeEntry(value: unknown): HealthCheckEntry | null {
  if (!value) {
    return null
  }
  if (typeof value === 'object' && 'status' in value) {
    const status = (value as { status?: unknown }).status
    if (isHealthStatusValue(status)) {
      return value as HealthCheckEntry
    }
  }
  if (typeof value === 'string' && isHealthStatusValue(value)) {
    return { status: value }
  }
  return null
}

function normalizeServiceInfo(value: unknown): HealthServiceInfoEntry | null {
  const entry = normalizeEntry(value)
  if (!entry) {
    return null
  }
  return entry as HealthServiceInfoEntry
}

function formatCheckLabel(key: string): string {
  if (key === 'tts_service') {
    return 'TTS Service'
  }
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function HealthStatus() {
  const {data: health, isLoading, error} = useHealthStatus()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-8 h-8" aria-live="polite" aria-label="Checking system health">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error || !health) {
    return (
      <div className="flex items-center space-x-2" aria-live="assertive" role="status">
        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
        <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">System Error</span>
        <span className="text-xs sm:text-sm text-muted-foreground sm:hidden">Error</span>
        <Badge variant="destructive" className="text-xs">
          Offline
        </Badge>
      </div>
    )
  }

  const overallMeta = STATUS_META[health.status]
  const isHealthy = health.status === 'healthy'
  const normalizedEntries = Object.entries(health.checks)
    .filter(([key]) => key !== 'service_info')
    .map(([key, value]) => {
      const entry = normalizeEntry(value)
      return entry ? { key, entry } : null
    })
    .filter((item): item is { key: string; entry: HealthCheckEntry } => Boolean(item))

  const serviceIssues = normalizedEntries.filter(({entry}) => entry.status !== 'healthy').length
  const serviceInfo = normalizeServiceInfo(health.checks.service_info)
  const serviceLabel = serviceInfo?.name ?? 'System'
  const serviceVersion = serviceInfo?.version
  const serviceTimestamp = serviceInfo?.timestamp
  const serviceDetail = serviceInfo?.detail
  const SummaryIcon = overallMeta.icon
  const summaryBadgeVariant = overallMeta.badgeVariant
  const summaryBadgeClass = overallMeta.badgeClass
  const summaryBadgeText = overallMeta.label
  const summaryIconClass = overallMeta.iconClass
  const showPulseIndicator = isHealthy && serviceIssues === 0

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) {
      return 'Not available'
    }
    const parsed = new Date(timestamp)
    if (Number.isNaN(parsed.getTime())) {
      return timestamp
    }
    return parsed.toLocaleString()
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn('hover:bg-transparent', showPulseIndicator ? 'h-8 w-8 rounded-full p-0' : 'h-auto px-2')}
        >
          {showPulseIndicator ? (
            <div className="relative flex h-3 w-3" title="System Status: Healthy" aria-live="polite" role="status">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <SummaryIcon className={cn('h-4 w-4 sm:h-5 sm:w-5', summaryIconClass)} />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[11px] uppercase text-muted-foreground tracking-wide">System Status</span>
                <span className="text-xs sm:text-sm font-medium">{serviceLabel}</span>
                {serviceVersion && <span className="text-[11px] text-muted-foreground">v{serviceVersion}</span>}
              </div>
              <Badge variant={summaryBadgeVariant} className={cn('text-xs', summaryBadgeClass)}>
                {summaryBadgeText}
              </Badge>
              {serviceIssues > 0 && (
                <Badge variant="secondary" className="text-xs text-warning bg-warning/10 border-warning/20">
                  {serviceIssues} issue{serviceIssues !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start" aria-live="polite">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">System Health Details</h4>
          </div>

          <div className="space-y-2">
            {normalizedEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subsystem checks reported.</p>
            ) : (
              normalizedEntries.map(({key, entry}) => {
                const meta = STATUS_META[entry.status]
                const EntryIcon = meta.icon
                const shouldShowDetail = Boolean(entry.detail) && (entry.status === 'unhealthy' || entry.status === 'error')

                return (
                  <div key={key} className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <EntryIcon className={cn('h-4 w-4', meta.iconClass)} />
                      <span className="text-sm font-medium">{formatCheckLabel(key)}</span>
                    </div>
                    <div className="text-right">
                      <Badge variant={meta.badgeVariant} className={cn('text-xs', meta.badgeClass)}>
                        {meta.label}
                      </Badge>
                      {shouldShowDetail && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-48">
                          {entry.detail}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="pt-2 border-t space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {serviceLabel}
              </Badge>
              {serviceVersion && (
                <Badge variant="secondary" className="text-xs">
                  v{serviceVersion}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Last Check: {formatTimestamp(serviceTimestamp)}
            </div>
            {serviceDetail && (serviceInfo?.status === 'unhealthy' || serviceInfo?.status === 'error') && (
              <div className="text-xs text-destructive">
                {serviceDetail}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
