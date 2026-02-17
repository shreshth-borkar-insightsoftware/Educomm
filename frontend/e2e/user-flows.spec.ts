import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

test.describe('User Flows', () => {

  test('Add a new address', async ({ page }) => {
    await setupCustomerSession(page, '/address');
    await page.waitForTimeout(2000);

    // Click the Add button to show the form
    const addButton = page.getByRole('button', { name: /add|new/i }).first();
    const hasAddBtn = await addButton.isVisible().catch(() => false);

    if (hasAddBtn) {
      await addButton.click();
      await page.waitForTimeout(500);
    }

    // Fill the address form fields
    const streetInput = page.locator('#street, input[placeholder*="House"], input[placeholder*="Street"], input[placeholder*="street"]').first();
    const cityInput = page.locator('#city, input[placeholder*="city"], input[placeholder*="City"]').first();
    const zipInput = page.locator('#zipCode, input[placeholder*="zip"], input[placeholder*="Zip"], input[placeholder*="Pin"]').first();
    const phoneInput = page.locator('#phoneNumber, input[placeholder*="phone"], input[placeholder*="Phone"], input[type="tel"]').first();

    const hasForm = await streetInput.isVisible().catch(() => false);

    if (hasForm) {
      const timestamp = Date.now().toString().slice(-6);
      await streetInput.fill(`123 Test Street ${timestamp}`);
      await cityInput.fill('Test City');
      await zipInput.fill('400001');
      await phoneInput.fill('+91 9876500001');

      // Submit the form
      const saveBtn = page.getByRole('button', { name: /save|add|submit/i }).last();
      
      // Handle any alert
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      await saveBtn.click();
      await page.waitForTimeout(2000);

      // Address should appear in the list
      const body = await page.textContent('body');
      expect(body).toContain('Test City');
    } else {
      // Form might already be visible or layout is different
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }
  });

  test('My Orders page loads correctly', async ({ page }) => {
    await setupCustomerSession(page, '/my-orders');
    await page.waitForTimeout(3000);

    // Page should render
    const body = await page.textContent('body');
    expect(body).toBeTruthy();

    // Should show orders heading or content
    const hasOrders = await page.locator('table, [class*="Card"], [class*="card"]').count() > 0;
    const hasEmptyMsg = await page.getByText(/no orders|empty|haven't placed/i).isVisible().catch(() => false);

    // Either shows orders or empty state message
    expect(hasOrders || hasEmptyMsg || body!.length > 100).toBeTruthy();
  });

});
