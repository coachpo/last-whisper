import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {mockAttemptsResponse} from './fixtures/api-mocks'

const manyAttempts = {
  ...mockAttemptsResponse,
  attempts: Array.from({length: 30}, (_v, i) => ({
    ...mockAttemptsResponse.attempts[0],
    id: 100 + i,
    item_id: 500 + i,
    percentage: 50 + (i % 40),
    text: `Attempt row ${i + 1}`,
  })),
  total: 30,
  per_page: 20,
  total_pages: 2,
}

test.describe('TC_019_Attempts_PerPage', () => {
  test('changes per-page size and updates summary', async ({page}, testInfo) => {
    await setupApiMocks(page, {attempts: manyAttempts})
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard ready for attempts per-page')

    dfs.record('Open Attempts')
    await page.getByRole('navigation').getByRole('link', {name: 'Attempts', exact: true}).click()
    await expect(page).toHaveURL(/\/attempts/)
    await expect(page.getByRole('heading', {name: 'Practice Attempts'})).toBeVisible()

    dfs.record('Expand filters and change per-page')
    const toggle = page.getByRole('button', {name: /(Show|Hide) Filters/i}).first()
    if ((await toggle.textContent())?.includes('Show')) await toggle.click()

    const perPageInput = page.getByLabel('Items Per Page')
    await expect(perPageInput).toBeVisible()
    await perPageInput.fill('10')
    await page.getByRole('button', {name: 'Apply Filters'}).click()

    dfs.record('Verify filters reflect per-page 10 change')
    await expect(perPageInput).toHaveValue('10')
    await expect(page.getByText(/Showing\s+\d+\s+of\s+30\s+attempts/i)).toBeVisible({timeout: 10000})
    await expect(page.getByText(/Page\s+1\s+of\s+2/i)).toBeVisible({timeout: 10000})

    await dfs.attach(testInfo)
  })
})
