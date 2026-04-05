import {expect, test} from '@playwright/test'
import {setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_032_Practice_Focus_Mode', () => {
  test('toggles focus mode hiding sidebar and header', async ({page}) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await setupApiMocks(page)
    await page.goto('/practice')
    
    // Sidebar should be visible initially
    const sidebar = page.getByRole('navigation')
    await expect(sidebar).toBeVisible()
    
    // Click Focus Mode
    await page.getByRole('button', {name: /focus mode/i}).click()
    
    // Sidebar should be hidden
    await expect(sidebar).not.toBeVisible()
    
    // Button should now say "Exit Focus"
    const exitBtn = page.getByRole('button', {name: /exit focus/i})
    await expect(exitBtn).toBeVisible()
    
    // Click Exit Focus
    await exitBtn.click()
    
    // Sidebar returns
    await expect(sidebar).toBeVisible()
  })
})
