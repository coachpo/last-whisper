import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {waitForMocksReady} from './fixtures/mock-utils'

test.describe('TC_010_Walkman_Filters', () => {
  test('expands filters, resets, and shows available items list', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await waitForMocksReady(page)
    dfs.record('Dashboard ready for walkman filters')

    dfs.record('Navigate to Walkman')
    await page.goto('/walkman')
    await expect(page.getByRole('heading', {name: 'Walkman'})).toBeVisible()

    dfs.record('Expand filters and reset')
    const toggleFilters = page.getByRole('button', {name: /(Show|Hide) Filters/i})
    if ((await toggleFilters.innerText()).includes('Show')) await toggleFilters.click()
    await expect(page.getByText('Locale').first()).toBeVisible()
    await page.getByRole('button', {name: 'Reset Filters'}).click()

    dfs.record('View available items accordion')
    const availableToggle = page.getByRole('button', {name: /Show Available Items/i})
    await availableToggle.click()
    await expect(page.getByRole('button', {name: /Hide Available Items/i})).toBeVisible()

    await dfs.attach(testInfo)
  })
})
