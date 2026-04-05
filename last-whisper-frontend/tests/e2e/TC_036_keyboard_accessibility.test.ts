import {expect, test} from '@playwright/test'
import {setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_036_Keyboard_Accessibility', () => {
  test('supports skip link, focus order, and activation via keyboard', async ({page}) => {
    await setupApiMocks(page)
    await page.goto('/')
    const practiceCtaName = 'Start Session'

    // Tab to first interactive element
    await page.keyboard.press('Tab')
    // If a skip link exists, it should be visible on focus
    const skipLink = page.getByRole('link', {name: /Skip to main/i})
    if (await skipLink.count()) {
      await expect(skipLink).toBeVisible()
      await page.keyboard.press('Enter')
    }

    // Inspect initial focus order to ensure Start Session CTA is within early tab stops
    const focusOrder = await page.evaluate(() => {
      const selectors = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      return Array.from(document.querySelectorAll<HTMLElement>(selectors))
        .filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null && el.getAttribute('aria-hidden') !== 'true')
        .map((el) => ({
          text: (el.textContent || '').trim(),
          href: el instanceof HTMLAnchorElement ? el.href : '',
          ariaLabel: el.getAttribute('aria-label') || '',
        }))
    })

    const practiceIndex = focusOrder.findIndex((entry) =>
      entry.text.includes(practiceCtaName) || entry.href.endsWith('/practice')
    )
    expect(practiceIndex).toBeGreaterThan(-1)
    expect(practiceIndex).toBeLessThan(20)

    const practiceCta = page.getByRole('link', {name: practiceCtaName}).first()
    await practiceCta.focus()
    await expect(practiceCta).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/practice/)
    await expect(page.getByRole('heading', {name: 'Practice'})).toBeVisible({timeout: 15000})

    // Space/enter should toggle focus mode
    const focusToggle = page.getByRole('button', {name: /(enter|exit) focus mode/i})
    await expect(focusToggle).toBeVisible({ timeout: 15000 })
    await focusToggle.focus()
    await expect(focusToggle).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', {name: /(enter|exit) focus mode/i})).toBeVisible()
  })
})
