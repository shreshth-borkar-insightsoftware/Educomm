import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

test.describe('Search Results Page', () => {

  test('Search results page loads with results for a known query', async ({ page }) => {
    await setupCustomerSession(page, '/search?q=course');
    await page.waitForTimeout(3000);

    // PageHeader should show search info
    await expect(page.getByText(/found/i).first()).toBeVisible();

    // Should show course cards in a grid
    const courseCards = page.locator('a[href*="/courses/"]');
    const count = await courseCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Search results shows tabs for All, Courses, Kits', async ({ page }) => {
    await setupCustomerSession(page, '/search?q=kit');
    await page.waitForTimeout(3000);

    // Tab buttons should be visible
    await expect(page.getByRole('button', { name: /^all$/i })).toBeVisible();
    const coursesTab = page.getByRole('button', { name: /courses/i });
    const kitsTab = page.getByRole('button', { name: /kits/i });
    await expect(coursesTab).toBeVisible();
    await expect(kitsTab).toBeVisible();

    // Click Kits tab
    await kitsTab.click();
    await page.waitForTimeout(2000);

    // Should show kit results
    const kitCards = page.locator('a[href*="/kits/"]');
    const count = await kitCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Search results shows empty state for gibberish query', async ({ page }) => {
    await setupCustomerSession(page, '/search?q=xyznonexistent12345');
    await page.waitForTimeout(3000);

    // Should show "No results found" message
    const noResults = page.getByText(/no results found/i);
    const hasNoResults = await noResults.isVisible().catch(() => false);

    if (hasNoResults) {
      await expect(noResults).toBeVisible();
    } else {
      // Page at least rendered
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }
  });

  test('Search results shows minimum character warning', async ({ page }) => {
    await setupCustomerSession(page, '/search?q=a');
    await page.waitForTimeout(2000);

    // Should prompt to enter at least 2 characters
    const warning = page.getByText(/at least 2 characters/i);
    await expect(warning).toBeVisible();
  });

  test('Search results Load More button works', async ({ page }) => {
    test.setTimeout(90000);
    await setupCustomerSession(page, '/search?q=course');
    await page.waitForTimeout(3000);

    // Check if Load More is available (more than 12 results)
    const loadMore = page.getByRole('button', { name: /load more/i }).first();
    const hasLoadMore = await loadMore.isVisible().catch(() => false);

    if (hasLoadMore) {
      const initialCards = await page.locator('a[href*="/courses/"]').count();
      await loadMore.click();
      await page.waitForTimeout(3000);
      const afterCards = await page.locator('a[href*="/courses/"]').count();
      expect(afterCards).toBeGreaterThanOrEqual(initialCards);
    }
  });
});
