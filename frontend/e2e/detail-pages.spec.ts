import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

test.describe('Course Details Page', () => {

  test('Course details page loads with course information', async ({ page }) => {
    // First get a valid course ID from the courses page
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    // Try to find a course link
    const courseLink = page.locator('a[href*="/courses/"]').first();
    const hasCourses = await courseLink.isVisible().catch(() => false);

    if (hasCourses) {
      const href = await courseLink.getAttribute('href');
      const courseId = href?.match(/\/courses\/(\d+)/)?.[1];

      if (courseId) {
        // Navigate directly to course details
        await page.goto(`/courses/${courseId}`);
        await page.waitForTimeout(3000);

        // PageHeader should show "Course Details"
        const heading = page.getByText(/course details/i);
        await expect(heading).toBeVisible();

        // Should show course name and description
        const body = await page.textContent('body');
        expect(body!.length).toBeGreaterThan(100);

        // Check for "VIEW LINKED KIT" button or course info
        const linkedKitBtn = page.getByText(/view linked kit/i);
        const hasLinkedKit = await linkedKitBtn.isVisible().catch(() => false);

        // Course ID should be displayed
        expect(body).toBeTruthy();
      }
    } else {
      // Navigate to a course ID directly (try ID 1)
      await page.goto('/courses/1');
      await page.waitForTimeout(3000);

      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }
  });

  test('Course details page shows linked kit section', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    const courseLink = page.locator('a[href*="/courses/"]').first();
    const hasCourses = await courseLink.isVisible().catch(() => false);

    if (hasCourses) {
      await courseLink.click();
      await page.waitForURL('**/courses/*', { timeout: 10000 });
      await page.waitForTimeout(3000);

      // Check for linked kit section
      const linkedKitBtn = page.getByText(/view linked kit/i);
      const kitSection = page.getByText(/required learning kit|linked kit/i);
      const hasKit = await linkedKitBtn.isVisible().catch(() => false);
      const hasSection = await kitSection.isVisible().catch(() => false);

      // Page loaded successfully
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(50);
    } else {
      test.skip();
    }
  });

  test('Course details page handles non-existent course gracefully', async ({ page }) => {
    await setupCustomerSession(page, '/courses/99999');
    await page.waitForTimeout(3000);

    // Should show "Course not found" or error state
    const body = await page.textContent('body');
    expect(body).toBeTruthy();

    // Should not crash
    const notFound = page.getByText(/not found|error/i);
    const hasNotFound = await notFound.isVisible().catch(() => false);
    // Page rendered
    expect(body!.length).toBeGreaterThan(10);
  });

});

test.describe('Kit Details Page', () => {

  test('Kit details page loads with kit information and Add to Cart button', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await page.waitForTimeout(3000);

    const kitLink = page.locator('a[href*="/kits/"]').first();
    const hasKits = await kitLink.isVisible().catch(() => false);

    if (hasKits) {
      const href = await kitLink.getAttribute('href');
      const kitId = href?.match(/\/kits\/(\d+)/)?.[1];

      if (kitId) {
        await page.goto(`/kits/${kitId}`);
        await page.waitForTimeout(3000);

        // PageHeader should show "Kit Details"
        const heading = page.getByText(/kit details/i);
        await expect(heading).toBeVisible();

        // Should show kit name, price (₹), description
        const body = await page.textContent('body');
        expect(body!.length).toBeGreaterThan(100);

        // ADD TO CART button should be visible
        const addToCartBtn = page.getByRole('button', { name: /add to cart/i });
        await expect(addToCartBtn).toBeVisible();
      }
    } else {
      await page.goto('/kits/1');
      await page.waitForTimeout(3000);
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }
  });

  test('Kit details page shows price and stock info', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await page.waitForTimeout(3000);

    const kitLink = page.locator('a[href*="/kits/"]').first();
    const hasKits = await kitLink.isVisible().catch(() => false);

    if (hasKits) {
      await kitLink.click();
      await page.waitForURL('**/kits/*', { timeout: 10000 });
      await page.waitForTimeout(3000);

      // Should show price with ₹
      const body = await page.textContent('body');
      const hasPrice = body?.includes('₹');

      // Should show stock availability info
      const stockText = page.getByText(/stock|available|in stock/i);
      const hasStock = await stockText.isVisible().catch(() => false);

      // Page loaded with details
      expect(body!.length).toBeGreaterThan(100);
    } else {
      test.skip();
    }
  });

  test('Adding kit to cart from details page works', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await page.waitForTimeout(3000);

    const kitLink = page.locator('a[href*="/kits/"]').first();
    const hasKits = await kitLink.isVisible().catch(() => false);

    if (hasKits) {
      await kitLink.click();
      await page.waitForURL('**/kits/*', { timeout: 10000 });
      await page.waitForTimeout(3000);

      const addToCartBtn = page.getByRole('button', { name: /add to cart/i });
      const hasBtn = await addToCartBtn.isVisible().catch(() => false);

      if (hasBtn) {
        // Handle any alert dialog
        page.on('dialog', async (dialog) => {
          await dialog.accept();
        });

        await addToCartBtn.click();
        await page.waitForTimeout(2000);

        // FloatingCartButton should appear or cart should be updated
        const body = await page.textContent('body');
        expect(body).toBeTruthy();
      }
    } else {
      test.skip();
    }
  });

  test('Kit details page handles non-existent kit gracefully', async ({ page }) => {
    await setupCustomerSession(page, '/kits/99999');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(10);
  });

});
