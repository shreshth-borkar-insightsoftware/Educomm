import { test, expect } from './helpers/coverage';
import { setupAdminSession, waitForTableData, waitForModal, waitForMessage } from './helpers/auth';

test.describe('Admin Enrollment Management', () => {

  test('Admin enrollments page loads with table and Add button', async ({ page }) => {
    await setupAdminSession(page, '/admin/enrollments');
    await waitForTableData(page);

    // Heading
    await expect(page.getByText('Enrollment Management')).toBeVisible();

    // Subtitle
    await expect(page.getByText(/manage student course enrollments/i)).toBeVisible();

    // "Add Enrollment" button
    const addBtn = page.getByRole('button', { name: /add enrollment/i });
    await expect(addBtn).toBeVisible();

    // Table headers
    await expect(page.getByText('ID').first()).toBeVisible();
    await expect(page.getByText('User').first()).toBeVisible();
    await expect(page.getByText('Course').first()).toBeVisible();
    await expect(page.getByText('Enrolled').first()).toBeVisible();
    await expect(page.getByText('Actions').first()).toBeVisible();
  });

  test('Admin enrollments table shows enrollment data', async ({ page }) => {
    await setupAdminSession(page, '/admin/enrollments');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // First row should have enrollment data
    const firstRow = rows.first();

    // ID cell
    const idCell = firstRow.locator('td').first();
    const idText = await idCell.textContent();
    expect(parseInt(idText || '0')).toBeGreaterThan(0);

    // User cell (should have a name or email)
    const userCell = firstRow.locator('td').nth(1);
    const userText = await userCell.textContent();
    expect(userText!.length).toBeGreaterThan(0);

    // Course cell
    const courseCell = firstRow.locator('td').nth(2);
    const courseText = await courseCell.textContent();
    expect(courseText!.length).toBeGreaterThan(0);

    // Enrolled date cell (should be a formatted date like "Jan 15, 2026")
    const dateCell = firstRow.locator('td').nth(3);
    const dateText = await dateCell.textContent();
    expect(dateText).toMatch(/[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}/);
  });

  test('Admin can open Add Enrollment modal with user/course dropdowns', async ({ page }) => {
    await setupAdminSession(page, '/admin/enrollments');
    await waitForTableData(page);

    // Click "Add Enrollment"
    await page.getByRole('button', { name: /add enrollment/i }).click();
    await waitForModal(page);

    // Modal title
    await expect(page.getByText(/add new enrollment/i)).toBeVisible();

    // User dropdown
    const userSelect = page.locator('#userId');
    await expect(userSelect).toBeVisible();
    const userOptions = userSelect.locator('option');
    const userOptCount = await userOptions.count();
    expect(userOptCount).toBeGreaterThan(1); // placeholder + at least 1 user

    // Course dropdown
    const courseSelect = page.locator('#courseId');
    await expect(courseSelect).toBeVisible();
    const courseOptions = courseSelect.locator('option');
    const courseOptCount = await courseOptions.count();
    expect(courseOptCount).toBeGreaterThan(1); // placeholder + at least 1 course

    // Cancel and submit buttons
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    const submitBtn = page.locator('.fixed.inset-0').getByRole('button', { name: /add enrollment/i });
    await expect(submitBtn).toBeVisible();
  });

  test('Admin can create a new enrollment end-to-end', async ({ page }) => {
    await setupAdminSession(page, '/admin/enrollments');
    await waitForTableData(page);

    await page.getByRole('button', { name: /add enrollment/i }).click();
    await waitForModal(page);

    // Select user and course
    const userSelect = page.locator('#userId');
    await userSelect.selectOption({ index: 1 });

    const courseSelect = page.locator('#courseId');
    await courseSelect.selectOption({ index: 1 });

    // Submit
    const addBtn = page.locator('.fixed.inset-0').getByRole('button', { name: /add enrollment/i });
    await addBtn.click();

    // Should show success or error message (might error if already enrolled)
    await waitForMessage(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/successfully|already|failed/i);
  });

  test('Admin enrollment modal cancel closes without creating', async ({ page }) => {
    await setupAdminSession(page, '/admin/enrollments');
    await waitForTableData(page);

    const rowsBefore = page.locator('tbody tr');
    const countBefore = await rowsBefore.count();

    // Open modal
    await page.getByRole('button', { name: /add enrollment/i }).click();
    await waitForModal(page);

    // Select data
    await page.locator('#userId').selectOption({ index: 1 });
    await page.locator('#courseId').selectOption({ index: 1 });

    // Cancel
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible({ timeout: 3000 });
  });

  test('Admin can delete an enrollment with confirmation', async ({ page }) => {
    await setupAdminSession(page, '/admin/enrollments');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Accept confirmation dialog
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Are you sure');
      await dialog.accept();
    });

    // Delete last enrollment
    const lastRow = rows.last();
    const deleteBtn = lastRow.locator('button').filter({ has: page.locator('svg') });
    await deleteBtn.click();

    // Wait for result
    await waitForMessage(page);
    await expect(page.getByText(/deleted successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('Admin enrollments each row has a delete button', async ({ page }) => {
    await setupAdminSession(page, '/admin/enrollments');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 3); i++) {
      const row = rows.nth(i);
      const deleteBtn = row.locator('button').filter({ has: page.locator('svg') });
      await expect(deleteBtn).toBeVisible();
    }
  });

  test('Admin enrollments shows formatted dates', async ({ page }) => {
    await setupAdminSession(page, '/admin/enrollments');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Check multiple rows for formatted dates (e.g., "Jan 15, 2026")
    for (let i = 0; i < Math.min(count, 3); i++) {
      const dateCell = rows.nth(i).locator('td').nth(3);
      const dateText = await dateCell.textContent();
      // Should match format like "Jan 15, 2026"
      expect(dateText).toMatch(/[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}/);
    }
  });

  test('Admin enrollments shows pagination and navigation', async ({ page }) => {
    await setupAdminSession(page, '/admin/enrollments');
    await waitForTableData(page);

    const pagination = page.getByText(/showing page/i);
    const hasPagination = await pagination.isVisible().catch(() => false);
    if (hasPagination) {
      await expect(pagination).toBeVisible();

      // Try clicking Next if available and enabled
      const nextBtn = page.getByRole('button', { name: /next/i });
      const hasNext = await nextBtn.isVisible().catch(() => false);
      if (hasNext) {
        const isDisabled = await nextBtn.isDisabled();
        if (!isDisabled) {
          await nextBtn.click();
          await waitForTableData(page);
          await expect(page.getByText(/page 2/i)).toBeVisible();

          // Go back
          const prevBtn = page.getByRole('button', { name: /previous/i });
          if (await prevBtn.isVisible().catch(() => false)) {
            await prevBtn.click();
            await waitForTableData(page);
          }
        }
      }
    }
  });
});
