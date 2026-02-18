import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

/** Wait for search results to load */
async function waitForSearchResults(page: import('@playwright/test').Page) {
  await Promise.race([
    page.locator('.cursor-pointer').first().waitFor({ state: 'visible', timeout: 10000 }),
    page.getByText(/no results found/i).waitFor({ state: 'visible', timeout: 10000 }),
    page.getByText(/at least 2 characters/i).waitFor({ state: 'visible', timeout: 10000 }),
  ]).catch(() => {});
}

test.describe('Search Results Page', () => {

  test('Search results page shows results for a known query', async ({ page }) => {
    await setupCustomerSession(page, '/search?q=course');
    await waitForSearchResults(page);

    // PageHeader should show "found" text
    await expect(page.getByText(/found/i).first()).toBeVisible();

    // Should show course cards
    const courseCards = page.locator('.cursor-pointer');
    const count = await courseCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Search results shows All, Courses, Kits tabs', async ({ page }) => {
    await setupCustomerSession(page, '/search?q=kit');
    await waitForSearchResults(page);

    // Tab buttons
    const allTab = page.getByRole('button', { name: /^all$/i });
    const coursesTab = page.getByRole('button', { name: /courses/i });
    const kitsTab = page.getByRole('button', { name: /kits/i });
    await expect(allTab).toBeVisible();
    await expect(coursesTab).toBeVisible();
    await expect(kitsTab).toBeVisible();
  });

  test('Clicking Kits tab filters to kit results', async ({ page }) => {
    await setupCustomerSession(page, '/search?q=kit');
    await waitForSearchResults(page);

    const kitsTab = page.getByRole('button', { name: /kits/i });
    await kitsTab.click();
    await waitForSearchResults(page);

    // URL should include type=kits
    expect(page.url()).toContain('type=kits');
  });

  test('Clicking Courses tab filters to course results', async ({ page }) => {
    await setupCustomerSession(page, '/search?q=course');
    await waitForSearchResults(page);

    const coursesTab = page.getByRole('button', { name: /courses/i });
    await coursesTab.click();
    await waitForSearchResults(page);

    expect(page.url()).toContain('type=courses');
  });

  test('Search results shows empty state for gibberish query', async ({ page }) => {
    await setupCustomerSession(page, '/search?q=xyznonexistent12345');
    await waitForSearchResults(page);

    // Should show "No results found" message
    await expect(page.getByText(/no results found/i)).toBeVisible();
  });

  test('Search results shows minimum character warning for single char', async ({ page }) => {
    await setupCustomerSession(page, '/search?q=a');
    await waitForSearchResults(page);

    await expect(page.getByText(/at least 2 characters/i)).toBeVisible();
  });

  test('Search results Load More works if available', async ({ page }) => {
    test.setTimeout(90000);
    await setupCustomerSession(page, '/search?q=course');
    await waitForSearchResults(page);

    const loadMore = page.getByRole('button', { name: /load more/i }).first();
    const hasLoadMore = await loadMore.isVisible().catch(() => false);

    if (hasLoadMore) {
      const initialCards = await page.locator('.cursor-pointer').count();
      await loadMore.click();
      await page.waitForTimeout(3000);
      const afterCards = await page.locator('.cursor-pointer').count();
      expect(afterCards).toBeGreaterThanOrEqual(initialCards);
    }
  });

  test('Clicking a search result navigates to detail page', async ({ page }) => {
    await setupCustomerSession(page, '/search?q=course');
    await waitForSearchResults(page);

    const firstResult = page.locator('.cursor-pointer').first();
    const hasResult = await firstResult.isVisible().catch(() => false);

    if (hasResult) {
      await firstResult.click();
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url.includes('/courses/') || url.includes('/kits/')).toBeTruthy();
    }
  });

});
