import {expect, test} from '@playwright/test'

import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {waitForMocksReady} from './fixtures/mock-utils'

test.describe('TC_043_Tags_CRUD_Search', () => {
  test('covers create, delete, and search interactions', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()
    const uniqueTagName = `dfs_tag_${Date.now()}`

    await page.goto('/')
    await waitForMocksReady(page)
    dfs.record('Dashboard ready for navigation')

    dfs.record('Navigate to Tags view')
    await page.getByRole('navigation').getByRole('link', {name: 'Tags', exact: true}).click()
    await expect(page).toHaveURL(/\/tags$/)
    await expect(page.getByRole('heading', {name: 'Tags', exact: true})).toBeVisible()

    dfs.record('Open create dialog and submit unique tag')
    await page.getByRole('button', {name: 'Create Tag'}).click()
    const nameField = page.getByLabel('Name')
    await expect(nameField).toBeVisible()
    await nameField.fill(uniqueTagName)
    await page.getByRole('button', {name: 'Create Tag', exact: true}).last().click()
    await expect(page.getByText('Tag created', {exact: true})).toBeVisible()
    await expect(page.getByLabel('Name')).toHaveCount(0)

    dfs.record('Search for existing tag to narrow list')
    const searchInput = page.getByPlaceholder('Search tags...')
    await searchInput.fill('travel')
    const travelTagLocator = page.getByText(/^travel$/i)
    const focusTagLocator = page.getByText(/^focus$/i)
    await expect(travelTagLocator).toBeVisible()
    await expect(focusTagLocator).toHaveCount(0)

    dfs.record('Delete filtered tag via confirmation dialog')
    await page.getByRole('button', {name: /^Delete$/}).first().click()
    const deletionDialog = page.getByRole('alertdialog')
    await expect(deletionDialog.getByText('Delete Tag')).toBeVisible()
    await deletionDialog.getByRole('button', {name: /^Delete$/}).click()
    await expect(page.getByText('Tag deleted', {exact: true})).toBeVisible()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)

    dfs.record('Clear search to restore full list')
    await searchInput.fill('')
    await expect(travelTagLocator).toBeVisible()
    await expect(focusTagLocator).toBeVisible()

    await dfs.attach(testInfo)
  })
})
