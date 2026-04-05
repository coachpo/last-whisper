import {defineConfig, devices} from '@playwright/test'
import path from 'path'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  retries: 0,
  timeout: 60_000,
  globalSetup: path.resolve(__dirname, 'tests/e2e/global-setup.ts'),
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    storageState: 'playwright/.auth/state.json',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'tablet-chromium',
      use: {
        ...devices['iPad (gen 7) landscape'],
        viewport: { width: 1024, height: 768 },
      },
      testMatch: ['tests/e2e/TC_0*_responsive_*', 'tests/e2e/TC_0*_interaction_states.test.ts', 'tests/e2e/TC_0*_keyboard_accessibility.test.ts', 'tests/e2e/TC_0*_error_empty_states.test.ts'],
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['iPhone 14 Pro'],
        viewport: { width: 430, height: 932 },
      },
      testMatch: ['tests/e2e/TC_0*_responsive_*', 'tests/e2e/TC_0*_interaction_states.test.ts', 'tests/e2e/TC_0*_keyboard_accessibility.test.ts', 'tests/e2e/TC_0*_error_empty_states.test.ts'],
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
