import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility baseline', () => {
  test('sign-in page has no critical a11y violations', async ({ page }) => {
    await page.goto('/sign-in')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('sign-up page has no critical a11y violations', async ({ page }) => {
    await page.goto('/sign-up')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })
})
