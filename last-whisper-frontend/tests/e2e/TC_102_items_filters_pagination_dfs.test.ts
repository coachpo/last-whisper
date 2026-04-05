import {expect, test, Page} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import type {ItemsListResponse, TagListResponse} from '@/types/api'

const nowIso = new Date('2025-01-01T09:00:00Z').toISOString()

const baseFiItems: ItemsListResponse = {
  items: Array.from({length: 3}, (_value, index) => ({
    id: 600 + index,
    locale: 'fi',
    text: `Kappale ${index + 1} listening exercise`,
    difficulty: 2,
    tags: ['Kappale_1', index === 1 ? 'Kappale_2' : 'Vocabulary'],
    tts_status: 'ready',
    created_at: nowIso,
    updated_at: nowIso,
    practiced: index % 2 === 0,
  })),
  total: 3,
  page: 1,
  per_page: 20,
  total_pages: 1,
}

const emptyFilteredItems: ItemsListResponse = {
  items: [],
  total: 0,
  page: 1,
  per_page: 20,
  total_pages: 0,
}

const paginatedPageOne: ItemsListResponse = {
  items: Array.from({length: 3}, (_value, index) => ({
    id: 800 + index,
    locale: 'fi',
    text: `Page One Item ${index + 1}`,
    difficulty: 1,
    tags: ['Intro'],
    tts_status: 'ready',
    created_at: nowIso,
    updated_at: nowIso,
    practiced: false,
  })),
  total: 6,
  page: 1,
  per_page: 3,
  total_pages: 2,
}

const paginatedPageTwo: ItemsListResponse = {
  items: Array.from({length: 3}, (_value, index) => ({
    id: 900 + index,
    locale: 'fi',
    text: `Page Two Item ${index + 1}`,
    difficulty: 3,
    tags: ['Follow-up'],
    tts_status: 'ready',
    created_at: nowIso,
    updated_at: nowIso,
    practiced: true,
  })),
  total: 6,
  page: 2,
  per_page: 3,
  total_pages: 2,
}

const kappaleTags: TagListResponse = {
  tags: [
    {id: 1, name: 'Kappale_1', created_at: nowIso, updated_at: nowIso},
    {id: 2, name: 'Kappale_2', created_at: nowIso, updated_at: nowIso},
  ],
  total: 2,
}

async function forceItemsListNetworkRequests(page: Page) {
  await page.addInitScript(() => {
    const previous = window.__TEST_API_FORCE_NETWORK__
    window.__TEST_API_FORCE_NETWORK__ = (endpoint: string, init: RequestInit) => {
      const previousResult = typeof previous === 'function' ? previous(endpoint, init) : false
      if (previousResult) {
        return true
      }

      const shouldBypass = (() => {
        try {
          const parsed = new URL(endpoint, window.location.origin)
          return /\/v1\/items(?!\/\d)/.test(parsed.pathname)
        } catch {
          return /\/v1\/items(?!\/\d)/.test(endpoint)
        }
      })()

      return shouldBypass
    }
  })
}

type ItemsResolver = (params: URLSearchParams) => ItemsListResponse

async function overrideItemsList(page: Page, resolvePayload: ItemsResolver) {
  await forceItemsListNetworkRequests(page)
  await page.route('**/v1/items**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback()
      return
    }

    const url = new URL(route.request().url())
    if (/\/v1\/items\/\d+/.test(url.pathname)) {
      await route.fallback()
      return
    }

    const payload = resolvePayload(url.searchParams)
    await route.fulfill({
      status: 200,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    })
  })
}

test.describe('TC_102_Items_DFS_Filters_and_Pagination', () => {
  test('stacks locale/difficulty/tag filters until empty state, then resets', async ({page}, testInfo) => {
    await setupApiMocks(page, {items: baseFiItems, tags: kappaleTags})
    await page.unroute('**/v1/items**')
    await overrideItemsList(page, (params) => {
      const locale = params.get('locale')
      const difficulty = params.get('difficulty')
      const tagValues = params.getAll('tag')
      if (locale === 'fi' && difficulty === '2' && tagValues.includes('Kappale_1')) {
        return emptyFilteredItems
      }
      return baseFiItems
    })
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    await expect.poll(async () => page.evaluate(() => {
      return Boolean((window as any).__TEST_API_FORCE_NETWORK__?.('/v1/items', { method: 'GET' }))
    })).toBeTruthy()
    dfs.record('Dashboard ready for Items DFS filter path')

    dfs.record('Navigate to Items grid')
    await page.getByRole('navigation').getByRole('link', {name: 'Items', exact: true}).click()
    await expect(page).toHaveURL(/\/items$/)
    await expect(page.getByRole('heading', {name: 'Dictation Items'})).toBeVisible()

    dfs.record('Expand filters and choose locale/difficulty')
    const filtersToggle = page.getByRole('button', {name: /(Show|Hide) Filters/i}).first()
    if ((await filtersToggle.textContent())?.includes('Show')) {
      await filtersToggle.click()
    }
    const localeCombo = page.getByRole('combobox').filter({hasText: /Any locale/i})
    await localeCombo.click()
    await page.getByRole('option', {name: /Finnish/}).click()

    const difficultyCombo = page.getByRole('combobox').filter({hasText: /Any difficulty/i})
    await difficultyCombo.click()
    await page.getByRole('option', {name: /2 - Easy/}).click()

    dfs.record('Apply tag filter to narrow results')
    await page.getByRole('button', {name: /Filter by tags/}).click()
    await page.getByRole('option', {name: 'Kappale_1'}).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', {name: /1 tags selected/i})).toBeVisible()

    await expect(page.getByRole('heading', {name: 'No items found'})).toBeVisible()
    await expect(page.getByText('No items match your filter criteria')).toBeVisible()
    await expect(page.getByText('Showing 0 of 0 items')).toBeVisible()

    dfs.record('Reset filters to restore list')
    await page.getByRole('button', {name: 'Reset Filters'}).click()
    await expect(page.getByText('Showing 3 of 3 items')).toBeVisible()
    await expect(page.getByTestId('item-card').first()).toBeVisible()

    await dfs.attach(testInfo)
  })

  test('navigates Items pagination and backtracks to page one', async ({page}, testInfo) => {
    await setupApiMocks(page, {items: paginatedPageOne, tags: kappaleTags})
    await page.unroute('**/v1/items**')
    await overrideItemsList(page, (params) => {
      const pageParam = Number(params.get('page') || '1')
      return pageParam === 2 ? paginatedPageTwo : paginatedPageOne
    })
    const dfs = createDfsRecorder()

    await page.goto('/')
    await expect.poll(async () => page.evaluate(() => Boolean((window as any).__MOCK_FETCH_ENABLED__))).toBeTruthy()
    await expect.poll(async () => page.evaluate(() => {
      return Boolean((window as any).__TEST_API_FORCE_NETWORK__?.('/v1/items', { method: 'GET' }))
    })).toBeTruthy()
    dfs.record('Dashboard ready for Items pagination DFS path')

    dfs.record('Open Items page and observe baseline page indicator')
    await page.getByRole('navigation').getByRole('link', {name: 'Items', exact: true}).click()
    await expect(page).toHaveURL(/\/items$/)
    await expect(page.getByText('Page 1 of 2')).toBeVisible()
    await expect(page.getByText('Showing 3 of 6 items')).toBeVisible()

    dfs.record('Go to page 2 via numbered control')
    await page.getByRole('button', {name: '2'}).click()
    await expect(page.getByText('Page 2 of 2')).toBeVisible()
    await expect(page.getByRole('heading', {name: 'Page Two Item 1'})).toBeVisible()

    dfs.record('Return to the first page using page 1 control')
    await page.getByRole('button', {name: '1'}).click()
    await expect(page.getByText('Page 1 of 2')).toBeVisible()
    await expect(page.getByRole('heading', {name: 'Page One Item 1'})).toBeVisible()

    await dfs.attach(testInfo)
  })
})
