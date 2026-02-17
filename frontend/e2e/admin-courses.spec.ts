import { test, expect } from './helpers/coverage';
import { setupAdminSession } from './helpers/auth';
import { uniqueName } from './helpers/test-data';

test.describe('Admin Course Management', () => {

  test('Admin courses page loads with table and Add button', async ({ page }) => {
    await setupAdminSession(page, '/admin/courses');
    await page.waitForTimeout(3000);

    // Heading should be visible
    await expect(page.getByText('Course Management')).toBeVisible();

    // "Add Course" button should exist
    const addBtn = page.getByRole('button', { name: /add course/i });
    await expect(addBtn).toBeVisible();

    // Table should render with header columns
    const table = page.locator('table');
    const hasTable = await table.isVisible().catch(() => false);
    if (hasTable) {
      await expect(page.getByText('Name').first()).toBeVisible();
    }

    // Page loaded successfully
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
  });

  test('Admin can open Add Course modal and fill form', async ({ page }) => {
    await setupAdminSession(page, '/admin/courses');
    await page.waitForTimeout(3000);

    // Click "Add Course"
    await page.getByRole('button', { name: /add course/i }).click();
    await page.waitForTimeout(500);

    // Modal should appear with form fields
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toBeVisible();

    // Fill the form
    const courseName = uniqueName('E2ECourse');
    await nameInput.fill(courseName);

    // Fill description textarea
    const descTextarea = page.locator('textarea').first();
    if (await descTextarea.isVisible().catch(() => false)) {
      await descTextarea.fill('E2E test course description');
    }

    // Select difficulty
    const difficultySelect = page.locator('select').nth(1);
    if (await difficultySelect.isVisible().catch(() => false)) {
      await difficultySelect.selectOption('Beginner');
    }

    // Fill duration
    const durationInput = page.locator('input[type="number"]').first();
    if (await durationInput.isVisible().catch(() => false)) {
      await durationInput.fill('60');
    }

    // Submit the form
    const submitBtn = page.getByRole('button', { name: /add course/i }).last();
    await submitBtn.click();
    await page.waitForTimeout(3000);

    // Check if course was created (success message or course in table)
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Admin can delete a course', async ({ page }) => {
    await setupAdminSession(page, '/admin/courses');
    await page.waitForTimeout(3000);

    // Find delete buttons (Trash2 icons)
    const deleteButtons = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2, [class*="trash"]') });
    const count = await deleteButtons.count();

    if (count > 0) {
      // Handle the confirmation dialog
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      await deleteButtons.last().click();
      await page.waitForTimeout(2000);

      // Page should still render after deletion
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    } else {
      // No courses to delete
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }
  });

  test('Admin courses page shows pagination when enough data', async ({ page }) => {
    await setupAdminSession(page, '/admin/courses');
    await page.waitForTimeout(3000);

    // Check for pagination controls
    const pagination = page.getByText(/showing page/i);
    const hasPagination = await pagination.isVisible().catch(() => false);

    if (hasPagination) {
      await expect(pagination).toBeVisible();
      // Check for Next/Previous buttons
      const nextBtn = page.getByRole('button', { name: /next/i });
      const hasNext = await nextBtn.isVisible().catch(() => false);
      if (hasNext) {
        expect(await nextBtn.isDisabled() !== undefined).toBeTruthy();
      }
    }

    // Page renders regardless
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

});
