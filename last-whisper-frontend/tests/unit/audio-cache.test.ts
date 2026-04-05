import 'fake-indexeddb/auto'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/debug', () => ({
  debug: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
  },
}))

import {audioCache} from '@/lib/audio-cache'

const getInternalNumber = (property: 'maxCacheSize' | 'maxAge'): number => {
  return Reflect.get(audioCache, property) as number
}

const setInternalNumber = (property: 'maxCacheSize' | 'maxAge', value: number) => {
  Reflect.set(audioCache, property, value)
}

const defaultMaxCacheSize = getInternalNumber('maxCacheSize')
const defaultMaxAge = getInternalNumber('maxAge')

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('audioCache', () => {
  beforeEach(async () => {
    setInternalNumber('maxCacheSize', defaultMaxCacheSize)
    setInternalNumber('maxAge', defaultMaxAge)
    await audioCache.clearCache()
  })

  afterEach(async () => {
    await audioCache.clearCache()
    setInternalNumber('maxCacheSize', defaultMaxCacheSize)
    setInternalNumber('maxAge', defaultMaxAge)
  })

  it('stores and retrieves audio entries', async () => {
    const buffer = new TextEncoder().encode('hello world').buffer
    await audioCache.setAudio(1, buffer, 'audio/mpeg')

    const result = await audioCache.getAudio(1)
    expect(result).not.toBeNull()
    expect(result?.mimeType).toBe('audio/mpeg')
    expect(new TextDecoder().decode(result?.audioData ?? new ArrayBuffer(0))).toBe('hello world')
  })

  it('expires stale entries and removes them', async () => {
    const buffer = new Uint8Array([1, 2, 3]).buffer
    const baseNow = 1_000
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(baseNow)
    await audioCache.setAudio(2, buffer, 'audio/wav')

    nowSpy.mockReturnValue(baseNow + defaultMaxAge + 1)
    const result = await audioCache.getAudio(2)
    expect(result).toBeNull()
    nowSpy.mockRestore()
  })

  it('evicts oldest entries when cache exceeds max size', async () => {
    setInternalNumber('maxCacheSize', 8)
    const bufferA = new TextEncoder().encode('AAAAAA').buffer
    const bufferB = new TextEncoder().encode('BBBBBB').buffer

    await audioCache.setAudio(10, bufferA, 'audio/ogg')
    await audioCache.setAudio(11, bufferB, 'audio/ogg')
    await flushPromises()

    const firstEntry = await audioCache.getAudio(10)
    const secondEntry = await audioCache.getAudio(11)

    expect(firstEntry).toBeNull()
    expect(secondEntry).not.toBeNull()
  })

  it('clears the cache and reset stats', async () => {
    const buffer = new Uint8Array([9, 9, 9]).buffer
    await audioCache.setAudio(25, buffer, 'audio/mp3')
    await audioCache.clearCache()

    const stats = await audioCache.getCacheStats()
    expect(stats.entryCount).toBe(0)
    expect(stats.totalSize).toBe(0)
  })
})
