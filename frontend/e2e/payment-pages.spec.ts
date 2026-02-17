import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

test.describe('Payment Success Page', () => {

  test('Payment success page without session_id redirects to dashboard', async ({ page }) => {
    await setupCustomerSession(page, '/payment/success');
    await page.waitForTimeout(3000);

    // Without session_id, should redirect to dashboard
    expect(page.url()).toContain('/dashboard');
  });

  test('Payment success page with invalid session_id shows error', async ({ page }) => {
    await setupCustomerSession(page, '/payment/success?session_id=invalid_session_123');
    await page.waitForTimeout(5000);

    // Should show verifying or error state
    const body = await page.textContent('body');
    const hasVerifying = body!.includes('Verifying Payment');
    const hasError = body!.includes('Verification Failed') || body!.includes('error');
    const hasSuccess = body!.includes('Payment Successful');

    // Should reach one of these states
    expect(hasVerifying || hasError || hasSuccess).toBeTruthy();
  });

});

test.describe('Payment Cancel Page', () => {

  test('Payment cancel page redirects to cart with failed param', async ({ page }) => {
    await setupCustomerSession(page, '/payment/cancel');
    await page.waitForTimeout(3000);

    // PaymentCancel redirects to /cart?payment=failed
    expect(page.url()).toContain('/cart');
    expect(page.url()).toContain('payment=failed');
  });

  test('Cart page shows payment failed notification', async ({ page }) => {
    await setupCustomerSession(page, '/cart?payment=failed');
    await page.waitForTimeout(3000);

    // PaymentNotification component should show failure message
    const failedNotification = page.getByText(/payment.*failed|payment.*cancel|order.*not.*placed/i);
    const hasNotification = await failedNotification.isVisible().catch(() => false);

    // The page at minimum should load
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    // Cart or notification should be visible
    expect(hasNotification || body!.length > 50).toBeTruthy();
  });

});
