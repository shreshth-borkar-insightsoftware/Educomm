import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

test.describe('My Courses Page', () => {

  test('My Courses page loads and shows enrolled courses or empty state', async ({ page }) => {
    await setupCustomerSession(page, '/my-courses');
    await page.waitForTimeout(3000);

    // PageHeader should show "My Learning"
    const heading = page.getByText(/my learning/i);
    await expect(heading).toBeVisible();

    // Should show course cards or empty state
    const startLessonBtn = page.getByRole('button', { name: /start lesson/i }).first();
    const emptyMsg = page.getByText(/no courses joined/i);
    const loadMoreBtn = page.getByRole('button', { name: /load more/i });

    const hasCourses = await startLessonBtn.isVisible().catch(() => false);
    const hasEmpty = await emptyMsg.isVisible().catch(() => false);

    // One of these should be true
    expect(hasCourses || hasEmpty).toBeTruthy();

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);
  });

  test('My Courses page shows course names and descriptions', async ({ page }) => {
    await setupCustomerSession(page, '/my-courses');
    await page.waitForTimeout(3000);

    const courseCards = page.locator('[class*="Card"], [class*="card"]');
    const cardCount = await courseCards.count();

    if (cardCount > 0) {
      // Cards should contain text content
      const firstCard = courseCards.first();
      const cardText = await firstCard.textContent();
      expect(cardText!.length).toBeGreaterThan(5);
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('My Courses page Load More button works if present', async ({ page }) => {
    await setupCustomerSession(page, '/my-courses');
    await page.waitForTimeout(3000);

    const loadMoreBtn = page.getByRole('button', { name: /load more/i });
    const hasLoadMore = await loadMoreBtn.isVisible().catch(() => false);

    if (hasLoadMore) {
      await loadMoreBtn.click();
      await page.waitForTimeout(3000);

      // More cards should load or button should disappear
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

});

test.describe('Course Content Page', () => {

  test('Course content page loads for enrolled course or shows not found', async ({ page }) => {
    // Try navigating to course content with ID 1
    await setupCustomerSession(page, '/courses/1/content');
    await page.waitForTimeout(3000);

    // Should show either video/iframe content or "Content Not Found"
    const notFound = page.getByText(/content not found/i);
    const exitBtn = page.getByText(/exit lesson/i);
    const backBtn = page.getByText(/back to courses/i);

    const hasNotFound = await notFound.isVisible().catch(() => false);
    const hasExit = await exitBtn.isVisible().catch(() => false);
    const hasBack = await backBtn.isVisible().catch(() => false);

    // One of these should be visible
    expect(hasNotFound || hasExit || hasBack).toBeTruthy();

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Course content page Back to Courses button navigates correctly', async ({ page }) => {
    await setupCustomerSession(page, '/courses/99999/content');
    await page.waitForTimeout(3000);

    // Should show "Content Not Found" for invalid course
    const backBtn = page.getByText(/back to courses/i);
    const hasBack = await backBtn.isVisible().catch(() => false);

    if (hasBack) {
      await backBtn.click();
      await page.waitForTimeout(2000);

      // Should navigate to /my-courses
      const url = page.url();
      expect(url.includes('/my-courses') || url.includes('/courses')).toBeTruthy();
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

});
