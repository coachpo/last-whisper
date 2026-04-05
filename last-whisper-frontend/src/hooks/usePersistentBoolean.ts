
import {Dispatch, SetStateAction, useCallback, useEffect, useState} from 'react'

type PersistentBooleanReturn = [boolean, Dispatch<SetStateAction<boolean>>, () => void]

function readStoredValue(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') {
    return fallback
  }

  const stored = window.localStorage.getItem(key)
  if (stored === null) {
    return fallback
  }

  return stored === 'true'
}

export function usePersistentBoolean(key: string, defaultValue = false): PersistentBooleanReturn {
  const [value, setValue] = useState<boolean>(() => readStoredValue(key, defaultValue))

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(key, value ? 'true' : 'false')
  }, [key, value])

  useEffect(() => {
    setValue(readStoredValue(key, defaultValue))
  }, [key, defaultValue])

  const reset = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key)
    }
    setValue(defaultValue)
  }, [defaultValue, key])

  const setPersistentValue: Dispatch<SetStateAction<boolean>> = useCallback((update) => {
    setValue(prev => typeof update === 'function' ? (update as (prev: boolean) => boolean)(prev) : update)
  }, [])

  return [value, setPersistentValue, reset]
}
