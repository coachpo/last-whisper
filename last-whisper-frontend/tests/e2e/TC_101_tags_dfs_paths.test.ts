import {expect, test} from '@playwright/test'

import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {waitForMocksReady} from './fixtures/mock-utils'

test.describe('TC_101_Tags_DFS_Generated', () => {
  test('covers delete confirmation path discovered via DFS', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await waitForMocksReady(page)
    dfs.record('Dashboard ready for DFS traversal')

    dfs.record('Navigate to Tags view')
    await page.getByRole('link', {name: 'Tags', exact: true}).first().click()
    await expect(page).toHaveURL(/\/tags$/)
    await expect(page.getByRole('heading', {name: 'Tags', exact: true})).toBeVisible()

    dfs.record('Open delete modal for first tag')
    await page.getByRole('button', {name: /^Delete$/}).first().click()
    const deleteModal = page.getByRole('alertdialog')
    await expect(deleteModal).toBeVisible()
    await expect(deleteModal.getByRole('button', {name: 'Cancel'})).toBeVisible()

    dfs.record('Confirm deletion and verify toast')
    await deleteModal.getByRole('button', {name: /^Delete$/}).click()
    await expect(page.getByText('Tag deleted', {exact: true})).toBeVisible()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)

    await dfs.attach(testInfo)
  })

  test('covers create tag path with modal interactions', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await waitForMocksReady(page)
    dfs.record('Dashboard ready for DFS traversal')

    dfs.record('Navigate to Tags view')
    await page.getByRole('link', {name: 'Tags', exact: true}).first().click()
    await expect(page).toHaveURL(/\/tags$/)

    dfs.record('Launch Create Tag modal')
    await page.getByRole('button', {name: 'Create Tag'}).click()
    const nameField = page.getByLabel('Name')
    await expect(nameField).toBeVisible()

    dfs.record('Fill tag name and submit form')
    await nameField.fill('dfs_generated_tag')
    await page.getByRole('button', {name: 'Create Tag', exact: true}).last().click()
    await expect(page.getByText('Tag created', {exact: true})).toBeVisible()
    await expect(page.getByLabel('Name')).toHaveCount(0)

    await dfs.attach(testInfo)
  })

  test('covers cancel delete branch to preserve tag', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await waitForMocksReady(page)
    dfs.record('Dashboard ready for DFS traversal')

    dfs.record('Navigate to Tags view')
    await page.getByRole('link', {name: 'Tags', exact: true}).first().click()
    await expect(page).toHaveURL(/\/tags$/)

    dfs.record('Open delete modal for second tag')
    await page.getByRole('button', {name: /^Delete$/}).nth(1).click()
    const deleteModal = page.getByRole('alertdialog')
    await expect(deleteModal).toBeVisible()

    dfs.record('Cancel deletion to backtrack in DFS path')
    await deleteModal.getByRole('button', {name: 'Cancel'}).click()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(page.getByText('Tag deleted', {exact: true})).toHaveCount(0)

    await dfs.attach(testInfo)
  })
})
