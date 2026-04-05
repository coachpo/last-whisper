import {expect, test} from '@playwright/test'
import {setupApiMocks} from './fixtures/test-helpers'

const viewports = [
  {label: 'desktop', width: 1280, height: 720},
  {label: 'tablet', width: 1024, height: 768},
  {label: 'mobile', width: 430, height: 932},
]

test.describe('TC_034_Responsive_Smoke', () => {
  for (const vp of viewports) {
    test(`dashboard/items/practice render at ${vp.label}`, async ({page}) => {
      await setupApiMocks(page)
      await page.setViewportSize({width: vp.width, height: vp.height})

      await page.goto('/')
      await expect(page.getByRole('heading', {name: 'Ready to practice?'})).toBeVisible()
      await expect(page.getByRole('link', {name: 'Start Session'})).toBeVisible()

      // Ensure quick actions are not clipped
      const practiceQuick = page.getByRole('link', {name: 'Start Session'}).first()
      await expect(practiceQuick).toBeVisible()

      await page.getByRole('link', {name: 'Start Session'}).click()
      await expect(page).toHaveURL(/\/practice/)
      await expect(page.getByRole('heading', {name: 'Practice'})).toBeVisible({timeout: 15000})

      // Ensure primary actions are visible on narrow widths
      await expect(page.getByRole('button', {name: /Start|Play|Submit/i})).toBeVisible()

      await page.getByRole('link', {name: 'Browse Items'}).click()
      await expect(page).toHaveURL(/\/items/)
      await expect(page.getByRole('heading', {name: 'Dictation Items'})).toBeVisible({timeout: 15000})
      await expect(page.getByRole('button', {name: 'Add Item'})).toBeVisible()

      // Ensure at least one item card renders without clipping
      const firstCard = page.getByTestId('item-card').first()
      await expect(firstCard).toBeVisible()
    })
  }
})
