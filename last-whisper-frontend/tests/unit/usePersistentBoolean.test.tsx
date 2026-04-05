import {act, renderHook} from '@testing-library/react'
import {describe, expect, it, beforeEach} from 'vitest'

import {usePersistentBoolean} from '@/hooks/usePersistentBoolean'

describe('usePersistentBoolean', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns the default value when storage is empty', () => {
    const {result} = renderHook(() => usePersistentBoolean('test-key', true))
    expect(result.current[0]).toBe(true)
  })

  it('reads the stored value on mount', () => {
    window.localStorage.setItem('test-key', 'false')
    const {result} = renderHook(() => usePersistentBoolean('test-key', true))
    expect(result.current[0]).toBe(false)
  })

  it('persists updates to localStorage', () => {
    const {result} = renderHook(() => usePersistentBoolean('persist-key', false))

    act(() => {
      const [, setValue] = result.current
      setValue(true)
    })

    expect(window.localStorage.getItem('persist-key')).toBe('true')
    expect(result.current[0]).toBe(true)
  })

  it('supports reset helper to restore defaults', () => {
    window.localStorage.setItem('reset-key', 'true')
    const {result} = renderHook(() => usePersistentBoolean('reset-key', true))

    act(() => {
      const [, setValue] = result.current
      setValue(false)
    })

    act(() => {
      const [, , reset] = result.current
      reset()
    })

    expect(result.current[0]).toBe(true)
    expect(window.localStorage.getItem('reset-key')).toBe('true')
  })
})
