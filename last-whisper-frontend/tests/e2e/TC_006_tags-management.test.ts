import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {waitForMocksReady} from './fixtures/mock-utils'
import {mockTagsResponse} from './fixtures/api-mocks'

test.describe('TC_006_Tags_Management', () => {
  test('lists tags, filters search, and opens create dialog with DFS trace', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await waitForMocksReady(page)
    dfs.record('Dashboard ready for tags navigation')

    dfs.record('Open Tags via sidebar')
    await page.goto('/tags')
    await expect(page.getByRole('heading', {name: 'Tags', exact: true})).toBeVisible()

    dfs.record('Verify tag stats and list')
    const totalCard = page
      .getByRole('heading', {name: 'Total Tags'})
      .locator('xpath=ancestor::div[contains(@class,"card")]')
    await expect(totalCard).toContainText(`${mockTagsResponse.total}`)
    for (const tag of mockTagsResponse.tags) {
      await expect(page.getByText(tag.name, {exact: false})).toBeVisible()
    }

    dfs.record('Search for a single tag')
    const searchBox = page.getByPlaceholder('Search tags...')
    await searchBox.fill(mockTagsResponse.tags[0].name)
    await expect(page.getByRole('heading', {name: mockTagsResponse.tags[0].name})).toHaveCount(1)
    await expect(page.getByRole('heading', {name: mockTagsResponse.tags[1].name})).toHaveCount(0)

    dfs.record('Open and close create tag dialog')
    await page.getByRole('button', {name: 'Create Tag'}).click()
    await expect(page.getByRole('heading', {name: 'Create New Tag'})).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('heading', {name: 'Create New Tag'})).not.toBeVisible({timeout: 5000})

    await dfs.attach(testInfo)
  })
})
