import {expect, test} from '@playwright/test'

import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {waitForMocksReady} from './fixtures/mock-utils'

test.describe('TC_041_Items_Tag_Filtering', () => {
  test('applies and clears tag filter via selector', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await waitForMocksReady(page)
    dfs.record('Dashboard ready for navigation')

    dfs.record('Navigate to Items view')
    await page.getByRole('navigation').getByRole('link', {name: 'Items', exact: true}).click()
    await expect(page).toHaveURL(/\/items$/)
    await expect(page.getByRole('heading', {name: 'Dictation Items'})).toBeVisible()
    await expect(page.getByTestId('item-card').first()).toBeVisible()

    dfs.record('Open tag selector and choose travel tag')
    const tagSelectorTrigger = page.getByRole('button', {name: 'Filter by tags...'})
    await expect(tagSelectorTrigger).toBeEnabled()
    await page.evaluate(() => {
      const trigger = Array.from(document.querySelectorAll('button'))
        .find((el) => el.textContent?.includes('Filter by tags...')) as HTMLButtonElement | undefined
      trigger?.click()
    })
    const travelOption = page.getByRole('option', {name: 'travel'})
    await expect(travelOption).toBeVisible()
    await travelOption.click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', {name: '1 tags selected'})).toBeVisible()
    await expect(page.getByText(/Showing 2 of 2 items/)).toBeVisible()

    dfs.record('Reset filters to clear tag selection')
    await page.getByRole('button', {name: 'Reset Filters'}).click()
    await expect(page.getByRole('button', {name: 'Filter by tags...'})).toBeVisible()
    await expect(page.getByRole('button', {name: '1 tags selected'})).toHaveCount(0)

    await dfs.attach(testInfo)
  })
})
