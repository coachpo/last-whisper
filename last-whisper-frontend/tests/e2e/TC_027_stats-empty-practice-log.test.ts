import {expect, test} from '@playwright/test'
import {setupApiMocks} from './fixtures/test-helpers'
import {mockPracticeLogResponse} from './fixtures/api-mocks'

// Ensures per-item stats section hides when practice log filters return no data.
test.describe('TC_027_Stats_Empty_Practice_Log', () => {
  test('clears item insights when filters yield no entries', async ({page}) => {
    await setupApiMocks(page, {}, {practiceLogForceEmpty: true})

    await page.goto('/stats')
    await expect(page.getByRole('heading', {name: 'Statistics'})).toBeVisible()

    // Apply date filter that yields empty response via mocks
    await page.getByRole('tab', {name: 'Practice Log'}).click()
    await expect(page.getByText(mockPracticeLogResponse.practice_log[0].text, {exact: false})).toBeVisible()
    await page.getByRole('button', {name: 'Start date'}).click()
    await page.getByRole('button', {name: /^1$/}).first().click()
    await page.getByRole('button', {name: 'Apply filters'}).click()

    // Expect empty state message
    await expect(page.getByText('No practice data')).toBeVisible({timeout: 5000})

    // Per-item insights should show guidance instead of metrics
    await page.getByRole('tab', {name: 'Performance'}).click()
    await expect(page.getByText('You need at least one practiced item to view these insights.')).toBeVisible()
  })
})
