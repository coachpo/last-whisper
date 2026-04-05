import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_015_Attempts_Date_Filter', () => {
  test('applies since/until filters and updates summary', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard ready for attempts date filters')

    dfs.record('Navigate to Attempts')
    await page.getByRole('navigation').getByRole('link', {name: 'Attempts', exact: true}).click()
    await expect(page).toHaveURL(/\/attempts/)
    await expect(page.getByRole('heading', {name: 'Practice Attempts'})).toBeVisible()

    dfs.record('Expand filters and set dates')
    const toggle = page.getByRole('button', {name: /(Show|Hide) Filters/i}).first()
    if ((await toggle.textContent())?.includes('Show')) {
      await toggle.click()
    }

    // Pick two dates from the date pickers
    const sinceBtn = page.getByRole('button', {name: /Select start date/i})
    await sinceBtn.click()
    await page.getByRole('button', {name: /^\d+$/}).first().click()

    const untilBtn = page.getByRole('button', {name: /Select end date/i})
    await untilBtn.click()
    await page.getByRole('button', {name: /^\d+$/}).nth(1).click()

    dfs.record('Apply filters')
    await page.getByRole('button', {name: 'Apply Filters'}).click()

    dfs.record('Verify summary mentions dates')
    await expect(page.getByText(/Showing .*since .*until/i).first()).toBeVisible()

    await dfs.attach(testInfo)
  })
})
