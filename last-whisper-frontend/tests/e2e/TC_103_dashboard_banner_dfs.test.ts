import {expect, test} from '@playwright/test'

import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_103_Dashboard_Banner_DFS_Paths', () => {
  test('toggles sidebar, switches theme, and clears cache with DFS trace', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Dashboard baseline ready')

    const sidebarToggle = page.getByRole('button', {name: 'Toggle sidebar'})
    const initialExpanded = await sidebarToggle.getAttribute('aria-expanded')

    dfs.record('Collapse sidebar via banner control')
    await sidebarToggle.click()
    await expect(sidebarToggle).not.toHaveAttribute('aria-expanded', initialExpanded ?? 'true')

    dfs.record('Re-expand sidebar to restore navigation labels')
    await sidebarToggle.click()
    if (initialExpanded) {
      await expect(sidebarToggle).toHaveAttribute('aria-expanded', initialExpanded)
    }

    const themeToggle = page.getByRole('button', {name: 'Toggle theme'})

    dfs.record('Switch to dark theme')
    await themeToggle.click()
    await page.getByRole('menuitem', {name: 'Dark'}).click()
    await expect.poll(async () => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBeTruthy()

    dfs.record('Switch back to light theme')
    await themeToggle.click()
    await page.getByRole('menuitem', {name: 'Light'}).click()
    await expect.poll(async () => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBeFalsy()

    dfs.record('Clear audio cache via confirmation dialog')
    await page.getByRole('button', {name: 'Clear audio cache'}).click()
    const dialog = page.getByRole('dialog', {name: 'Clear Audio Cache'})
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', {name: 'Clear Cache'}).click()
    await expect(page.getByRole('status').filter({hasText: 'Cache cleared'})).toBeVisible({timeout: 5000})

    await dfs.attach(testInfo)
  })
})
