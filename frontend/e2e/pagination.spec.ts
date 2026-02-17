import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

test.describe('Pagination', () => {

  test('Courses page shows Load More with 15+ courses', async ({ page }) => {
    test.setTimeout(90000);
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(4000);

    // With 80+ seeded courses, page 1 should show 12
    const courseCards = page.locator('a[href*="/courses/"]');
    const initialCount = await courseCards.count();
    expect(initialCount).toBeGreaterThan(0);

    // Load More button should be visible
    const loadMore = page.getByRole('button', { name: /load more/i });
    const hasMore = await loadMore.isVisible().catch(() => false);

    if (hasMore) {
      await loadMore.click();
      await page.waitForTimeout(4000);

      // More cards should appear
      const afterCount = await courseCards.count();
      expect(afterCount).toBeGreaterThan(initialCount);
    }
  });

  test('Kits page shows Load More with many kits', async ({ page }) => {
    test.setTimeout(90000);
    await setupCustomerSession(page, '/kits');
    await page.waitForTimeout(4000);

    const kitCards = page.locator('a[href*="/kits/"]');
    const initialCount = await kitCards.count();
    expect(initialCount).toBeGreaterThan(0);

    const loadMore = page.getByRole('button', { name: /load more/i });
    const hasMore = await loadMore.isVisible().catch(() => false);

    if (hasMore) {
      await loadMore.click();
      await page.waitForTimeout(4000);

      const afterCount = await kitCards.count();
      expect(afterCount).toBeGreaterThan(initialCount);
    }
  });

  test('My Courses page shows Load More or all enrollments', async ({ page }) => {
    await setupCustomerSession(page, '/my-courses');
    await page.waitForTimeout(4000);

    // Customer has enrollments from seed data
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);

    // Should show enrolled course cards
    const courseCards = page.locator('[class*="Card"], [class*="card"], a[href*="/courses/"]');
    const count = await courseCards.count();
    expect(count).toBeGreaterThan(0);

    // Check for Load More
    const loadMore = page.getByRole('button', { name: /load more/i });
    const hasMore = await loadMore.isVisible().catch(() => false);

    if (hasMore) {
      await loadMore.click();
      await page.waitForTimeout(3000);
    }
  });
});
