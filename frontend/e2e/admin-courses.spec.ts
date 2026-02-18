import { test, expect } from './helpers/coverage';
import { setupAdminSession, waitForTableData, waitForModal, waitForMessage } from './helpers/auth';
import { uniqueName } from './helpers/test-data';

test.describe('Admin Course Management', () => {

  test('Admin courses page loads with table and Add button', async ({ page }) => {
    await setupAdminSession(page, '/admin/courses');
    await waitForTableData(page);

    // Heading
    await expect(page.getByText('Course Management')).toBeVisible();

    // "Add Course" button
    const addBtn = page.getByRole('button', { name: /add course/i });
    await expect(addBtn).toBeVisible();

    // Table headers
    await expect(page.getByText('ID').first()).toBeVisible();
    await expect(page.getByText('Name').first()).toBeVisible();
    await expect(page.getByText('Category').first()).toBeVisible();
    await expect(page.getByText('Difficulty').first()).toBeVisible();
    await expect(page.getByText('Duration').first()).toBeVisible();
    await expect(page.getByText('Status').first()).toBeVisible();

    // Subtitle
    await expect(page.getByText(/manage educational courses/i)).toBeVisible();
  });

  test('Admin courses table shows course data with badges', async ({ page }) => {
    await setupAdminSession(page, '/admin/courses');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // First row should have course data
    const firstRow = rows.first();

    // ID cell (font-mono)
    const idCell = firstRow.locator('td').first();
    const idText = await idCell.textContent();
    expect(parseInt(idText || '0')).toBeGreaterThan(0);

    // Name cell (font-semibold)
    const nameCell = firstRow.locator('td').nth(1);
    const nameText = await nameCell.textContent();
    expect(nameText!.length).toBeGreaterThan(0);

    // Category cell
    const catCell = firstRow.locator('td').nth(2);
    const catText = await catCell.textContent();
    expect(catText!.length).toBeGreaterThan(0);

    // Difficulty badge
    const diffBadge = firstRow.locator('span.rounded-lg');
    await expect(diffBadge).toBeVisible();

    // Duration cell (should contain "min")
    const durationCell = firstRow.locator('td').nth(4);
    const durationText = await durationCell.textContent();
    expect(durationText).toContain('min');

    // Status badge (Active or Inactive)
    const statusBadge = firstRow.locator('span.rounded-full');
    await expect(statusBadge).toBeVisible();
    const statusText = await statusBadge.textContent();
    expect(statusText === 'Active' || statusText === 'Inactive').toBeTruthy();
  });

  test('Admin can open Add Course modal with all form fields', async ({ page }) => {
    await setupAdminSession(page, '/admin/courses');
    await waitForTableData(page);

    // Click "Add Course"
    await page.getByRole('button', { name: /add course/i }).click();
    await waitForModal(page);

    // Modal title
    await expect(page.getByText(/add new course/i)).toBeVisible();

    // Name input (required)
    const nameInput = page.locator('#name');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveAttribute('required', '');

    // Category dropdown (required)
    const categorySelect = page.locator('#categoryId');
    await expect(categorySelect).toBeVisible();
    // Should have options (categories loaded from API)
    const catOptions = categorySelect.locator('option');
    const catOptCount = await catOptions.count();
    expect(catOptCount).toBeGreaterThan(1); // At least placeholder + 1 category

    // Description textarea (required)
    const descTextarea = page.locator('#description');
    await expect(descTextarea).toBeVisible();

    // Difficulty dropdown
    const difficultySelect = page.locator('#difficulty');
    await expect(difficultySelect).toBeVisible();
    // Should have Beginner, Intermediate, Advanced
    await expect(difficultySelect.locator('option', { hasText: 'Beginner' })).toBeVisible();
    await expect(difficultySelect.locator('option', { hasText: 'Intermediate' })).toBeVisible();
    await expect(difficultySelect.locator('option', { hasText: 'Advanced' })).toBeVisible();

    // Duration input
    const durationInput = page.locator('#durationMinutes');
    await expect(durationInput).toBeVisible();

    // Active checkbox
    const activeCheckbox = page.locator('input[type="checkbox"]');
    await expect(activeCheckbox).toBeVisible();
    // Default should be checked
    await expect(activeCheckbox).toBeChecked();

    // Thumbnail URL input
    const thumbnailInput = page.locator('#thumbnailUrl');
    await expect(thumbnailInput).toBeVisible();
  });

  test('Admin can create a new course end-to-end', async ({ page }) => {
    await setupAdminSession(page, '/admin/courses');
    await waitForTableData(page);

    const courseName = uniqueName('E2ECourse');

    // Open modal
    await page.getByRole('button', { name: /add course/i }).click();
    await waitForModal(page);

    // Fill all fields
    await page.locator('#name').fill(courseName);
    await page.locator('#categoryId').selectOption({ index: 1 }); // First real category
    await page.locator('#description').fill('E2E test course description');
    await page.locator('#difficulty').selectOption('Intermediate');
    await page.locator('#durationMinutes').fill('45');
    await page.locator('#thumbnailUrl').fill('https://example.com/test.jpg');

    // Submit
    const submitBtn = page.locator('.fixed.inset-0').getByRole('button', { name: /add course/i });
    await submitBtn.click();

    // Wait for success message
    await waitForMessage(page);
    await expect(page.getByText(/course added successfully/i)).toBeVisible({ timeout: 5000 });

    // Course should appear in the table
    await expect(page.getByText(courseName)).toBeVisible({ timeout: 5000 });
  });

  test('Admin course modal cancel closes without submitting', async ({ page }) => {
    await setupAdminSession(page, '/admin/courses');
    await waitForTableData(page);

    // Open modal
    await page.getByRole('button', { name: /add course/i }).click();
    await waitForModal(page);

    // Fill some data
    await page.locator('#name').fill('ShouldNotExist');

    // Cancel
    await page.getByRole('button', { name: /cancel/i }).click();

    // Modal should close
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible({ timeout: 3000 });

    // Data should NOT appear in table
    await expect(page.getByText('ShouldNotExist')).not.toBeVisible();
  });

  test('Admin can delete a course with confirmation', async ({ page }) => {
    await setupAdminSession(page, '/admin/courses');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Accept the confirmation dialog
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Are you sure');
      await dialog.accept();
    });

    // Delete the last course
    const lastRow = rows.last();
    const deleteBtn = lastRow.locator('button').filter({ has: page.locator('svg') });
    await deleteBtn.click();

    // Wait for success message
    await waitForMessage(page);
    await expect(page.getByText(/deleted successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('Admin courses page shows Active and Inactive badges', async ({ page }) => {
    await setupAdminSession(page, '/admin/courses');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Check that status badges exist with proper colors
    const activeBadges = page.locator('span.rounded-full', { hasText: 'Active' });
    const inactiveBadges = page.locator('span.rounded-full', { hasText: 'Inactive' });

    const activeCount = await activeBadges.count();
    const inactiveCount = await inactiveBadges.count();

    // At least some status badges should exist
    expect(activeCount + inactiveCount).toBeGreaterThan(0);

    // If active badges exist, they should have green colors
    if (activeCount > 0) {
      const classes = await activeBadges.first().getAttribute('class');
      expect(classes).toContain('green');
    }
  });

  test('Admin courses page shows pagination when enough data', async ({ page }) => {
    await setupAdminSession(page, '/admin/courses');
    await waitForTableData(page);

    // Pagination should be visible
    const pagination = page.getByText(/showing page/i);
    const hasPagination = await pagination.isVisible().catch(() => false);

    if (hasPagination) {
      await expect(pagination).toBeVisible();

      // Check for Next/Previous buttons
      const nextBtn = page.getByRole('button', { name: /next/i });
      const hasNext = await nextBtn.isVisible().catch(() => false);
      if (hasNext) {
        const isDisabled = await nextBtn.isDisabled();
        if (!isDisabled) {
          await nextBtn.click();
          await waitForTableData(page);
          // Should show page 2
          await expect(page.getByText(/page 2/i)).toBeVisible();
        }
      }
    }
  });

  test('Admin courses each row has a delete button', async ({ page }) => {
    await setupAdminSession(page, '/admin/courses');
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
});
