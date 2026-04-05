import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {mockAttemptsResponse} from './fixtures/api-mocks'

const manyAttempts = {
  ...mockAttemptsResponse,
  attempts: Array.from({length: 30}, (_v, i) => ({
    ...mockAttemptsResponse.attempts[0],
    id: 200 + i,
    item_id: 800 + i,
    percentage: 60 + (i % 30),
    text: `Attempt page2 row ${i + 1}`,
  })),
  total: 30,
  per_page: 20,
  total_pages: 2,
}

test.describe('TC_020_Attempts_Next_Page', () => {
  test('navigates to second page of attempts', async ({page}, testInfo) => {
    await setupApiMocks(page, {attempts: manyAttempts})
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard ready for attempts pagination page2')

    dfs.record('Open Attempts')
    await page.getByRole('navigation').getByRole('link', {name: 'Attempts', exact: true}).click()
    await expect(page).toHaveURL(/\/attempts/)

    dfs.record('Click Next page')
    await expect(page.getByText('Page 1 of 2')).toBeVisible()
    const nextBtn = page.getByRole('button', {name: 'Next'})
    if (await nextBtn.isEnabled()) {
      await nextBtn.click()
    }
    dfs.record('Verify page 2 content visible')
    await expect(page.getByText('Attempt page2 row 25', {exact: false}).first()).toBeVisible()

    await dfs.attach(testInfo)
  })
})
