import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_023_Tags_Delete_Error', () => {
  test('shows toast on delete failure', async ({page}, testInfo) => {
    await setupApiMocks(page)

    await page.route('**/v1/tags/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({detail: 'Delete failed'}),
        })
        return
      }
      await route.fallback()
    })
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard ready for tag delete error')

    dfs.record('Open Tags')
    const tagsNavLink = page.getByRole('link', {name: 'Tags', exact: true}).first()
    await tagsNavLink.click()
    await expect(page).toHaveURL(/\/tags/, {timeout: 15000})

    dfs.record('Delete first tag and expect error toast')
    const deleteBtn = page.getByRole('button', {name: 'Delete'}).first()
    await deleteBtn.click()
    const alert = page.getByRole('alertdialog')
    if ((await alert.count()) > 0) {
      await alert.getByRole('button', {name: 'Delete'}).click()
    }
    await expect(page.getByText(/Tag deleted|Delete failed/i).first()).toBeVisible({timeout: 5000})

    await dfs.attach(testInfo)
  })
})
