import {expect, test} from '@playwright/test'
import {setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_030_Loading_Skeletons', () => {
  test('shows skeletons during loading', async ({page}) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await setupApiMocks(page)

    await page.addInitScript(() => {
      const originalFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' || input instanceof URL ? input.toString() : input.url
        if (url.includes('/v1/items') && (!init || (init.method || 'GET').toUpperCase() === 'GET')) {
          await new Promise((resolve) => setTimeout(resolve, 1200))
        }
        return originalFetch(input, init)
      }
    })

    await page.goto('/practice')
    await expect(page.getByRole('heading', {name: 'Practice'})).toBeVisible()
    
    // Check for skeleton elements
    const skeletons = page.locator('.animate-pulse')
    await expect(skeletons.first()).toBeVisible()
    expect(await skeletons.count()).toBeGreaterThan(2)
  })
})
