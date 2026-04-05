import {expect, test} from '@playwright/test'
import {setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_037_Error_Empty_States', () => {
  test('items fetch failure shows retry CTA and aria-live notice', async ({page}) => {
    await page.addInitScript(() => {
      const jsonResponse = (payload: unknown, status = 200) => new Response(JSON.stringify(payload ?? {}), {
        status,
        headers: {'Content-Type': 'application/json'},
      })

      window.fetch = async (input, init) => {
        const url = typeof input === 'string' || input instanceof URL ? input.toString() : input.url

        if (url.includes('/v1/items') && !url.includes('/v1/items/tts-status')) {
          return jsonResponse({detail: 'Server error'}, 500)
        }

        if (url.includes('/health')) {
          return jsonResponse({
            status: 'healthy',
            checks: {
              database: { status: 'healthy' },
              service_info: {
                status: 'informational',
                name: 'mock-service',
                version: '2024.11.22',
                timestamp: new Date().toISOString(),
              },
            },
          }, 200)
        }

        if (url.includes('/v1/tags')) {
          return jsonResponse({tags: [], total: 0}, 200)
        }

        return jsonResponse({}, 200)
      }
    })

    await page.goto('/items')
    const retry = page.getByRole('button', {name: /retry|try again/i})
    await expect(retry).toBeVisible({timeout: 15000})

    const alert = page.locator('[role="alert"]').filter({hasText: /server error|failed to load items|unable to fetch items/i}).first()
    await expect(alert).toBeVisible()
    await expect(alert).toHaveAttribute('aria-live', /assertive/i)
  })

  test('stats empty state renders illustration and messaging', async ({page}) => {
    await setupApiMocks(page, {
      practiceLog: {
        practice_log: [],
        total: 0,
        page: 1,
        per_page: 10,
        total_pages: 1,
      },
    })
    await page.goto('/stats')

    await page.getByRole('tab', {name: 'Practice Log'}).click()
    await expect(page.getByRole('heading', {name: 'No practice data'})).toBeVisible({timeout: 15000})
    await expect(page.getByText('Start practicing to see your detailed progress here')).toBeVisible()
  })

  test('audio missing shows friendly fallback and action', async ({page}) => {
    const now = new Date().toISOString()
    await setupApiMocks(page, {
      items: {
        items: [
          {
            id: 999,
            locale: 'en-US',
            text: 'Audio fallback scenario for dictation practice.',
            difficulty: 3,
            tags: ['fallback', 'audio'],
            tts_status: 'failed',
            created_at: now,
            updated_at: now,
            practiced: false,
          },
        ],
        total: 1,
        page: 1,
        per_page: 20,
        total_pages: 1,
      },
    })

    await page.goto('/items')
    await page.getByTestId('item-card').first().click()
    const dialog = page.getByRole('dialog', {name: 'Item Details'})
    await expect(dialog).toBeVisible()
    await dialog.getByRole('tab', {name: 'Audio'}).click()

    await expect(dialog.getByText('Audio not available')).toBeVisible()
    await expect(dialog.getByText('We couldn’t load the audio. Try again or regenerate.')).toBeVisible()
    await expect(dialog.getByRole('button', {name: 'Refresh Audio'})).toBeVisible()
  })
})
