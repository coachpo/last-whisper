
import {Badge} from '@/components/ui/badge'
import {useMetadata} from '@/contexts/metadata-context'

export function EnvironmentIndicator() {
  const { metadata, isLoading, schemaVersion, expectedSchemaVersion, schemaVersionMismatch } = useMetadata()
  const environment = metadata?.service?.environment ?? 'unknown'
  const label = environment.charAt(0).toUpperCase() + environment.slice(1)

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Badge
        variant={environment === 'production' ? 'secondary' : 'outline'}
        className={schemaVersionMismatch ? 'border-destructive/50 text-destructive' : undefined}
      >
        {isLoading && !metadata ? 'Loading…' : label}
      </Badge>
      {schemaVersion && (
        <span className={schemaVersionMismatch ? 'text-destructive' : undefined}>
          Schema {schemaVersion}
          {schemaVersionMismatch && ` · expected ${expectedSchemaVersion}`}
        </span>
      )}
    </div>
  )
}
