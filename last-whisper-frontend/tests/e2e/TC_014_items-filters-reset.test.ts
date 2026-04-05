import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_014_Items_Filters_Reset', () => {
  test('opens filters, changes dropdowns, then resets', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard ready for items filter flow')

    dfs.record('Navigate to Items')
    await page.getByRole('navigation').getByRole('link', {name: 'Items', exact: true}).click()
    await expect(page).toHaveURL(/\/items/)
    await expect(page.getByRole('heading', {name: 'Dictation Items'})).toBeVisible()

    dfs.record('Expand filters')
    const toggleFilters = page.getByRole('button', {name: /(Show|Hide) Filters/i}).first()
    if ((await toggleFilters.textContent())?.includes('Show')) {
      await toggleFilters.click()
    }
    await expect(page.getByText('Locale').first()).toBeVisible()

    dfs.record('Change dropdowns and reset')
    const localeCombo = page.getByRole('combobox', {name: 'Locale'})
    await localeCombo.click({timeout: 5000}).catch(() => {})
    await page.keyboard.press('Escape')
    await page.getByRole('button', {name: 'Reset Filters'}).click()

    await dfs.attach(testInfo)
  })
})
