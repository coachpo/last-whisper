import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'

test.describe('TC_001_Dashboard_Quick_Navigation', () => {
  test('navigates through primary quick actions and sidebar links', async ({page}, testInfo) => {
    await setupApiMocks(page)
    page.on('request', (request) => {
      console.log('[req]', request.method(), request.url())
    })
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    dfs.record('Open dashboard root')

    await expect(page.getByRole('heading', {name: 'Ready to practice?'})).toBeVisible()

    const totalAttemptsCard = page
      .getByText('Total Attempts')
      .locator('xpath=ancestor::div[contains(@class,"card")]')
    const itemsPracticedCard = page
      .getByText('Unique Items')
      .locator('xpath=ancestor::div[contains(@class,"card")]')

    await expect(totalAttemptsCard).toContainText(/\d+/)
    await expect(itemsPracticedCard).toContainText(/\d+/)

    dfs.record('Trigger Practice quick action')
    await page.getByRole('link', {name: 'Start Session'}).first().click({force: true})
    await expect(page.getByRole('heading', {name: 'Practice', exact: true})).toBeVisible({timeout: 15000})

    dfs.record('Jump to Items via practice footer link')
    await page.getByRole('link', {name: 'Browse Items'}).click()
    await expect(page.getByRole('heading', {name: 'Dictation Items', exact: true})).toBeVisible({timeout: 15000})

    dfs.record('Locate add item control')
    const addItemButton = page.getByRole('button', {name: 'Add Item'}).first()
    await addItemButton.scrollIntoViewIfNeeded()
    await expect(addItemButton).toBeVisible()
    await expect(addItemButton).toBeEnabled()

    dfs.record('Return home via sidebar dashboard link')
    await page.getByRole('link', {name: 'Home'}).first().click()
    await expect(page.getByRole('heading', {name: 'Ready to practice?'})).toBeVisible({timeout: 15000})

    dfs.record('Visit stats via quick action')
    // The "View Stats" card was removed in favor of stats overview cards, but we still have a "View Stats" link in the "Recent Activity" header? No, "View History" for attempts.
    // Wait, I removed the "Quick Actions" grid.
    // I added stats cards. Do they link to stats? No.
    // But the navigation (Sidebar) has Stats.
    // The test expects "Visit stats via quick action".
    // I removed the "View Stats" quick action card.
    // Let's check if I have a link to Stats. I don't think I added one in the Dashboard body, only in sidebar/bottom nav.
    // Wait, I added:
    // <Link href="/attempts" className="text-sm font-medium text-primary hover:underline">View History</Link>
    // That goes to attempts.
    // I should probably add a way to go to Stats from the dashboard body, or update the test to use the Sidebar/BottomNav.
    // Or I can make the "Average Score" card clickable?
    // For now, I'll update the test to use the Sidebar link, or just remove that part of the test if "Quick Actions" are gone.
    // Actually, using Sidebar link is a valid navigation test.
    await page.getByRole('navigation').getByRole('link', {name: 'Stats'}).click()
    await expect(page.getByRole('heading', {name: 'Statistics', exact: true})).toBeVisible({timeout: 15000})

    await dfs.attach(testInfo)
  })
})
