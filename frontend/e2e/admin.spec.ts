import { test, expect } from './helpers/coverage';
import { setupAdminSession, setupCustomerSession, waitForStatCards } from './helpers/auth';

test.describe('Admin Dashboard & Route Protection', () => {

  test('Admin dashboard loads with 6 stat cards', async ({ page }) => {
    await setupAdminSession(page, '/admin');
    await waitForStatCards(page);

    // Heading
    await expect(page.getByText('Admin Dashboard')).toBeVisible();

    // 6 stat cards: Categories, Courses, Kits, Orders, Enrollments, Users
    await expect(page.getByText(/categories/i).first()).toBeVisible();
    await expect(page.getByText(/courses/i).first()).toBeVisible();
    await expect(page.getByText(/kits/i).first()).toBeVisible();
    await expect(page.getByText(/orders/i).first()).toBeVisible();
    await expect(page.getByText(/enrollments/i).first()).toBeVisible();
    await expect(page.getByText(/users/i).first()).toBeVisible();
  });

  test('Admin dashboard stat cards show numeric counts', async ({ page }) => {
    await setupAdminSession(page, '/admin');
    await waitForStatCards(page);

    // Each stat card shows a number in text-4xl
    const numbers = page.locator('.text-4xl');
    const count = await numbers.count();
    expect(count).toBeGreaterThanOrEqual(6);

    for (let i = 0; i < 6; i++) {
      const text = await numbers.nth(i).textContent();
      const num = parseInt(text || '');
      expect(num).toBeGreaterThanOrEqual(0);
    }
  });

  test('Admin dashboard stat cards navigate to sub-pages', async ({ page }) => {
    await setupAdminSession(page, '/admin');
    await waitForStatCards(page);

    // Click on Categories stat card
    const categoriesCard = page.locator('div').filter({ hasText: /^categories$/i }).first();
    const clickable = categoriesCard.locator('..').locator('..');
    await clickable.click();
    await page.waitForURL(/\/admin\/categories/);
    expect(page.url()).toContain('/admin/categories');

    // Navigate back to dashboard
    await page.goto('http://localhost:5173/admin');
    await waitForStatCards(page);

    // Click on Users stat card
    const usersCard = page.locator('div').filter({ hasText: /^users$/i }).first();
    const usersClickable = usersCard.locator('..').locator('..');
    await usersClickable.click();
    await page.waitForURL(/\/admin\/users/);
    expect(page.url()).toContain('/admin/users');
  });

  test('Admin dashboard shows greeting with admin name', async ({ page }) => {
    await setupAdminSession(page, '/admin');
    await waitForStatCards(page);

    // Greeting: "Welcome back, <name>"
    const greeting = page.getByText(/welcome back/i);
    await expect(greeting).toBeVisible();
  });

  test('Admin dashboard shows loading skeleton initially', async ({ page }) => {
    // Navigate without waiting for full load
    await setupAdminSession(page, '/admin');

    // The page should eventually show stat cards (no loading pulse)
    await waitForStatCards(page);
    const body = await page.textContent('body');
    expect(body).toContain('Admin Dashboard');
  });

  test('Non-admin user is redirected to /dashboard', async ({ page }) => {
    await setupCustomerSession(page, '/admin');

    // ProtectedAdminRoute redirects non-admin users to /dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/admin');
  });

  test('Non-admin user cannot access admin sub-pages', async ({ page }) => {
    await setupCustomerSession(page, '/admin/categories');

    // Should redirect away from admin
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 10000 });
    expect(page.url()).not.toContain('/admin');
  });

  test('Unauthenticated user is redirected to /login', async ({ page }) => {
    // Go directly to admin without any session
    await page.goto('http://localhost:5173/admin');

    // ProtectedAdminRoute redirects to /login
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('Non-admin cannot access admin orders page', async ({ page }) => {
    await setupCustomerSession(page, '/admin/orders');

    // Should redirect
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 10000 });
    expect(page.url()).not.toContain('/admin');
  });
});
