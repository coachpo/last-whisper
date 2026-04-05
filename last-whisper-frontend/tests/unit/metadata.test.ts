import {describe, it, expect} from 'vitest'
import {
  buildOptionsFromCodes,
  DEFAULT_LOCALE_OPTIONS,
  DEFAULT_TRANSLATION_LANG_OPTIONS,
  ensureValidSelection,
} from '@/lib/metadata'

describe('metadata helpers', () => {
  it('returns fallback options when codes are missing', () => {
    const options = buildOptionsFromCodes(undefined, DEFAULT_LOCALE_OPTIONS)
    expect(options).toEqual(DEFAULT_LOCALE_OPTIONS)
  })

  it('builds options from language objects using provided names', () => {
    const options = buildOptionsFromCodes([
      {language_code: 'en', language_name: 'English'},
      {language_code: 'fi', language_name: 'Suomi'},
    ])
    expect(options).toEqual([
      {value: 'en', label: 'English'},
      {value: 'fi', label: 'Suomi'},
    ])
  })

  it('removes duplicate codes', () => {
    const options = buildOptionsFromCodes([
      {language_code: 'en', language_name: 'English'},
      {language_code: 'en', language_name: 'English (US)'},
      {language_code: 'fi'},
      'fi',
    ], DEFAULT_TRANSLATION_LANG_OPTIONS)
    expect(options).toEqual([
      {value: 'en', label: 'English'},
      {value: 'fi', label: 'Fi'},
    ])
  })

  it('ensures selected value remains valid', () => {
    const options = buildOptionsFromCodes([
      {language_code: 'en', language_name: 'English'},
      {language_code: 'fi', language_name: 'Suomi'},
    ])
    expect(ensureValidSelection('zh', options, 'en')).toBe('en')
    expect(ensureValidSelection('fi', options, 'en')).toBe('fi')
  })

  it('falls back to title-cased code when name is missing', () => {
    const options = buildOptionsFromCodes(['pt-br'])
    expect(options).toEqual([{ value: 'pt-br', label: 'Pt Br' }])
  })
})
