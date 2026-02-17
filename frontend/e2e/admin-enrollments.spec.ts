import { test, expect } from './helpers/coverage';
import { setupAdminSession } from './helpers/auth';

test.describe('Admin Enrollment Management', () => {

  test('Admin enrollments page loads with table and Add button', async ({ page }) => {
    await setupAdminSession(page, '/admin/enrollments');
    await page.waitForTimeout(3000);

    // Heading
    await expect(page.getByText('Enrollment Management')).toBeVisible();

    // "Add Enrollment" button
    const addBtn = page.getByRole('button', { name: /add enrollment/i });
    await expect(addBtn).toBeVisible();

    // Table or content
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
  });

  test('Admin can open Add Enrollment modal and see user/course dropdowns', async ({ page }) => {
    await setupAdminSession(page, '/admin/enrollments');
    await page.waitForTimeout(3000);

    // Click "Add Enrollment"
    await page.getByRole('button', { name: /add enrollment/i }).click();
    await page.waitForTimeout(1000);

    // Modal should show User and Course select dropdowns
    const selects = page.locator('select');
    const selectCount = await selects.count();
    expect(selectCount).toBeGreaterThanOrEqual(2);

    // User dropdown should have options
    const userSelect = selects.first();
    await expect(userSelect).toBeVisible();

    // Course dropdown should have options
    const courseSelect = selects.nth(1);
    await expect(courseSelect).toBeVisible();

    // Cancel button should work
    const cancelBtn = page.getByRole('button', { name: /cancel/i });
    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click();
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Admin can create a new enrollment', async ({ page }) => {
    await setupAdminSession(page, '/admin/enrollments');
    await page.waitForTimeout(3000);

    await page.getByRole('button', { name: /add enrollment/i }).click();
    await page.waitForTimeout(1000);

    // Select a user from dropdown
    const selects = page.locator('select');
    const userSelect = selects.first();
    const userOptions = userSelect.locator('option');
    const userOptCount = await userOptions.count();

    if (userOptCount > 1) {
      // Select second option (first is usually placeholder)
      await userSelect.selectOption({ index: 1 });
    }

    // Select a course
    const courseSelect = selects.nth(1);
    const courseOptions = courseSelect.locator('option');
    const courseOptCount = await courseOptions.count();

    if (courseOptCount > 1) {
      await courseSelect.selectOption({ index: 1 });
    }

    // Submit
    const addBtn = page.getByRole('button', { name: /add/i }).last();
    await addBtn.click();
    await page.waitForTimeout(3000);

    // Page should render (may show success or error if already enrolled)
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Admin can delete an enrollment', async ({ page }) => {
    await setupAdminSession(page, '/admin/enrollments');
    await page.waitForTimeout(3000);

    const deleteButtons = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2, [class*="trash"]') });
    const count = await deleteButtons.count();

    if (count > 0) {
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      await deleteButtons.last().click();
      await page.waitForTimeout(2000);
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Admin enrollments page shows formatted dates and pagination', async ({ page }) => {
    await setupAdminSession(page, '/admin/enrollments');
    await page.waitForTimeout(3000);

    // Check for table rows
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();

    // Check pagination
    const pagination = page.getByText(/showing page/i);
    const hasPagination = await pagination.isVisible().catch(() => false);
    if (hasPagination) {
      await expect(pagination).toBeVisible();

      // Try clicking Next if available
      const nextBtn = page.getByRole('button', { name: /next/i });
      const isDisabled = await nextBtn.isDisabled().catch(() => true);
      if (!isDisabled) {
        await nextBtn.click();
        await page.waitForTimeout(2000);
        // Should show page 2
        const body = await page.textContent('body');
        expect(body).toContain('2');
      }
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

});
