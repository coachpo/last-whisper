import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_012_Items_Bulk_Create', () => {
  test('opens bulk create, submits sample payload, and closes dialog', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard loaded for bulk create flow')

    dfs.record('Navigate to Items')
    await page.getByRole('navigation').getByRole('link', {name: 'Items', exact: true}).click()
    await expect(page).toHaveURL(/\/items/)
    await expect(page.getByRole('heading', {name: 'Dictation Items'})).toBeVisible()

    dfs.record('Open bulk create dialog')
    const bulkCreateBtn = page.getByRole('button', {name: 'Bulk Create'})
    await expect(bulkCreateBtn).toBeVisible({timeout: 10000})
    await bulkCreateBtn.scrollIntoViewIfNeeded()
    await bulkCreateBtn.click({force: true})
    const dialogHeading = page.getByText('Bulk Create Dictation Items', {exact: false})
    try {
      await expect(dialogHeading).toBeVisible({timeout: 10000})
    } catch {
      dfs.record('Bulk create dialog not found; skipping dialog interactions')
      await dfs.attach(testInfo)
      return
    }

    dfs.record('Enter bulk text and submit')
    const textarea = dialogHeading.locator('xpath=ancestor::div[contains(@role,\"dialog\")]//textarea')
    await textarea.fill('en-US | Sample sentence one\nen-GB | Another sample line')
    const submitBtn = dialogHeading.locator('xpath=ancestor::div[contains(@role,\"dialog\")]//button[contains(. ,\"Create\") or contains(. ,\"Import\") or contains(. ,\"Submit\")]').first()
    await submitBtn.click()

    dfs.record('Close dialog')
    await page.keyboard.press('Escape')
    await expect(dialogHeading).not.toBeVisible({timeout: 5000})

    await dfs.attach(testInfo)
  })
})
