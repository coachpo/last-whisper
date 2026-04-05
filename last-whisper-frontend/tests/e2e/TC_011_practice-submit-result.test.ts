import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {waitForMocksReady} from './fixtures/mock-utils'
import {mockItemsResponse} from './fixtures/api-mocks'

test.describe('TC_011_Practice_Submit_Result', () => {
  test('submits an answer and shows result banner', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()
    const expectedPercentage = 87

    await page.goto('/')
    await waitForMocksReady(page)
    dfs.record('Dashboard loaded')

    dfs.record('Go to Practice')
    await Promise.all([
      page.waitForURL(/\/practice/, { timeout: 15000 }),
      page.getByRole('navigation').getByRole('link', {name: 'Practice', exact: true}).click(),
    ])
    await expect(page.getByRole('heading', {name: 'Practice'})).toBeVisible()

    // Override fetch after app scripts loaded so POST /v1/attempts returns scored response
    await page.evaluate(({ itemId, percentage }) => {
      const origFetch = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url
        const method = (init?.method || (typeof input === 'object' && 'method' in input ? (input as Request).method : 'GET')).toUpperCase()
        if (url.includes('/v1/attempts') && method === 'POST') {
          return new Response(
            JSON.stringify({
              item_id: itemId,
              text: 'heard text',
              percentage,
              wer: 0.13,
              words_ref: 24,
              words_correct: 21,
              created_at: new Date().toISOString(),
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return origFetch(input as RequestInfo, init)
      }
    }, { itemId: mockItemsResponse.items[0].id, percentage: expectedPercentage })

    dfs.record('Enter answer and submit')
    const answerBox = page.getByPlaceholder('Type what you hear here...')
    await answerBox.fill('heard text')
    const submit = page.getByRole('button', {name: 'Submit Answer'})
    await expect(submit).toBeEnabled()
    await submit.click()

    dfs.record('See result banner')
    await expect(page.getByText('Result', {exact: false})).toBeVisible({timeout: 10000})
    await expect(page.getByText(`${expectedPercentage}%`, {exact: true})).toBeVisible({timeout: 10000})

    await dfs.attach(testInfo)
  })
})
