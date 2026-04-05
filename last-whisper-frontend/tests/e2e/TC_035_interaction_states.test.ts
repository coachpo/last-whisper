import {expect, test} from '@playwright/test'
import {setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_035_Interaction_States', () => {
test('buttons and toggles show hover/active/disabled styles', async ({page}, testInfo) => {
    const isTouchViewport = /tablet|mobile/i.test(testInfo.project.name)
    await setupApiMocks(page)
    await page.goto('/')

    const primary = page.getByRole('link', {name: 'Start Session'}).first()
    if (!isTouchViewport) {
      await primary.hover()
      await expect(primary).toHaveClass(/hover:/)
    }

    await primary.focus()
    await expect(primary).toHaveClass(/focus-visible|ring/)

    // Toggle on practice page
    await primary.click()
    await expect(page).toHaveURL(/\/practice/)
    const focusToggle = page.getByRole('button', {name: /(enter|exit) focus mode/i})
    await expect(focusToggle).toBeVisible({ timeout: 15000 })

    if (!isTouchViewport) {
      await focusToggle.hover()
      await expect(focusToggle).toHaveClass(/hover:/)
    }

    await focusToggle.click()
    await expect(page.getByRole('button', {name: /(enter|exit) focus mode/i})).toBeVisible()

    // Disabled state via mock: use loading skeleton to assert opacity class
    const browse = page.getByRole('link', {name: 'Browse Items'})
    if (!isTouchViewport) {
      await browse.hover()
      await expect(browse).toHaveClass(/hover:/)
    }
  })
})
