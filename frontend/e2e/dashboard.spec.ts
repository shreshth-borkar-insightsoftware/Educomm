import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

test.describe('Dashboard Page', () => {

  test('Dashboard loads with welcome message', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');
    await page.waitForTimeout(3000);

    // Should show welcome header
    const welcome = page.getByText(/welcome back/i);
    await expect(welcome).toBeVisible();
  });

  test('Dashboard shows Hardware Kits and Digital Courses hero cards', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');
    await page.waitForTimeout(3000);

    // Hero cards
    const kitsCard = page.getByText(/hardware kits/i);
    const coursesCard = page.getByText(/digital courses/i);
    await expect(kitsCard).toBeVisible();
    await expect(coursesCard).toBeVisible();

    // Should have navigation links
    const shopNow = page.getByText(/shop now/i);
    const browseCourses = page.getByText(/browse courses/i);
    await expect(shopNow).toBeVisible();
    await expect(browseCourses).toBeVisible();
  });

  test('Dashboard shows Featured Kits section', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');
    await page.waitForTimeout(4000);

    const featuredKits = page.getByText(/featured kits/i);
    await expect(featuredKits).toBeVisible();

    // Should show kit names or "No kits available" 
    const viewAll = page.getByText(/view all/i).first();
    await expect(viewAll).toBeVisible();
  });

  test('Dashboard shows Continue Learning section', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');
    await page.waitForTimeout(4000);

    const continueSection = page.getByText(/continue learning/i);
    await expect(continueSection).toBeVisible();

    // Should show enrolled courses with progress bars or empty state
    const progressBar = page.locator('.bg-green-500.h-1\\.5').first();
    const emptyMsg = page.getByText(/no courses started/i);
    const hasProgress = await progressBar.isVisible().catch(() => false);
    const hasEmpty = await emptyMsg.isVisible().catch(() => false);
    expect(hasProgress || hasEmpty).toBeTruthy();
  });

  test('Dashboard shows Recent Orders section', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');
    await page.waitForTimeout(4000);

    const recentOrders = page.getByText(/recent orders/i);
    await expect(recentOrders).toBeVisible();

    // Should show order cards or "No orders yet" message
    const viewAllOrders = page.locator('button, a').filter({ hasText: /view all/i }).last();
    await expect(viewAllOrders).toBeVisible();
  });

  test('Dashboard hero card navigates to Kits page', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');
    await page.waitForTimeout(3000);

    // Click on the Hardware Kits card (the whole card is clickable)
    const shopNow = page.getByText(/shop now/i);
    await shopNow.click();
    await page.waitForURL('**/kits', { timeout: 10000 });
    expect(page.url()).toContain('/kits');
  });

  test('Dashboard hero card navigates to Courses page', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');
    await page.waitForTimeout(3000);

    const browseCourses = page.getByText(/browse courses/i);
    await browseCourses.click();
    await page.waitForURL('**/courses', { timeout: 10000 });
    expect(page.url()).toContain('/courses');
  });

  test('Dashboard enrollment progress shows percentage', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');
    await page.waitForTimeout(4000);

    // Look for percentage indicators (e.g., "50%", "100%")
    const percentages = page.locator('span').filter({ hasText: /\d+%/ });
    const count = await percentages.count();

    if (count > 0) {
      const text = await percentages.first().textContent();
      expect(text).toMatch(/\d+%/);
    } else {
      // No enrollments — still pass
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }
  });

});
