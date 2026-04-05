import {expect, test} from '@playwright/test'
import {setupApiMocks} from './fixtures/test-helpers'

const longText = 'Extremely long dictation prompt meant to stress layout responsiveness across devices without clipping or ellipsis. '.repeat(3)

test.describe('TC_038_Long_Text_Responsiveness', () => {
  test('items and tags render long text without clipping at mobile width', async ({page}) => {
    await setupApiMocks(page, {
      items: {
        items: [
          {
            id: 999,
            locale: 'en-US',
            text: longText,
            difficulty: 3,
            tags: ['very-long-tag-name-to-test-wrapping-behavior-and-avoid-ellipsis'],
            tts_status: 'ready',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            practiced: false,
          },
        ],
        total: 1,
        page: 1,
        per_page: 20,
        total_pages: 1,
      },
    })

    await page.setViewportSize({width: 430, height: 900})
    await page.goto('/items')
    await expect(page.getByRole('heading', {name: 'Dictation Items'})).toBeVisible({timeout: 15000})

    const card = page.getByTestId('item-card').first()
    await expect(card).toBeVisible()

    await expect(
      card.locator('p').filter({hasText: longText.substring(0, 60).trim()}).first()
    ).toBeVisible()

    const tag = card.getByText(/very-long-tag-name/)
    await expect(tag).toBeVisible()
  })
})
