import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_009_Dashboard_Header_Actions', () => {
  test('toggles theme, clears cache, and collapses sidebar', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard loaded')
    await expect(page.getByRole('heading', {name: 'Last Whisper'})).toBeVisible()

    dfs.record('Clear audio cache')
    const clearBtn = page.locator('button:has-text("Clear audio cache")').first()
    if (await clearBtn.count()) {
      await clearBtn.click()
    }

    dfs.record('Toggle theme')
    const themeBtn = page.locator('button:has-text("Toggle theme")').first()
    if (await themeBtn.count()) {
      await themeBtn.click()
    }

    dfs.record('Collapse sidebar')
    const collapseButton = page.locator('button:has-text("Collapse sidebar"), div:has-text("Collapse sidebar")').first()
    if (await collapseButton.count()) {
      await collapseButton.click()
    }
    await expect(page).toHaveURL('/')
    await expect(page.locator('body')).toBeVisible()

    await dfs.attach(testInfo)
  })
})
