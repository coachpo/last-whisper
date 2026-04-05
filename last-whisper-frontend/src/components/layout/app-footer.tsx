
import {useMetadata} from '@/contexts/metadata-context'

export function AppFooter() {
  const { metadata, docsUrl } = useMetadata()
  const version = metadata?.service?.version ?? 'Unknown version'
  const shortCommit = metadata?.build?.short_commit ?? metadata?.build?.commit?.slice(0, 7)

  return (
    <footer className="mt-8 border-t pt-4 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
      <span>
        Version {version}
        {shortCommit ? ` · ${shortCommit}` : ''}
      </span>
      {docsUrl ? (
        <a href={docsUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
          Release notes
        </a>
      ) : (
        <span>Schema {metadata?.service?.schema_version ?? 'unknown'}</span>
      )}
    </footer>
  )
}
