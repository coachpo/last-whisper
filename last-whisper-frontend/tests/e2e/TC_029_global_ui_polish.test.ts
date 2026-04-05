import {expect, test} from '@playwright/test'
import {setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_029_Global_UI_Polish', () => {
  test('verifies cleaner dashboard and subtle health status', async ({page}) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await setupApiMocks(page)
    await page.goto('/')

    // Env vars should be gone
    await expect(page.getByText('Environment Variables')).not.toBeVisible()
    
    // Health Status should be a button with correct title
    // We check for the pulsing dot which indicates healthy state
    const statusIndicator = page.getByTitle('System Status: Healthy')
    await expect(statusIndicator).toBeVisible()

    const pulseDot = statusIndicator.locator('.animate-ping')
    await expect(pulseDot.first()).toBeVisible()
  })

  test('health popover surfaces detail text for unhealthy subsystems', async ({page}) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    const now = new Date().toISOString()

    await setupApiMocks(page, {
      health: {
        status: 'unhealthy',
        checks: {
          database: { status: 'healthy' },
          task_manager: { status: 'unhealthy', detail: 'Redis queue stalled' },
          tts_service: { status: 'healthy' },
          service_info: {
            status: 'error',
            name: 'last-whisper-api',
            version: '1.5.0',
            timestamp: now,
            detail: 'Queue behind by 42 jobs',
          },
        },
      },
    })

    await page.goto('/')
    const statusButton = page.getByRole('button', {name: /system status/i})
    await statusButton.click()

    await expect(page.getByText('Redis queue stalled')).toBeVisible()
    await expect(page.getByText('Queue behind by 42 jobs')).toBeVisible()
  })
})
