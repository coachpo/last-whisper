import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_024_Stats_Performance_Tab', () => {
  test('opens performance tab and verifies charts', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/', {waitUntil: 'domcontentloaded'})
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard ready for stats performance')

    dfs.record('Open Stats')
    await page.getByRole('link', {name: 'Stats', exact: true}).first().click()
    await expect(page.getByRole('heading', {name: 'Statistics'})).toBeVisible({timeout: 15000})

    dfs.record('Switch to Performance tab')
    await page.getByRole('tab', {name: 'Performance'}).click()
    await expect(page.getByText('Performance by Difficulty')).toBeVisible()
    await expect(page.getByText('Performance Insights')).toBeVisible()

    await dfs.attach(testInfo)
  })
})
