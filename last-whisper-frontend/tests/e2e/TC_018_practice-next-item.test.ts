import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {mockItemsResponse} from './fixtures/api-mocks'

const multiItems = {
  ...mockItemsResponse,
  items: [
    {...mockItemsResponse.items[0], id: 1, text: 'First item text', difficulty: 2},
    {...mockItemsResponse.items[0], id: 2, text: 'Second item text', difficulty: 3},
    {...mockItemsResponse.items[0], id: 3, text: 'Third item text', difficulty: 4},
  ],
  total: 3,
  total_pages: 1,
}

test.describe('TC_018_Practice_Next_Item', () => {
  test('navigates to next item in practice list', async ({page}, testInfo) => {
    await setupApiMocks(page, {items: multiItems})
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard ready for practice next navigation')

    dfs.record('Open Practice')
    await page.getByRole('navigation').getByRole('link', {name: 'Practice', exact: true}).click()
    await expect(page).toHaveURL(/\/practice/)
    await expect(page.getByRole('heading', {name: 'Practice'})).toBeVisible()

    dfs.record('Confirm first item loaded')
    await expect(page.getByText('First item text', {exact: false}).first()).toBeVisible()

    dfs.record('Go to next item')
    const nextButton = page.getByRole('button', {name: /Next Practice|Next item|Next/i}).first()
    await nextButton.click()
    await expect(page.getByText('Second item text', {exact: false}).first()).toBeVisible()

    await dfs.attach(testInfo)
  })
})
