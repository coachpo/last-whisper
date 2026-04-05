import {expect, test} from '@playwright/test'
import {setupApiMocks} from './fixtures/test-helpers'

// Verifies the advanced attempts filters reset to default pagination values.
test.describe('TC_028_Attempts_Filter_Reset_Defaults', () => {
  test('reset brings pagination inputs back to defaults', async ({page}) => {
    await setupApiMocks(page)

    await page.goto('/attempts')
    await expect(page.getByRole('heading', {name: 'Practice Attempts'})).toBeVisible()

    // Expand filters
    await page.getByRole('button', {name: /Show Filters/i}).click()

    const perPageInput = page.getByLabel('Items Per Page')
    const sinceInput = page.getByRole('button', {name: /Select start date/i})

    await perPageInput.fill('50')
    await sinceInput.click()
    await page.getByRole('button', {name: /^1$/}).first().click()
    await page.getByRole('button', {name: 'Apply Filters'}).click()

    // Verify applied values remain in the inputs
    await expect(perPageInput).toHaveValue('50')
    await expect(sinceInput).not.toHaveText(/Select start date/i)

    // Reset and ensure defaults restored
    await page.getByRole('button', {name: 'Reset'}).click()
    await expect(perPageInput).toHaveValue('20')
    await expect(sinceInput).toHaveText(/Select start date/i)
  })
})
