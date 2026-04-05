import {expect, test} from '@playwright/test'
import {setupApiMocks} from './fixtures/test-helpers'
import {mockItemsResponse} from './fixtures/api-mocks'
import type {ItemTTSStatus} from '@/types/api'

const MOCK_WAV = Buffer.from([
  // RIFF header for minimal PCM WAV (44 bytes, 8000Hz mono, 8-bit silence)
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45, 0x66, 0x6d, 0x74, 0x20,
  0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x40, 0x1f, 0x00, 0x00, 0x40, 0x1f, 0x00, 0x00,
  0x01, 0x00, 0x08, 0x00, 0x64, 0x61, 0x74, 0x61, 0x00, 0x00, 0x00, 0x00,
])

test.describe('TC_040_Audio_Refresh', () => {
  test('audio missing -> refresh -> queued toast and playable after re-open', async ({page}) => {
    const failingItems = {
      ...mockItemsResponse,
      items: mockItemsResponse.items.map((item, index) =>
        index === 0
          ? {
              ...item,
              tts_status: 'failed' as ItemTTSStatus,
            }
          : item
      ),
    }

    await setupApiMocks(page, {
      items: failingItems,
    })

    let audioReady = false

    await page.route('**/v1/items/101/audio', async (route) => {
      const origin = route.request().headers()['origin'] || 'http://localhost:3000'
      if (!audioReady) {
        await route.fulfill({
          status: 404,
          headers: {
            'access-control-allow-origin': origin,
            'access-control-allow-credentials': 'true',
          },
        })
        return
      }
      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'audio/wav',
          'access-control-allow-origin': origin,
          'access-control-allow-credentials': 'true',
        },
        body: MOCK_WAV,
      })
    })

    await page.goto('/items')

    await page.getByTestId('item-card').first().click()
    await page.getByRole('tab', { name: 'Audio' }).click()

    await expect(page.getByText('Audio not available')).toBeVisible()
    await page.getByRole('button', { name: 'Refresh Audio' }).click()
    await expect(page.getByText('Audio refresh queued').first()).toBeVisible()

    await page.evaluate(() => {
      const mocks = (window as any).__TEST_API_MOCKS__
      if (mocks?.items?.items?.length) {
        mocks.items.items[0].tts_status = 'ready'
      }
    })
    audioReady = true

    const dialog = page.getByRole('dialog', { name: /Item Details/ })
    await dialog.getByRole('button', { name: 'Close' }).first().click()
    await expect(dialog).toBeHidden()
    await page.getByTestId('item-card').first().click()
    await page.getByRole('tab', { name: 'Audio' }).click()
    const audioResponsePromise = page.waitForResponse((response) => {
      return response.url().includes('/v1/items/101/audio') && response.status() === 200
    })
    await page.getByRole('button', { name: 'Check status' }).click()
    await audioResponsePromise
    await expect(page.getByText('Refresh failed')).toHaveCount(0)
  })
})
