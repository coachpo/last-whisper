import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {mockPracticeLogResponse} from './fixtures/api-mocks'

test.describe('TC_013_Stats_Practice_Log', () => {
  test('navigates practice log tab and verifies rows', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard ready for stats practice log')

    dfs.record('Open Stats')
    await page.getByRole('navigation').getByRole('link', {name: 'Stats', exact: true}).click()
    await expect(page).toHaveURL(/\/stats/)
    await expect(page.getByRole('heading', {name: 'Statistics'})).toBeVisible()

    dfs.record('Switch to Practice Log tab')
    await page.getByRole('tab', {name: 'Practice Log'}).click()
    await expect(page.getByRole('heading', {name: 'Practice Log'})).toBeVisible()

    dfs.record('Verify practice log rows from mock data')
    for (const entry of mockPracticeLogResponse.practice_log) {
      await expect(page.getByText(entry.text, {exact: false})).toBeVisible()
      await expect(page.getByText(entry.locale, {exact: false})).toBeVisible()
    }

    await dfs.attach(testInfo)
  })
})
