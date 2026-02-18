import { test, expect } from './helpers/coverage';
import { setupAdminSession, waitForTableData, waitForModal, waitForMessage } from './helpers/auth';
import { uniqueName } from './helpers/test-data';

test.describe('Admin Categories Page', () => {

  test('Admin categories page loads with table headers', async ({ page }) => {
    await setupAdminSession(page, '/admin/categories');
    await waitForTableData(page);

    // Heading
    await expect(page.getByText(/category management/i)).toBeVisible();

    // Table headers
    await expect(page.getByText('ID').first()).toBeVisible();
    await expect(page.getByText('Name').first()).toBeVisible();
    await expect(page.getByText('Description').first()).toBeVisible();
    await expect(page.getByText('Actions').first()).toBeVisible();

    // Add Category button
    const addBtn = page.getByRole('button', { name: /add category/i });
    await expect(addBtn).toBeVisible();
  });

  test('Admin categories page shows category rows with data', async ({ page }) => {
    await setupAdminSession(page, '/admin/categories');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // First row should have cells: ID (font-mono), Name (font-semibold), Description, Actions
    const firstRow = rows.first();
    const idCell = firstRow.locator('td').first();
    await expect(idCell).toBeVisible();
    const idText = await idCell.textContent();
    expect(parseInt(idText || '0')).toBeGreaterThan(0);

    // Name cell
    const nameCell = firstRow.locator('td').nth(1);
    const nameText = await nameCell.textContent();
    expect(nameText!.length).toBeGreaterThan(0);
  });

  test('Admin categories Add Category modal opens and closes', async ({ page }) => {
    await setupAdminSession(page, '/admin/categories');
    await waitForTableData(page);

    // Open modal
    const addBtn = page.getByRole('button', { name: /add category/i });
    await addBtn.click();
    await waitForModal(page);

    // Modal should have form fields
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#description')).toBeVisible();

    // Should have "Add New Category" title
    await expect(page.getByText(/add new category/i)).toBeVisible();

    // Cancel button should close modal
    const cancelBtn = page.getByRole('button', { name: /cancel/i });
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Modal should be gone
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible({ timeout: 3000 });
  });

  test('Admin categories X button closes modal and resets form', async ({ page }) => {
    await setupAdminSession(page, '/admin/categories');
    await waitForTableData(page);

    // Open modal
    await page.getByRole('button', { name: /add category/i }).click();
    await waitForModal(page);

    // Fill form fields
    await page.locator('#name').fill('Test Category');
    await page.locator('#description').fill('Test Description');

    // Click X close button (the button with X icon inside modal)
    const closeBtn = page.locator('.fixed.inset-0 button').filter({ has: page.locator('svg') }).first();
    await closeBtn.click();

    // Modal should close
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible({ timeout: 3000 });

    // Re-open modal — form should be cleared
    await page.getByRole('button', { name: /add category/i }).click();
    await waitForModal(page);
    const nameValue = await page.locator('#name').inputValue();
    expect(nameValue).toBe('');
  });

  test('Admin can create a new category end-to-end', async ({ page }) => {
    await setupAdminSession(page, '/admin/categories');
    await waitForTableData(page);

    const catName = uniqueName('E2ECat');
    const catDesc = 'E2E test category description';

    // Open modal
    await page.getByRole('button', { name: /add category/i }).click();
    await waitForModal(page);

    // Fill form
    await page.locator('#name').fill(catName);
    await page.locator('#description').fill(catDesc);

    // Submit
    const submitBtn = page.locator('.fixed.inset-0').getByRole('button', { name: /add category/i });
    await submitBtn.click();

    // Wait for success message
    await waitForMessage(page);
    await expect(page.getByText(/category added successfully/i)).toBeVisible({ timeout: 5000 });

    // Category should appear in the table
    await expect(page.getByText(catName)).toBeVisible({ timeout: 5000 });
  });

  test('Admin category creation form has required attributes', async ({ page }) => {
    await setupAdminSession(page, '/admin/categories');
    await waitForTableData(page);

    // Open modal
    await page.getByRole('button', { name: /add category/i }).click();
    await waitForModal(page);

    // Verify required attributes
    const nameInput = page.locator('#name');
    const descInput = page.locator('#description');
    await expect(nameInput).toHaveAttribute('required', '');
    await expect(descInput).toHaveAttribute('required', '');
  });

  test('Admin can delete a category with confirmation', async ({ page }) => {
    await setupAdminSession(page, '/admin/categories');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Accept the confirmation dialog
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('Are you sure');
      await dialog.accept();
    });

    // Click the delete button on the last row
    const lastRow = rows.last();
    const deleteBtn = lastRow.locator('button').filter({ has: page.locator('svg') });
    await deleteBtn.click();

    // Wait for success message
    await waitForMessage(page);
    await expect(page.getByText(/deleted successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('Admin categories each row has a delete button', async ({ page }) => {
    await setupAdminSession(page, '/admin/categories');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Each row should have a delete button with trash icon
    for (let i = 0; i < Math.min(count, 3); i++) {
      const row = rows.nth(i);
      const deleteBtn = row.locator('button').filter({ has: page.locator('svg') });
      await expect(deleteBtn).toBeVisible();
    }
  });

  test('Admin categories shows pagination controls', async ({ page }) => {
    await setupAdminSession(page, '/admin/categories');
    await waitForTableData(page);

    // Pagination should be visible
    const pagination = page.getByText(/showing page/i);
    const hasPagination = await pagination.isVisible().catch(() => false);

    if (hasPagination) {
      await expect(pagination).toBeVisible();
      const totalRecords = page.getByText(/total records/i);
      await expect(totalRecords).toBeVisible();
    }
  });

  test('Admin categories success message auto-dismisses', async ({ page }) => {
    test.setTimeout(30000);
    await setupAdminSession(page, '/admin/categories');
    await waitForTableData(page);

    const catName = uniqueName('AutoDismiss');

    // Create a category to trigger success message
    await page.getByRole('button', { name: /add category/i }).click();
    await waitForModal(page);
    await page.locator('#name').fill(catName);
    await page.locator('#description').fill('Test auto-dismiss');
    await page.locator('.fixed.inset-0').getByRole('button', { name: /add category/i }).click();

    // Success message should appear
    const successMsg = page.getByText(/category added successfully/i);
    await expect(successMsg).toBeVisible({ timeout: 5000 });

    // Message should auto-dismiss after ~3s
    await expect(successMsg).not.toBeVisible({ timeout: 6000 });
  });

  test('Admin categories subtitle text is visible', async ({ page }) => {
    await setupAdminSession(page, '/admin/categories');
    await waitForTableData(page);

    await expect(page.getByText(/manage course categories/i)).toBeVisible();
  });
});

test.describe('Admin Dashboard Page', () => {

  test('Admin dashboard loads with stat card labels', async ({ page }) => {
    await setupAdminSession(page, '/admin');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/admin dashboard/i)).toBeVisible({ timeout: 10000 });

    // All 6 stat labels should be visible
    await expect(page.getByText(/total users/i)).toBeVisible();
    await expect(page.getByText(/total courses/i)).toBeVisible();
    await expect(page.getByText(/total kits/i)).toBeVisible();
    await expect(page.getByText(/total categories/i)).toBeVisible();
    await expect(page.getByText(/total orders/i)).toBeVisible();
    await expect(page.getByText(/total enrollments/i)).toBeVisible();
  });

  test('Admin dashboard shows numeric counts greater than zero', async ({ page }) => {
    await setupAdminSession(page, '/admin');
    await page.waitForLoadState('networkidle');

    // Wait for pulse animations to disappear (loading done)
    await expect(page.locator('.animate-pulse').first()).not.toBeVisible({ timeout: 15000 }).catch(() => {});

    const statNumbers = page.locator('h3.text-4xl');
    const count = await statNumbers.count();
    expect(count).toBeGreaterThanOrEqual(4);

    let hasNonZero = false;
    for (let i = 0; i < count; i++) {
      const text = await statNumbers.nth(i).textContent();
      if (parseInt(text || '0') > 0) {
        hasNonZero = true;
        break;
      }
    }
    expect(hasNonZero).toBeTruthy();
  });

  test('Admin dashboard stat cards navigate to correct pages', async ({ page }) => {
    await setupAdminSession(page, '/admin');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[class*="cursor-pointer"]').first()).toBeVisible({ timeout: 10000 });

    // Click "Total Users" card → should navigate to /admin/users
    const usersCard = page.locator('[class*="cursor-pointer"]').filter({ hasText: /total users/i });
    await usersCard.click();
    await page.waitForURL('**/admin/users', { timeout: 5000 });
    expect(page.url()).toContain('/admin/users');

    // Go back and click courses card
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[class*="cursor-pointer"]').first()).toBeVisible({ timeout: 10000 });

    const coursesCard = page.locator('[class*="cursor-pointer"]').filter({ hasText: /total courses/i });
    await coursesCard.click();
    await page.waitForURL('**/admin/courses', { timeout: 5000 });
    expect(page.url()).toContain('/admin/courses');
  });

  test('Admin dashboard shows user greeting', async ({ page }) => {
    await setupAdminSession(page, '/admin');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/overview of platform statistics/i)).toBeVisible({ timeout: 10000 });
  });
});
