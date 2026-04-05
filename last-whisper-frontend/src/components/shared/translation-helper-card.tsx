
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import type {SelectOption} from '@/lib/metadata'
import type {Translation} from '@/types/api'
import {AlertTriangle, Globe, Loader2, RefreshCw} from 'lucide-react'

interface TranslationHelperCardProps {
  translation: Translation | null
  translationLang: string
  translationOptions: SelectOption[]
  currentLocale?: string | null
  isBusy: boolean
  isLoading: boolean
  errorMessage?: string | null
  onTranslate: () => void
  onRefresh: () => void
  onTargetLangChange: (lang: string) => void
  onCheckCache?: () => void
  title?: string
  description?: string
}

export function TranslationHelperCard({
  translation,
  translationLang,
  translationOptions,
  currentLocale,
  isBusy,
  isLoading,
  errorMessage,
  onTranslate,
  onRefresh,
  onTargetLangChange,
  onCheckCache,
  title = 'Translation helper',
  description = 'Translations are cached. Update to refresh.',
}: TranslationHelperCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>{title}</span>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {translation && (
            <Badge variant={translation.cached ? 'secondary' : 'default'}>
              {translation.cached ? 'Cached' : 'Fresh'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="translation-target-lang">Target language</Label>
            <Select value={translationLang} onValueChange={onTargetLangChange}>
              <SelectTrigger id="translation-target-lang">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {translationOptions.map(lang => (
                  <SelectItem key={lang.value} value={lang.value} disabled={lang.value === currentLocale}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button onClick={onTranslate} disabled={isBusy}>
              {isBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Working…
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {translation ? 'Update' : 'Translate'}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onRefresh} disabled={isBusy}>
              {isBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing…
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Force refresh
                </>
              )}
            </Button>
            {onCheckCache && (
              <Button variant="outline" size="sm" onClick={onCheckCache} disabled={isBusy}>
                Check cache
              </Button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-start space-x-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading translation…</span>
          </div>
        ) : translation ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {(translation.source_lang || currentLocale || 'unknown').toUpperCase()} → {(translation.target_lang || translationLang || 'unknown').toUpperCase()}
              </Badge>
              <Badge variant={translation.cached ? 'secondary' : 'default'}>
                {translation.cached ? 'Cached' : 'Fresh'}
              </Badge>
              <Badge variant="outline">{translation.provider}</Badge>
              <Badge variant="outline">{translation.status}</Badge>
            </div>
            <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
              {translation.translated_text}
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground" aria-live="polite">
            No cached translation yet. Use Translate to create one or Refresh to bypass cache.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
