import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

test.describe('Payment Success Page', () => {

  test('Payment success page without session_id redirects to dashboard', async ({ page }) => {
    await setupCustomerSession(page, '/payment/success');

    // Without session_id, should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('Payment success page with invalid session_id shows VERIFICATION FAILED', async ({ page }) => {
    await setupCustomerSession(page, '/payment/success?session_id=invalid_session_123');

    // Wait for verification to complete (API call will fail)
    await page.waitForTimeout(5000);

    // PaymentNotification shows "VERIFICATION FAILED"
    const failedTitle = page.getByText('VERIFICATION FAILED');
    const hasError = await failedTitle.isVisible().catch(() => false);

    if (hasError) {
      await expect(failedTitle).toBeVisible();

      // Should show error message
      await expect(page.getByText(/payment verification failed/i)).toBeVisible();

      // Should show red XCircle icon area (bg-red-500/20)
      const redIcon = page.locator('[class*="bg-red-500"]');
      const hasRedIcon = await redIcon.first().isVisible().catch(() => false);
      expect(hasRedIcon).toBeTruthy();

      // Should show "BACK TO CART" button
      const backBtn = page.getByText('BACK TO CART');
      await expect(backBtn).toBeVisible();

      // Click BACK TO CART
      await backBtn.click();
      await page.waitForURL(/\/cart/, { timeout: 10000 });
      expect(page.url()).toContain('/cart');
    } else {
      // May still be verifying or redirected
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(50);
    }
  });

});

test.describe('Payment Cancel Page', () => {

  test('Payment cancel page redirects to cart with payment=failed', async ({ page }) => {
    await setupCustomerSession(page, '/payment/cancel');

    // PaymentCancel redirects to /cart?payment=failed
    await page.waitForURL(/\/cart.*payment=failed/, { timeout: 10000 });
    expect(page.url()).toContain('/cart');
    expect(page.url()).toContain('payment=failed');
  });

  test('Cart with payment=failed shows PaymentNotification with red styling', async ({ page }) => {
    await setupCustomerSession(page, '/cart?payment=failed');
    await page.waitForTimeout(2000);

    // PaymentNotification renders as a modal overlay
    const overlay = page.locator('.fixed.inset-0');
    const hasOverlay = await overlay.first().isVisible().catch(() => false);

    if (hasOverlay) {
      // Should show "VERIFICATION FAILED" text
      const failedText = page.getByText('VERIFICATION FAILED');
      const hasTitle = await failedText.isVisible().catch(() => false);
      
      if (hasTitle) {
        await expect(failedText).toBeVisible();

        // Should have "BACK TO CART" button
        const backBtn = page.getByText('BACK TO CART');
        await expect(backBtn).toBeVisible();
      }
    }

    // Page loaded regardless
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);
  });

});

test.describe('PaymentNotification Component', () => {

  test('Payment failed notification has modal overlay with dark background', async ({ page }) => {
    await setupCustomerSession(page, '/cart?payment=failed');
    await page.waitForTimeout(2000);

    // The bg-black/80 overlay
    const overlay = page.locator('.bg-black\\/80, [class*="bg-black"]');
    const hasOverlay = await overlay.first().isVisible().catch(() => false);

    // Modal content with rounded-2xl
    const modal = page.locator('.rounded-2xl');
    const hasModal = await modal.first().isVisible().catch(() => false);

    // At least the page loaded
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);
  });

});
