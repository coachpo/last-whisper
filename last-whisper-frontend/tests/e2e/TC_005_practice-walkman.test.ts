import {expect, test} from '@playwright/test'
import {createDfsRecorder, setupApiMocks} from './fixtures/test-helpers'
import {waitForMocksReady} from './fixtures/mock-utils'
import {mockItemsResponse} from './fixtures/api-mocks'

test.describe('TC_005_Practice_Walkman', () => {
  test('exercises practice form then verifies walkman audio player', async ({page}, testInfo) => {
    await setupApiMocks(page)
    const dfs = createDfsRecorder()

    await page.goto('/')
    await waitForMocksReady(page)
    dfs.record('Dashboard ready for practice flow')

    dfs.record('Open Practice via sidebar')
    await page.goto('/practice')
    await expect(page.getByRole('heading', {name: 'Practice'})).toBeVisible()

    dfs.record('Expand practice filters')
    const practiceFiltersToggle = page.getByRole('button', {name: /(Show|Hide) Filters/i})
    if ((await practiceFiltersToggle.innerText()).includes('Show')) {
      await practiceFiltersToggle.click()
    }
    await expect(page.getByText('Locale').first()).toBeVisible()

    dfs.record('Type answer and verify submit enabled then reset')
    const answerBox = page.getByPlaceholder('Type what you hear here...')
    await answerBox.fill('Test answer for DFS path')
    await expect(answerBox).toHaveValue('Test answer for DFS path')
    const submitAnswer = page.getByRole('button', {name: 'Submit Answer'})
    await expect(submitAnswer).toBeEnabled({ timeout: 15000 })
    const resetAnswer = page.getByRole('button', {name: /^Reset$/}).last()
    await resetAnswer.click()
    await expect(submitAnswer).toBeDisabled()

    dfs.record('Jump to items via Browse Items footer')
    await page.getByRole('link', {name: 'Browse Items'}).click()
    await expect(page).toHaveURL(/\/items/)
    await expect(page.getByRole('heading', {name: 'Dictation Items'})).toBeVisible()

    dfs.record('Navigate to Walkman')
    await page.goto('/walkman')
    await expect(page.getByRole('heading', {name: 'Walkman'})).toBeVisible()

    dfs.record('Validate audio player presence')
    await expect(page.getByText('Audio Player', {exact: false})).toBeVisible()
    await expect(page.getByRole('heading', {name: /Available Items/i})).toBeVisible()
    await expect(page.getByText(mockItemsResponse.items[0].text, {exact: false}).first()).toBeVisible()

    await dfs.attach(testInfo)
  })
})
