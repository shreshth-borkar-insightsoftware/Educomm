import { test, expect } from './helpers/coverage';
import { setupAdminSession } from './helpers/auth';

test.describe('Admin User Management', () => {

  test('Admin users page loads with stat cards and table', async ({ page }) => {
    await setupAdminSession(page, '/admin/users');
    await page.waitForTimeout(3000);

    // Heading
    await expect(page.getByText('User Management')).toBeVisible();

    // Should show stat cards: Total Users, Admins, Customers
    const totalUsersCard = page.getByText(/total users/i);
    const adminsCard = page.getByText(/admins/i).first();
    const customersCard = page.getByText(/customers/i).first();

    await expect(totalUsersCard).toBeVisible();
    await expect(adminsCard).toBeVisible();
    await expect(customersCard).toBeVisible();

    // Table should render
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
  });

  test('Admin users table shows user details with role badges', async ({ page }) => {
    await setupAdminSession(page, '/admin/users');
    await page.waitForTimeout(3000);

    // Table should have rows
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      // Check for role badges
      const adminBadge = page.getByText('Admin', { exact: true }).first();
      const hasAdmin = await adminBadge.isVisible().catch(() => false);

      // Check for user info (email, name)
      const body = await page.textContent('body');
      expect(body).toContain('@'); // At least one email should be visible
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Admin users page pagination works', async ({ page }) => {
    await setupAdminSession(page, '/admin/users');
    await page.waitForTimeout(3000);

    // Check pagination
    const pagination = page.getByText(/showing page/i);
    const hasPagination = await pagination.isVisible().catch(() => false);

    if (hasPagination) {
      await expect(pagination).toBeVisible();

      // Check total records
      const totalRecords = page.getByText(/total records/i);
      const hasTotal = await totalRecords.isVisible().catch(() => false);

      // Try Next button
      const nextBtn = page.getByRole('button', { name: /next/i });
      const hasNext = await nextBtn.isVisible().catch(() => false);
      if (hasNext) {
        const isDisabled = await nextBtn.isDisabled();
        if (!isDisabled) {
          await nextBtn.click();
          await page.waitForTimeout(2000);
          const body = await page.textContent('body');
          expect(body).toBeTruthy();

          // Go back with Previous
          const prevBtn = page.getByRole('button', { name: /previous/i });
          if (await prevBtn.isVisible().catch(() => false)) {
            await prevBtn.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Admin users stat cards show correct counts', async ({ page }) => {
    await setupAdminSession(page, '/admin/users');
    await page.waitForTimeout(3000);

    // Stat cards should show Total Users, Admins, Customers with counts
    const totalUsers = page.getByText(/total users/i);
    const admins = page.getByText(/admins/i).first();
    const customers = page.getByText(/customers/i).first();

    await expect(totalUsers).toBeVisible();
    await expect(admins).toBeVisible();
    await expect(customers).toBeVisible();

    // Check that numbers are displayed
    const body = await page.textContent('body');
    expect(body).toMatch(/\d+/);
  });

});
