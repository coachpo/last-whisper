import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {mockAttemptsResponse} from './fixtures/api-mocks'

const expandedAttempts = Array.from({length: 25}, (_v, i) => ({
  ...mockAttemptsResponse.attempts[0],
  id: 1000 + i,
  item_id: 500 + i,
  text: `Attempt ${i + 1} lorem ipsum`,
  percentage: 50 + (i % 45),
  created_at: new Date(Date.now() - i * 60_000).toISOString(),
}))

test.describe('TC_007_Attempts_Pagination_Filters', () => {
  test('applies filters and paginates attempts list with DFS trace', async ({page}, testInfo) => {
    await setupApiMocks(page, {
      attempts: {
        ...mockAttemptsResponse,
        attempts: expandedAttempts,
        total: expandedAttempts.length,
        per_page: 20,
        total_pages: 2,
      },
    })

    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard ready for attempts pagination run')

    dfs.record('Navigate to Attempts')
    await page.getByRole('navigation').getByRole('link', {name: 'Attempts', exact: true}).click()
    await expect(page).toHaveURL(/\/attempts/)
    await expect(page.getByRole('heading', {name: 'Practice Attempts'})).toBeVisible()

    dfs.record('Show filters and tweak date range')
    const toggleFilters = page.getByRole('button', {name: /(Show|Hide) Filters/i})
    if ((await toggleFilters.innerText()).includes('Show')) await toggleFilters.click()
    await expect(page.getByText('Since Date')).toBeVisible()
    await page.getByRole('button', {name: 'Select start date'}).click()
    await page.keyboard.press('Escape')

    dfs.record('Go to page 2 via pagination')
    await expect(page.getByText(/Page 1 of 2/)).toBeVisible()
    const nextButton = page.getByRole('button', {name: 'Next'})
    await expect(nextButton).toBeEnabled()
    await nextButton.click()

    dfs.record('Switch to Good tab and verify attempts text present')
    await page.getByRole('tab', {name: /Good/}).click()
    await expect(page.getByText(/Showing .* attempts/)).toBeVisible()

    await dfs.attach(testInfo)
  })
})
