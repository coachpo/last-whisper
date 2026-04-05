import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {waitForMocksReady} from './fixtures/mock-utils'

test.describe('TC_003_Stats_Insights', () => {
  test('explores stats tabs with deterministic data', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await waitForMocksReady(page)
    dfs.record('Home ready for stats navigation')

    dfs.record('Open stats from sidebar navigation')
    await page.goto('/stats')
    await expect(page.getByRole('heading', {name: 'Statistics'})).toBeVisible({timeout: 15000})

    const summaryCardLabels = ['Total Attempts', 'Items Practiced', 'Average Score', 'Best Score']
    for (const label of summaryCardLabels) {
      const card = page
        .getByRole('heading', {name: label})
        .locator('xpath=ancestor::div[contains(@class,"card")]')
      await expect(card).toContainText(/\d/)
    }

    dfs.record('Inspect overview tab charts')
    await expect(page.getByText('Score Distribution')).toBeVisible()
    await expect(page.getByText('Recent Performance')).toBeVisible()

    dfs.record('Switch to performance tab')
    await page.getByRole('tab', {name: 'Performance'}).click()
    await expect(page.getByText('Performance by Difficulty')).toBeVisible()
    await expect(page.getByText('Performance Insights')).toBeVisible()

    dfs.record('Switch to practice log tab')
    await page.getByRole('tab', {name: 'Practice Log'}).click()
    await expect(page.getByRole('heading', {name: 'Practice Log'})).toBeVisible()
    const emptyPracticeState = page.getByRole('heading', {name: /No practice data/i})
    if (await emptyPracticeState.count()) {
      await expect(emptyPracticeState).toBeVisible()
    } else {
      const practiceAction = page.getByRole('button', {name: /Practice/i}).first()
      await expect(practiceAction).toBeVisible()
    }

    dfs.record('Return to overview tab')
    await page.getByRole('tab', {name: 'Overview'}).click()
    await expect(page.getByText('Score Distribution')).toBeVisible()

    await dfs.attach(testInfo)
  })
})
