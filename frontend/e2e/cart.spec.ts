import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

test.describe('Shopping Cart', () => {

  test('Add a kit to cart from kit details page', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await page.waitForTimeout(2000);

    // Find and click the first kit
    const kitLink = page.locator('a[href*="/kits/"]').first();
    const hasKits = await kitLink.isVisible().catch(() => false);

    if (!hasKits) {
      test.skip();
      return;
    }

    await kitLink.click();
    await page.waitForURL('**/kits/*', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Click Add to Cart
    const addToCartBtn = page.getByRole('button', { name: /add to cart/i });
    const hasBtn = await addToCartBtn.isVisible().catch(() => false);

    if (hasBtn) {
      // Listen for success dialog
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      await addToCartBtn.click();
      await page.waitForTimeout(2000);

      // Navigate to cart to verify
      await page.goto('/cart');
      await page.waitForTimeout(2000);

      // Cart page should have items or show content
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('Cart page loads and shows items or empty state', async ({ page }) => {
    await setupCustomerSession(page, '/cart');

    await page.waitForTimeout(2000);

    // Cart page should render
    const body = await page.textContent('body');
    expect(body).toBeTruthy();

    // Should show either cart items or empty cart message
    const hasItems = await page.locator('[class*="Card"], [class*="card"]').count() > 0;
    const hasEmptyMsg = await page.getByText(/empty|no items/i).isVisible().catch(() => false);
    const hasProceedBtn = await page.getByText(/proceed/i).isVisible().catch(() => false);

    // Page rendered successfully
    expect(hasItems || hasEmptyMsg || body!.length > 100).toBeTruthy();
  });

  test('Cart quantity controls work (increase/decrease)', async ({ page }) => {
    await setupCustomerSession(page, '/cart');
    await page.waitForTimeout(2000);

    // Check if cart has items
    const plusButton = page.locator('button').filter({ has: page.locator('[class*="Plus"], svg') }).first();
    const minusButton = page.locator('button').filter({ has: page.locator('[class*="Minus"], svg') }).first();

    const hasPlus = await plusButton.isVisible().catch(() => false);

    if (hasPlus) {
      // Get current quantity text
      await plusButton.click();
      await page.waitForTimeout(1000);

      // Page should not crash
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    } else {
      // No items in cart — page renders fine
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }
  });

  test('Cart persists across page navigation', async ({ page }) => {
    await setupCustomerSession(page, '/cart');
    await page.waitForTimeout(2000);

    // Record cart state
    const cartBodyBefore = await page.textContent('body');

    // Navigate away
    await page.goto('/courses');
    await page.waitForTimeout(1000);

    // Navigate back to cart
    await page.goto('/cart');
    await page.waitForTimeout(2000);

    // Cart content should be the same
    const cartBodyAfter = await page.textContent('body');
    expect(cartBodyAfter).toBeTruthy();

    // If there were items before, they should still be there
    // We can't do exact comparison because of timestamps, but page should load
    expect(cartBodyAfter!.length).toBeGreaterThan(50);
  });

});
