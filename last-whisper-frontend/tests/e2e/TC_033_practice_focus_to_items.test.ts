import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_033_Practice_Focus_To_Items', () => {
  test('enter practice via dashboard quick action, enable focus mode, and jump to items', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Open dashboard root')

    await expect(page.getByRole('heading', {name: 'Ready to practice?'})).toBeVisible()
    const practiceCta = page.getByRole('link', {name: 'Start Session'}).first()
    await expect(practiceCta).toBeVisible()

    dfs.record('Navigate to Practice via quick action')
    await practiceCta.click()
    await expect(page).toHaveURL(/\/practice/)
    await expect(page.getByRole('heading', {name: 'Practice'})).toBeVisible({timeout: 15000})

    dfs.record('Toggle Focus Mode on')
    const focusToggle = page.getByRole('button', {name: /focus mode/i})
    await focusToggle.click()
    await expect(page.getByRole('button', {name: /exit focus/i})).toBeVisible()

    dfs.record('Jump to Items from practice footer')
    await page.getByRole('link', {name: 'Browse Items'}).click()
    await expect(page).toHaveURL(/\/items/)
    await expect(page.getByRole('heading', {name: 'Dictation Items'})).toBeVisible({timeout: 15000})
    await expect(page.getByRole('button', {name: 'Add Item'})).toBeVisible()

    await dfs.attach(testInfo)
  })
})
