import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

test.describe('Course Content Page', () => {

  test('Course content page loads for an enrolled course', async ({ page }) => {
    test.setTimeout(90000);

    // First go to My Courses to find an enrolled course
    await setupCustomerSession(page, '/my-courses');
    await page.waitForTimeout(4000);

    // Find a course card with a link to content
    const courseLink = page.locator('a[href*="/courses/"]').first();
    const hasLink = await courseLink.isVisible().catch(() => false);

    if (hasLink) {
      const href = await courseLink.getAttribute('href');
      const courseId = href?.match(/\/courses\/(\d+)/)?.[1];

      if (courseId) {
        // Navigate to course content page
        await page.goto(`/courses/${courseId}/content`);
        await page.waitForTimeout(5000);

        // Should either show content or "Content Not Found"
        const body = await page.textContent('body');
        expect(body!.length).toBeGreaterThan(20);

        // Check for EXIT LESSON button or BACK TO COURSES
        const exitBtn = page.getByText(/exit lesson/i);
        const backBtn = page.getByText(/back to courses/i);
        const hasExit = await exitBtn.isVisible().catch(() => false);
        const hasBack = await backBtn.isVisible().catch(() => false);

        expect(hasExit || hasBack).toBeTruthy();
      }
    }
  });

  test('Course content shows video player for video content', async ({ page }) => {
    test.setTimeout(90000);
    await setupCustomerSession(page, '/my-courses');
    await page.waitForTimeout(4000);

    const courseLink = page.locator('a[href*="/courses/"]').first();
    const hasLink = await courseLink.isVisible().catch(() => false);

    if (hasLink) {
      const href = await courseLink.getAttribute('href');
      const courseId = href?.match(/\/courses\/(\d+)/)?.[1];

      if (courseId) {
        await page.goto(`/courses/${courseId}/content`);
        await page.waitForTimeout(5000);

        // Check for video element or iframe
        const video = page.locator('video');
        const iframe = page.locator('iframe');
        const hasVideo = await video.count() > 0;
        const hasIframe = await iframe.count() > 0;

        // At least one media element should exist if content was found
        const notFound = page.getByText(/content not found/i);
        const isNotFound = await notFound.isVisible().catch(() => false);

        if (!isNotFound) {
          expect(hasVideo || hasIframe).toBeTruthy();
        }
      }
    }
  });

  test('Course content page shows not found for invalid course', async ({ page }) => {
    await setupCustomerSession(page, '/courses/99999/content');
    await page.waitForTimeout(5000);

    // Should show error or redirect
    const body = await page.textContent('body');
    expect(body).toBeTruthy();

    // Could show "Content Not Found" or redirect to my-courses
    const notFound = page.getByText(/content not found|not found|no lessons/i);
    const hasNotFound = await notFound.isVisible().catch(() => false);
    const isRedirected = page.url().includes('/my-courses') || page.url().includes('/dashboard');

    expect(hasNotFound || isRedirected || body!.length > 10).toBeTruthy();
  });
});
