import {expect, test} from '@playwright/test'

import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {waitForMocksReady} from './fixtures/mock-utils'
import type {AttemptsListResponse} from '@/types/api'

const emptyAttemptsResponse: AttemptsListResponse = {
  attempts: [],
  total: 0,
  page: 1,
  per_page: 20,
  total_pages: 1,
}

test.describe('TC_042_Attempts_Filters_Tabs', () => {
  test('handles empty attempts with filters, tabs, and CTA navigation', async ({page}, testInfo) => {
    await setupApiMocks(page, {attempts: emptyAttemptsResponse})
    const dfs = createDfsRecorder()

    await page.goto('/')
    await waitForMocksReady(page)
    dfs.record('Dashboard ready for navigation')

    dfs.record('Navigate to Attempts view')
    await page.getByRole('navigation').getByRole('link', {name: 'Attempts', exact: true}).click()
    await expect(page).toHaveURL(/\/attempts$/)
    await expect(page.getByRole('heading', {name: 'Practice Attempts'})).toBeVisible()

    dfs.record('Toggle filters panel visibility')
    const filterToggle = page.getByRole('button', {name: /Show Filters|Hide Filters/})
    await expect(filterToggle).toHaveText(/Show Filters/i)
    await filterToggle.click()
    await expect(filterToggle).toHaveText(/Hide Filters/i)

    dfs.record('Apply filters with custom per-page and item id')
    const perPageInput = page.getByLabel('Items Per Page')
    const itemIdInput = page.getByLabel('Item ID')
    await perPageInput.fill('10')
    await itemIdInput.fill('101')
    await page.getByRole('button', {name: 'Apply Filters'}).click()
    await expect(page.getByText(/for item #101/)).toBeVisible()
    await expect(page.getByText('Showing 0 of 0 attempts')).toBeVisible()
    await expect(page.getByText('Page 1 of 1')).toBeVisible()

    dfs.record('Reset filters to defaults')
    await page.getByRole('button', {name: 'Reset'}).click()
    await expect(perPageInput).toHaveValue('20')
    await expect(itemIdInput).toHaveValue('')
    await expect(page.getByText(/for item #101/)).toHaveCount(0)

    dfs.record('Cycle through performance tabs')
    const excellentTab = page.getByRole('tab', {name: /Excellent/i})
    await excellentTab.click()
    await expect(excellentTab).toHaveAttribute('aria-selected', 'true')
    const allTab = page.getByRole('tab', {name: /All/i})
    await allTab.click()
    await expect(allTab).toHaveAttribute('aria-selected', 'true')

    dfs.record('Use zero-state CTA to reach Practice flow')
    await page.getByRole('button', {name: 'Start Practicing'}).click()
    await expect(page).toHaveURL(/\/practice/)
    await expect(page.getByRole('heading', {name: 'Practice'})).toBeVisible()

    await dfs.attach(testInfo)
  })
})
