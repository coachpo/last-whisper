import {expect, type Page} from '@playwright/test'

type MockAwareWindow = Window & {
  __MOCK_FETCH_ENABLED__?: boolean
}

export async function waitForMocksReady(page: Page) {
  await expect.poll(async () => page.evaluate(() => {
    const scopedWindow = window as MockAwareWindow
    return Boolean(scopedWindow.__MOCK_FETCH_ENABLED__)
  })).toBeTruthy()
}
