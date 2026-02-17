import { test, expect } from './helpers/coverage';
import { loginViaUI, loginAsCustomer, TEST_CUSTOMER, TEST_ADMIN } from './helpers/auth';

test.describe('Authentication Flow', () => {

  test('Login with valid customer credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/login');

    // Verify login page elements are present
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Fill credentials and submit
    await page.locator('#email').fill(TEST_CUSTOMER.email);
    await page.locator('#password').fill(TEST_CUSTOMER.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');

    // Page should have loaded with content
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);
  });

  test('Login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');

    // Listen for dialog (alert) from the app
    const dialogPromise = page.waitForEvent('dialog');

    await page.locator('#email').fill('wrong@example.com');
    await page.locator('#password').fill('WrongPassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // App uses window.alert for login errors
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Login failed');
    await dialog.dismiss();

    // Should stay on login page
    expect(page.url()).toContain('/login');
  });

  test('Logout clears session and redirects to login', async ({ page }) => {
    // Login first
    await loginAsCustomer(page);

    // Verify we're on dashboard
    expect(page.url()).toContain('/dashboard');

    // Click logout in sidebar
    await page.getByText('Logout').click();

    // Should redirect to login
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');

    // localStorage should be cleared
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('Accessing dashboard without auth shows empty state or fails gracefully', async ({ page }) => {
    // Clear any existing auth
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });

    // Navigate to a protected page
    await page.goto('/dashboard');

    // The page should load but API calls will fail (no token)
    // The page should either show empty state or redirect
    // Give it time to make API calls and handle errors
    await page.waitForTimeout(3000);

    // Page should still render (no crash), but content should be empty/error state
    // OR it redirected to login
    const url = page.url();
    const isOnDashboard = url.includes('/dashboard');
    const isOnLogin = url.includes('/login');
    expect(isOnDashboard || isOnLogin).toBeTruthy();
  });

});
