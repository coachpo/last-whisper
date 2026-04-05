import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {mockItemsResponse} from './fixtures/api-mocks'

test.describe('TC_002_Items_Management', () => {
  test('manages filters and dialogs on items page with DFS trace', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Landing on dashboard')

    dfs.record('Navigate to Items via sidebar')
    await page.getByRole('navigation').getByRole('link', {name: 'Items', exact: true}).click()
    await expect(page.getByRole('heading', {name: 'Dictation Items'})).toBeVisible({timeout: 15000})
    await expect(page.getByRole('heading', {name: 'Dictation Items'})).toBeVisible()

    const summaryText = `Showing ${mockItemsResponse.items.length} of ${mockItemsResponse.total} items`
    await expect(page.getByText(summaryText)).toBeVisible()

    dfs.record('Expand filters panel')
    const toggleFiltersButton = page.getByRole('button', {name: /(Show|Hide) Filters/i}).first()
    if ((await toggleFiltersButton.textContent())?.includes('Show')) {
      await toggleFiltersButton.click()
    }
    await expect(page.locator('label', {hasText: 'Locale'})).toBeVisible()
    const tagTrigger = page.locator('button[role="combobox"],button', {hasText: /tags/i}).first()
    await tagTrigger.scrollIntoViewIfNeeded()
    await expect(tagTrigger).toBeVisible()

    dfs.record('Reset filters')
    await page.getByRole('button', {name: 'Reset Filters'}).click()

    dfs.record('Inspect first item card')
    await expect(page.getByText(mockItemsResponse.items[0].locale)).toBeVisible()
    await expect(page.getByRole('heading', {name: /Practice mindful listening/i})).toBeVisible()

    dfs.record('Open add item dialog and close')
    await page.getByRole('button', {name: 'Add Item'}).click()
    await expect(page.getByRole('heading', {name: 'Create New Dictation Item'})).toBeVisible()
    await page.keyboard.press('Escape')

    dfs.record('Toggle bulk create dialog preview')
    await page.getByRole('button', {name: 'Bulk Create'}).click()
    const bulkDialog = page.locator('[role="dialog"]').filter({hasText: 'Bulk Create Dictation Items'})
    await bulkDialog.waitFor({state: 'visible'})
    await expect(bulkDialog.getByRole('heading', {name: 'Bulk Create Dictation Items'})).toBeVisible()
    await page.keyboard.press('Escape')

    await dfs.attach(testInfo)
  })
})
