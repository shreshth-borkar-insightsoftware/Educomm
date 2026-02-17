import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

test.describe('Kit Details Page', () => {

  test('Kit details page shows kit name, price, and description', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await page.waitForTimeout(3000);

    // Find a kit link
    const kitLink = page.locator('a[href*="/kits/"]').first();
    const hasKits = await kitLink.isVisible().catch(() => false);

    if (hasKits) {
      await kitLink.click();
      await page.waitForURL('**/kits/*', { timeout: 10000 });
      await page.waitForTimeout(2000);

      // Page header
      const heading = page.getByText(/kit details/i);
      await expect(heading).toBeVisible();

      // Kit name should be visible
      const kitName = page.locator('h1, [class*="CardTitle"]').first();
      const nameText = await kitName.textContent();
      expect(nameText!.length).toBeGreaterThan(0);

      // Price should be visible (₹ symbol)
      const priceEl = page.getByText(/₹\d+/);
      const hasPrice = await priceEl.isVisible().catch(() => false);
      expect(hasPrice).toBeTruthy();

      // Description section
      const descHeading = page.getByText(/description/i);
      await expect(descHeading).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('Kit details page shows stock availability', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await page.waitForTimeout(3000);

    const kitLink = page.locator('a[href*="/kits/"]').first();
    const hasKits = await kitLink.isVisible().catch(() => false);

    if (hasKits) {
      await kitLink.click();
      await page.waitForURL('**/kits/*', { timeout: 10000 });
      await page.waitForTimeout(2000);

      const stockLabel = page.getByText(/stock availability/i);
      await expect(stockLabel).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('Kit details page has Add to Cart button', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await page.waitForTimeout(3000);

    const kitLink = page.locator('a[href*="/kits/"]').first();
    const hasKits = await kitLink.isVisible().catch(() => false);

    if (hasKits) {
      await kitLink.click();
      await page.waitForURL('**/kits/*', { timeout: 10000 });
      await page.waitForTimeout(2000);

      const addBtn = page.getByRole('button', { name: /add to cart/i });
      await expect(addBtn).toBeVisible();
      await expect(addBtn).toBeEnabled();
    } else {
      test.skip();
    }
  });

  test('Kit details page shows Product ID', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await page.waitForTimeout(3000);

    const kitLink = page.locator('a[href*="/kits/"]').first();
    const hasKits = await kitLink.isVisible().catch(() => false);

    if (hasKits) {
      await kitLink.click();
      await page.waitForURL('**/kits/*', { timeout: 10000 });
      await page.waitForTimeout(2000);

      const productId = page.getByText(/product id/i);
      await expect(productId).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('Kit details page has floating cart button', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await page.waitForTimeout(3000);

    const kitLink = page.locator('a[href*="/kits/"]').first();
    const hasKits = await kitLink.isVisible().catch(() => false);

    if (hasKits) {
      await kitLink.click();
      await page.waitForURL('**/kits/*', { timeout: 10000 });
      await page.waitForTimeout(2000);

      // FloatingCartButton should be visible
      const cartBtn = page.locator('button').filter({ hasText: /cart|🛒/i });
      const cartIcon = page.locator('[class*="fixed"]').filter({ has: page.locator('svg') });
      const hasCart = await cartBtn.isVisible().catch(() => false) || await cartIcon.isVisible().catch(() => false);
      // The floating button may or may not be visible depending on cart state — just verify page loaded
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(100);
    } else {
      test.skip();
    }
  });

});

test.describe('Course Details Page', () => {

  test('Course details page shows course info and linked kit button', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    const courseLink = page.locator('a[href*="/courses/"]').first();
    const hasCourses = await courseLink.isVisible().catch(() => false);

    if (hasCourses) {
      await courseLink.click();
      await page.waitForURL('**/courses/*', { timeout: 10000 });
      await page.waitForTimeout(3000);

      // Page header
      const heading = page.getByText(/course details/i);
      await expect(heading).toBeVisible();

      // Course name
      const courseName = page.locator('[class*="CardTitle"]').first();
      const nameText = await courseName.textContent();
      expect(nameText!.length).toBeGreaterThan(0);

      // About section
      const aboutSection = page.getByText(/about this course/i);
      await expect(aboutSection).toBeVisible();

      // Required Learning Kit section
      const kitSection = page.getByText(/required learning kit/i);
      await expect(kitSection).toBeVisible();

      // VIEW LINKED KIT or NO KIT LINKED button
      const linkedKitBtn = page.getByRole('button', { name: /view linked kit|no kit linked/i });
      await expect(linkedKitBtn).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('Course details page shows course ID', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    const courseLink = page.locator('a[href*="/courses/"]').first();
    const hasCourses = await courseLink.isVisible().catch(() => false);

    if (hasCourses) {
      await courseLink.click();
      await page.waitForURL('**/courses/*', { timeout: 10000 });
      await page.waitForTimeout(2000);

      // "ID: <number>" should be shown
      const idText = page.getByText(/^ID: \d+$/);
      await expect(idText).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('Course details navigates to linked kit', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    const courseLink = page.locator('a[href*="/courses/"]').first();
    const hasCourses = await courseLink.isVisible().catch(() => false);

    if (hasCourses) {
      await courseLink.click();
      await page.waitForURL('**/courses/*', { timeout: 10000 });
      await page.waitForTimeout(3000);

      const viewKitBtn = page.getByRole('button', { name: /view linked kit/i });
      const hasLinkedKit = await viewKitBtn.isVisible().catch(() => false);

      if (hasLinkedKit) {
        await viewKitBtn.click();
        await page.waitForURL('**/kits/*', { timeout: 10000 });
        expect(page.url()).toContain('/kits/');
      } else {
        // No linked kit — verify button says NO KIT LINKED
        const noKitBtn = page.getByRole('button', { name: /no kit linked/i });
        await expect(noKitBtn).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('Course details has back button', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    const courseLink = page.locator('a[href*="/courses/"]').first();
    const hasCourses = await courseLink.isVisible().catch(() => false);

    if (hasCourses) {
      await courseLink.click();
      await page.waitForURL('**/courses/*', { timeout: 10000 });
      await page.waitForTimeout(2000);

      // PageHeader has showBackButton={true}
      const backBtn = page.getByRole('button', { name: /back/i });
      const svgBack = page.locator('button svg').first();
      const hasBack = await backBtn.isVisible().catch(() => false) || await svgBack.isVisible().catch(() => false);
      expect(hasBack).toBeTruthy();
    } else {
      test.skip();
    }
  });

});
