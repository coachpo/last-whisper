import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_025_Attempts_Good_Tab', () => {
  test('filters to Good tab and shows mid-tier attempts', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard ready for good tab filter')

    dfs.record('Open Attempts')
    await page.getByRole('navigation').getByRole('link', {name: 'Attempts', exact: true}).click()
    await expect(page.getByRole('heading', {name: 'Practice Attempts'})).toBeVisible({timeout: 15000})
    await expect(page.getByRole('heading', {name: 'Practice Attempts'})).toBeVisible()

    dfs.record('Switch to Good tab')
    await page.getByRole('tab', {name: /Good/}).click()
    await expect(page.getByText('Showing 1 of')).toBeVisible()

    await dfs.attach(testInfo)
  })
})
