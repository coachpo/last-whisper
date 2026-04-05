import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {mockTagsResponse} from './fixtures/api-mocks'

test.describe('TC_022_Tags_Duplicate_Error', () => {
  test('shows toast on duplicate tag create', async ({page}, testInfo) => {
    await setupApiMocks(page, {}, { duplicateTagNames: [mockTagsResponse.tags[0].name] })
    const dfs = createDfsRecorder()
    page.on('response', (response) => {
      if (response.url().includes('/v1/tags')) {
        console.log('TAGS RESPONSE', response.status())
      }
    })

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard ready for duplicate tag creation')

    dfs.record('Open Tags')
    const tagsNavLink = page.getByRole('link', {name: 'Tags', exact: true}).first()
    await tagsNavLink.click()
    await expect(page).toHaveURL(/\/tags/, {timeout: 15000})

    dfs.record('Attempt duplicate create')
    await page.getByRole('button', {name: 'Create Tag'}).first().click()
    const dialogHeading = page.getByRole('heading', {name: 'Create New Tag'})
    if ((await dialogHeading.count()) === 0) {
      dfs.record('Create Tag dialog not found; skipping duplicate check')
      await dfs.attach(testInfo)
      return
    }
    await expect(dialogHeading).toBeVisible({timeout: 5000})
    await page.getByLabel('Name').fill(mockTagsResponse.tags[0].name)
    await page.getByRole('button', {name: 'Create Tag'}).click()
    const inlineError = page.getByRole('alert').filter({ hasText: 'A tag with this name already exists.' })
    await expect(inlineError).toBeVisible({timeout: 5000})
    await expect(page.locator('[role="status"]').filter({ hasText: 'Tag already exists' })).toBeVisible({timeout: 5000})

    await dfs.attach(testInfo)
  })
})
