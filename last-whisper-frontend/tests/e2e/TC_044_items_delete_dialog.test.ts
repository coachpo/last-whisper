import {expect, test} from '@playwright/test'

import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {waitForMocksReady} from './fixtures/mock-utils'

test.describe('TC_044_Items_Delete_Dialog', () => {
  test('shows delete dialog details and supports cancel + confirm paths', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await waitForMocksReady(page)
    dfs.record('Dashboard ready for navigation')

    dfs.record('Navigate to Items view')
    await page.getByRole('navigation').getByRole('link', {name: 'Items', exact: true}).click()
    await expect(page).toHaveURL(/\/items$/)
    await expect(page.getByRole('heading', {name: 'Dictation Items'})).toBeVisible()

    dfs.record('Open delete dialog for first item and inspect details')
    await page.getByRole('button', {name: 'Delete item'}).first().click()
    const deleteDialog = page.getByRole('alertdialog')
    await expect(deleteDialog.getByText('Delete Dictation Item')).toBeVisible()
    await expect(deleteDialog.getByText('#101')).toBeVisible()
    await expect(deleteDialog.getByText('Practice mindful listening with short dictations about travel.')).toBeVisible()

    dfs.record('Cancel deletion to keep item intact')
    await deleteDialog.getByRole('button', {name: 'Cancel'}).click()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(page.getByText('Practice mindful listening with short dictations about travel.')).toBeVisible()

    dfs.record('Confirm deletion to trigger API call and toast feedback')
    await page.getByRole('button', {name: 'Delete item'}).first().click()
    const confirmDialog = page.getByRole('alertdialog')
    await confirmDialog.getByRole('button', {name: 'Delete Item'}).click()
    const successToast = page
      .getByRole('status')
      .filter({ hasText: 'The dictation item has been deleted successfully.' })
      .first()
    await expect(successToast).toBeVisible()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)

    await dfs.attach(testInfo)
  })
})
