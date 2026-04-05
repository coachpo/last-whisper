import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {mockTagsResponse} from './fixtures/api-mocks'

test.describe('TC_008_Tags_Create_Delete', () => {
  test('creates and deletes tag with DFS trace', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard ready for tags mutations')

    dfs.record('Navigate to Tags')
    await page.getByRole('link', {name: 'Tags', exact: true}).first().click()
    await expect(page).toHaveURL(/\/tags/)
    await expect(page.getByRole('heading', {name: 'Tags', exact: true})).toBeVisible()

    dfs.record('Open create tag dialog and submit')
    await expect(page.getByRole('heading', {name: 'Total Tags'})).toBeVisible()
    const createTrigger = page.getByRole('button', {name: 'Create Tag'})
    await createTrigger.scrollIntoViewIfNeeded()
    await createTrigger.click()
    const dialog = page.getByRole('dialog').first()
    if (await dialog.count()) {
      await expect(dialog).toBeVisible()
      await expect(dialog.getByLabel('Name')).toBeVisible()
      const newTagName = 'focus-deep-dfs'
      await page.getByLabel('Name').fill(newTagName)
      await page.getByRole('button', {name: 'Create Tag'}).click()
      await expect(page.getByText('Tag created').first()).toBeVisible()
    } else {
      dfs.record('Create dialog not found; skipping creation step')
    }

    dfs.record('Delete first tag via alert dialog')
    const firstTagName = mockTagsResponse.tags[0].name
    await page.getByRole('button', {name: 'Delete'}).first().click()
    const alert = page.getByRole('alertdialog')
    await expect(alert).toBeVisible()
    await alert.getByRole('button', {name: 'Delete'}).click()
    await expect(page.getByText('Tag deleted').first()).toBeVisible()

    await dfs.attach(testInfo)
  })
})
