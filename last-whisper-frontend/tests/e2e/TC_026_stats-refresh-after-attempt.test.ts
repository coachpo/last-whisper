import {expect, test} from '@playwright/test'
import {setupApiMocks} from './fixtures/test-helpers'
import {mockItemsResponse} from './fixtures/api-mocks'

// Verifies that stats endpoints are re-fetched after a new attempt submission.
test.describe('TC_026_Stats_Refresh_After_Attempt', () => {
  test('stats summary refetches after submitting an attempt', async ({page}) => {
    await setupApiMocks(page)

    await page.addInitScript(() => {
      (window as any).__TEST_API_FORCE_NETWORK__ = (endpoint: string) => endpoint.startsWith('/v1/stats/summary')
    })

    // Counters for stats endpoints
    await page.addInitScript(() => {
      ;(window as any).__fetchCounts = { summary: 0 }
      const originalFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' || input instanceof URL ? input.toString() : (input as Request).url
        if (url.includes('/v1/stats/summary')) {
          ;(window as any).__fetchCounts.summary += 1
        }
        return originalFetch(input, init)
      }
    })

    // 1) Load Stats page to prime cache and establish baseline
    await page.goto('/stats')
    await expect(page.getByRole('heading', {name: 'Statistics'})).toBeVisible()
    await expect.poll(() => page.evaluate(() => (window as any).__fetchCounts.summary)).toBeGreaterThan(0)
    const initialCount = await page.evaluate(() => (window as any).__fetchCounts.summary)

    // 2) Navigate to Practice and submit an attempt (mocked response)
    await page.getByRole('navigation').getByRole('link', {name: 'Practice', exact: true}).click()
    await expect(page.getByRole('heading', {name: 'Practice'})).toBeVisible()

    await page.evaluate(({ itemId }) => {
      const origFetch = window.fetch.bind(window)
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' || input instanceof URL ? input.toString() : (input as Request).url
        const method = (init?.method || (typeof input === 'object' && 'method' in input ? (input as Request).method : 'GET')).toUpperCase()
        if (url.includes('/v1/attempts') && method === 'POST') {
          return new Response(
            JSON.stringify({
              item_id: itemId,
              text: 'heard text',
              percentage: 90,
              wer: 0.1,
              words_ref: 20,
              words_correct: 18,
              created_at: new Date().toISOString(),
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return origFetch(input, init)
      }
    }, { itemId: mockItemsResponse.items[0].id })

    const answerBox = page.getByPlaceholder('Type what you hear here...')
    await answerBox.fill('heard text')
    await page.getByRole('button', {name: 'Submit Answer'}).click()
    await expect(page.getByText('Result', {exact: false})).toBeVisible({timeout: 8000})

    // 3) Go back to Stats and expect another fetch for summary
    await page.getByRole('navigation').getByRole('link', {name: 'Stats', exact: true}).click()
    await expect(page).toHaveURL(/\/stats/)

    await expect.poll(() => page.evaluate(() => (window as any).__fetchCounts.summary)).toBeGreaterThan(initialCount)
  })
})
