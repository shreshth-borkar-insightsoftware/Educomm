import { test, expect } from './helpers/coverage';
import { setupAdminSession, setupCustomerSession, loginViaUI, TEST_ADMIN } from './helpers/auth';
import { uniqueName } from './helpers/test-data';

test.describe('Admin Operations', () => {

  test('Admin dashboard loads with stat cards', async ({ page }) => {
    await setupAdminSession(page, '/admin');

    // Should show admin dashboard content
    await page.waitForTimeout(3000);

    // Dashboard shows stat cards — check for numeric values or card elements
    const body = await page.textContent('body');
    expect(body).toBeTruthy();

    // Look for stat cards by checking for Card elements or numbers
    const cards = page.locator('[class*="Card"], [class*="card"]');
    const cardCount = await cards.count();

    // Admin dashboard should have at least some stat cards or content
    expect(cardCount).toBeGreaterThanOrEqual(1);
  });

  test('Admin can create a new category', async ({ page }) => {
    await setupAdminSession(page, '/admin/categories');
    await page.waitForTimeout(2000);

    // Click Add/Create button to open the modal
    const addButton = page.getByRole('button', { name: /add|create|new/i }).first();
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Fill the category form
    const catName = uniqueName('TestCat');
    const catDesc = 'Test category created by E2E test';

    // Wait for modal to appear
    await page.waitForTimeout(500);

    // Fill name field
    const nameInput = page.locator('input[id*="name"], input[placeholder*="name"], input').filter({ hasText: '' }).first();
    await nameInput.fill(catName);

    // Fill description field
    const descInput = page.locator('input[id*="description"], textarea, input[placeholder*="description"]').first();
    if (await descInput.isVisible()) {
      await descInput.fill(catDesc);
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /add|create|submit|save/i }).last();
    await submitBtn.click();

    await page.waitForTimeout(2000);

    // Category should appear in the list
    await expect(page.getByText(catName)).toBeVisible({ timeout: 5000 });
  });

  test('Non-admin user is blocked from admin panel', async ({ page }) => {
    await setupCustomerSession(page, '/admin');

    // ProtectedAdminRoute should redirect non-admin to /dashboard
    await page.waitForTimeout(3000);

    const url = page.url();
    // Should NOT be on the admin page
    const isOnAdmin = url.endsWith('/admin') || url.endsWith('/admin/');
    const redirectedAway = url.includes('/dashboard') || url.includes('/login');

    // Either redirected to dashboard/login, or the admin page denied access
    expect(isOnAdmin === false || redirectedAway).toBeTruthy();
  });

});
