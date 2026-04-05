import type {LanguageOption} from '@/types/api'

export type SelectOption = {
  value: string
  label: string
}

export const DEFAULT_LOCALE_OPTIONS: SelectOption[] = [
  { value: 'en', label: 'English' },
  { value: 'fi', label: 'Finnish' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'zh-TW', label: 'Chinese (Traditional)' },
]

export const DEFAULT_TRANSLATION_LANG_OPTIONS: SelectOption[] = [
  { value: 'en', label: 'English' },
  { value: 'fi', label: 'Finnish' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'zh-TW', label: 'Chinese (Traditional)' },
]

export const DEFAULT_DIFFICULTY_FILTER_OPTIONS: SelectOption[] = [
  { value: '1', label: '1 - Beginner' },
  { value: '2', label: '2 - Easy' },
  { value: '3', label: '3 - Medium' },
  { value: '4', label: '4 - Challenging' },
  { value: '5', label: '5 - Expert' },
]

export const DEFAULT_METADATA_LIMITS = {
  maxItemsPerBulkRequest: 100,
  maxTagsPerItem: 20,
  maxTagLength: 50,
  maxTextLength: 10000,
}

function titleCase(value: string) {
  return value
    .split(/[-_]/)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function normalizeOption(option: SelectOption): SelectOption {
  return {
    value: option.value,
    label: option.label || titleCase(option.value),
  }
}

type LanguageInput = string | LanguageOption

function normalizeLanguage(input: LanguageInput): { code: string; name?: string } | null {
  if (typeof input === 'string') {
    const trimmed = input.trim()
    return trimmed ? { code: trimmed } : null
  }

  const code = input.language_code?.trim()
  if (!code) {
    return null
  }

  const name = input.language_name?.trim()
  return { code, name }
}

export function buildOptionsFromCodes(
  codes?: LanguageInput[] | null,
  fallback: SelectOption[] = [],
): SelectOption[] {
  if (!codes?.length) {
    return fallback
  }

  const seen = new Set<string>()
  const options: SelectOption[] = []

  for (const entry of codes) {
    const normalized = normalizeLanguage(entry)
    if (!normalized) {
      continue
    }

    const { code, name } = normalized
    if (seen.has(code)) {
      continue
    }
    seen.add(code)

    options.push(normalizeOption({ value: code, label: name ?? '' }))
  }

  return options.length > 0 ? options : fallback
}

export function ensureValidSelection(
  selected: string | undefined,
  options: SelectOption[],
  fallback?: string,
): string | undefined {
  if (selected && options.some(option => option.value === selected)) {
    return selected
  }
  if (fallback) {
    return fallback
  }
  return options[0]?.value ?? selected
}
