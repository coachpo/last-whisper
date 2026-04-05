import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_004_Attempts_History', () => {
  test('filters attempts and toggles tabs with DFS trace', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard ready for attempts navigation')

    dfs.record('Navigate to Attempts via sidebar')
    await page.getByRole('navigation').getByRole('link', {name: 'Attempts', exact: true}).click()
    await expect(page.getByRole('heading', {name: 'Practice Attempts'})).toBeVisible({timeout: 15000})

    dfs.record('Verify summary cards render values')
    const summaryLabels = ['Total Attempts', 'Average Score', 'Best Score', 'Needs Work']
    for (const label of summaryLabels) {
      const card = page
        .getByRole('heading', {name: label})
        .locator('xpath=ancestor::div[contains(@class,"card")]')
      await expect(card).toContainText(/\d/)
    }

    dfs.record('Expand filter panel')
    const toggleFilters = page.getByRole('button', {name: /(Show|Hide) Filters/i})
    if ((await toggleFilters.innerText()).includes('Show')) {
      await toggleFilters.click()
    }
    await expect(page.getByText('Since Date')).toBeVisible()

    dfs.record('Switch to needs work tab')
    await page.getByRole('tab', {name: /Needs Work/}).click()
    await expect(page.getByText(/Showing \d+ of \d+ attempts/i)).toBeVisible()
    const needsWorkEmptyState = page.getByRole('heading', {name: /No attempts found/i})
    if (await needsWorkEmptyState.count()) {
      await expect(needsWorkEmptyState).toBeVisible()
    }

    dfs.record('Return to all tab')
    await page.getByRole('tab', {name: /All \(/}).click()
    await expect(page.getByText(/Showing \d+ of \d+ attempts/i)).toBeVisible()

    await dfs.attach(testInfo)
  })
})
