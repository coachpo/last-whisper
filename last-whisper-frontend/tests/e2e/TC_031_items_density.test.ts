import {expect, test} from '@playwright/test'
import {setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_031_Items_Density', () => {
  test('verifies responsive grid layout for items', async ({page}) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await setupApiMocks(page)
    await page.goto('/items')
    
    // The grid container should have specific classes for density
    const grid = page.locator('[class*="2xl:grid-cols-5"]')
    await expect(grid).toBeVisible()
    await expect(grid).toHaveClass(/xl:grid-cols-4/)
  })
})
