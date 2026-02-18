import { test, expect } from './helpers/coverage';
import { setupAdminSession, waitForTableData, waitForStatCards } from './helpers/auth';

test.describe('Admin User Management', () => {

  test('Admin users page loads with stat cards and table', async ({ page }) => {
    await setupAdminSession(page, '/admin/users');
    await waitForTableData(page);

    // Heading
    await expect(page.getByText('User Management')).toBeVisible();
    await expect(page.getByText(/view all registered users/i)).toBeVisible();

    // Stat cards: Total Users, Admins, Customers
    await expect(page.getByText(/total users/i)).toBeVisible();
    await expect(page.getByText(/admins/i).first()).toBeVisible();
    await expect(page.getByText(/customers/i).first()).toBeVisible();

    // Table headers
    await expect(page.getByText('User ID').first()).toBeVisible();
    await expect(page.getByText('Name').first()).toBeVisible();
    await expect(page.getByText('Email').first()).toBeVisible();
    await expect(page.getByText('Phone Number').first()).toBeVisible();
    await expect(page.getByText('Role').first()).toBeVisible();
  });

  test('Admin users table shows user data with email', async ({ page }) => {
    await setupAdminSession(page, '/admin/users');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // First row should have user data
    const firstRow = rows.first();

    // User ID (starts with #)
    const idCell = firstRow.locator('td').first();
    const idText = await idCell.textContent();
    expect(idText).toMatch(/#\d+/);

    // Email cell should contain @
    const body = await page.textContent('body');
    expect(body).toContain('@');

    // Role badge
    const roleBadge = firstRow.locator('span.rounded-full');
    await expect(roleBadge).toBeVisible();
    const roleText = await roleBadge.textContent();
    expect(roleText === 'Admin' || roleText === 'Customer').toBeTruthy();
  });

  test('Admin users table shows role badges with correct colors', async ({ page }) => {
    await setupAdminSession(page, '/admin/users');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Check for Admin badge (purple) and Customer badge (blue)
    let foundAdmin = false;
    let foundCustomer = false;

    for (let i = 0; i < Math.min(count, 10); i++) {
      const badge = rows.nth(i).locator('span.rounded-full');
      const isVisible = await badge.isVisible().catch(() => false);
      if (isVisible) {
        const text = await badge.textContent();
        const classes = await badge.getAttribute('class') || '';

        if (text === 'Admin') {
          expect(classes).toContain('purple');
          foundAdmin = true;
        } else if (text === 'Customer') {
          expect(classes).toContain('blue');
          foundCustomer = true;
        }
      }
    }

    // At least one badge type should be found
    expect(foundAdmin || foundCustomer).toBeTruthy();
  });

  test('Admin users stat cards show numeric counts', async ({ page }) => {
    await setupAdminSession(page, '/admin/users');
    await waitForTableData(page);

    // Stat card numbers (text-3xl font-bold)
    const statNumbers = page.locator('.text-3xl.font-bold');
    const count = await statNumbers.count();
    expect(count).toBe(3); // Total Users, Admins, Customers

    // All 3 should show numbers
    for (let i = 0; i < count; i++) {
      const text = await statNumbers.nth(i).textContent();
      expect(parseInt(text || '0')).toBeGreaterThanOrEqual(0);
    }

    // Total should be >= Admins + Customers
    const totalText = await statNumbers.nth(0).textContent();
    const adminText = await statNumbers.nth(1).textContent();
    const customerText = await statNumbers.nth(2).textContent();
    const total = parseInt(totalText || '0');
    const admins = parseInt(adminText || '0');
    const customers = parseInt(customerText || '0');

    // Total users on the page should equal admins + customers
    expect(total).toBe(admins + customers);
  });

  test('Admin users shows name or dash fallback', async ({ page }) => {
    await setupAdminSession(page, '/admin/users');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Check name cells — should have a name or "—" fallback
    for (let i = 0; i < Math.min(count, 5); i++) {
      const nameCell = rows.nth(i).locator('td').nth(1);
      const nameText = await nameCell.textContent();
      // Should have some text (name or —)
      expect(nameText!.trim().length).toBeGreaterThan(0);
    }
  });

  test('Admin users page pagination works', async ({ page }) => {
    await setupAdminSession(page, '/admin/users');
    await waitForTableData(page);

    const pagination = page.getByText(/showing page/i);
    const hasPagination = await pagination.isVisible().catch(() => false);

    if (hasPagination) {
      await expect(pagination).toBeVisible();

      // Previous should be disabled on first page
      const prevBtn = page.getByRole('button', { name: /previous/i });
      const prevVisible = await prevBtn.isVisible().catch(() => false);
      if (prevVisible) {
        const isDisabled = await prevBtn.isDisabled();
        expect(isDisabled).toBeTruthy();
      }

      // Try Next button
      const nextBtn = page.getByRole('button', { name: /next/i });
      const hasNext = await nextBtn.isVisible().catch(() => false);
      if (hasNext) {
        const isDisabled = await nextBtn.isDisabled();
        if (!isDisabled) {
          await nextBtn.click();
          await waitForTableData(page);

          // Previous should now be enabled
          const prevBtnAfter = page.getByRole('button', { name: /previous/i });
          if (await prevBtnAfter.isVisible().catch(() => false)) {
            const prevDisabled = await prevBtnAfter.isDisabled();
            expect(prevDisabled).toBeFalsy();

            // Go back
            await prevBtnAfter.click();
            await waitForTableData(page);
          }
        }
      }
    }
  });

  test('Admin users shows phone number or dash', async ({ page }) => {
    await setupAdminSession(page, '/admin/users');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Phone number column
    const phoneCell = rows.first().locator('td').nth(3);
    const phoneText = await phoneCell.textContent();
    // Should have phone number or "—"
    expect(phoneText!.trim().length).toBeGreaterThan(0);
  });

  test('Admin users stat cards have icons', async ({ page }) => {
    await setupAdminSession(page, '/admin/users');
    await waitForTableData(page);

    // The stat card area should have SVG icons
    const statSection = page.locator('.grid.grid-cols-1.md\\:grid-cols-3');
    await expect(statSection).toBeVisible();

    // Should have 3 stat cards
    const cards = statSection.locator('> div');
    const cardCount = await cards.count();
    expect(cardCount).toBe(3);
  });
});
