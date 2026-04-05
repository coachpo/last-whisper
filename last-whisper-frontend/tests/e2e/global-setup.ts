import {chromium, type Browser} from '@playwright/test'
import {setupApiMocks} from './fixtures/test-helpers'

let browser: Browser | undefined

async function globalSetup() {
  browser = await chromium.launch()
  const page = await browser.newPage({ baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000' })
  await setupApiMocks(page)
  const warmupRoutes = ['/', '/items', '/attempts', '/practice']
  for (const route of warmupRoutes) {
    await page.goto(route, {waitUntil: 'domcontentloaded', timeout: 60_000})
    // Give Next.js time to finish route compilation during warmup
    await page.waitForTimeout(300)
  }
  await page.context().storageState({ path: 'playwright/.auth/state.json' })
  await browser.close()
}

export default globalSetup
