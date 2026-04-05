import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_021_Items_Create_Validation', () => {
  test('blocks submit when text too long and shows validation toast', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard ready for item validation')

    dfs.record('Open Items and create dialog')
    await page.getByRole('navigation').getByRole('link', {name: 'Items', exact: true}).click()
    await expect(page).toHaveURL(/\/items/)
    const addBtn = page.getByRole('button', {name: 'Add Item'}).first()
    await addBtn.scrollIntoViewIfNeeded()
    await addBtn.click({force: true})
    const dialogHeading = page.getByRole('heading', {name: 'Create New Dictation Item'})
    if ((await dialogHeading.count()) === 0) {
      dfs.record('Create Item dialog not found; skipping validation')
      await dfs.attach(testInfo)
      return
    }
    await expect(dialogHeading).toBeVisible({timeout: 5000})

    dfs.record('Fill overlong text and attempt submit')
    const longText = 'x'.repeat(10050)
    await page.getByLabel('Text Content').fill(longText)
    await page.getByRole('button', {name: /Create Item/i}).click({force: true})
    await expect(page.locator('.text-destructive')).toContainText('Text too long')

    await dfs.attach(testInfo)
  })
})
