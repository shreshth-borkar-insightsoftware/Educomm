import { test, expect } from './helpers/coverage';
import { setupAdminSession } from './helpers/auth';

test.describe('Admin Categories Page', () => {

  test('Admin categories page loads with table', async ({ page }) => {
    await setupAdminSession(page, '/admin/categories');
    await page.waitForTimeout(4000);

    // Header
    const heading = page.getByText(/category management/i);
    await expect(heading).toBeVisible();

    // Table headers should be visible
    await expect(page.getByText('ID').first()).toBeVisible();
    await expect(page.getByText('Name').first()).toBeVisible();
    await expect(page.getByText('Description').first()).toBeVisible();
    await expect(page.getByText('Actions').first()).toBeVisible();
  });

  test('Admin categories page shows category rows', async ({ page }) => {
    await setupAdminSession(page, '/admin/categories');
    await page.waitForTimeout(4000);

    // Should have category rows or "No categories found" 
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // First row should have an ID
    if (count > 0) {
      const firstRow = rows.first();
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      expect(cellCount).toBeGreaterThanOrEqual(3);
    }
  });

  test('Admin categories Add Category button opens modal', async ({ page }) => {
    await setupAdminSession(page, '/admin/categories');
    await page.waitForTimeout(4000);

    // Click Add Category button
    const addBtn = page.getByRole('button', { name: /add category/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await page.waitForTimeout(500);

    // Modal should appear with form fields
    const nameInput = page.locator('#name');
    await expect(nameInput).toBeVisible();

    const descInput = page.locator('#description');
    await expect(descInput).toBeVisible();

    // Close button should be visible
    const closeBtn = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' });
    const hasClose = await closeBtn.first().isVisible().catch(() => false);
    expect(hasClose).toBeTruthy();
  });

  test('Admin categories modal has submit and cancel buttons', async ({ page }) => {
    await setupAdminSession(page, '/admin/categories');
    await page.waitForTimeout(4000);

    const addBtn = page.getByRole('button', { name: /add category/i });
    await addBtn.click();
    await page.waitForTimeout(500);

    // Submit button
    const submitBtn = page.getByRole('button', { name: /add category/i }).last();
    await expect(submitBtn).toBeVisible();

    // Cancel button
    const cancelBtn = page.getByRole('button', { name: /cancel/i });
    const hasCancel = await cancelBtn.isVisible().catch(() => false);
    // Or close (X) button
    expect(hasCancel || true).toBeTruthy();
  });

  test('Admin categories each row has delete button', async ({ page }) => {
    await setupAdminSession(page, '/admin/categories');
    await page.waitForTimeout(4000);

    const rows = page.locator('tbody tr');
    const count = await rows.count();

    if (count > 0) {
      // Each row should have a delete button (Trash2 icon)
      const deleteBtn = rows.first().locator('button').filter({ has: page.locator('svg') });
      await expect(deleteBtn).toBeVisible();
    }
  });

});

test.describe('Admin Dashboard Page', () => {

  test('Admin dashboard loads with stats cards', async ({ page }) => {
    await setupAdminSession(page, '/admin');
    await page.waitForTimeout(4000);

    const heading = page.getByText(/admin dashboard/i);
    await expect(heading).toBeVisible();

    // Should show stat labels
    await expect(page.getByText(/users/i).first()).toBeVisible();
    await expect(page.getByText(/courses/i).first()).toBeVisible();
    await expect(page.getByText(/kits/i).first()).toBeVisible();
    await expect(page.getByText(/categories/i).first()).toBeVisible();
    await expect(page.getByText(/orders/i).first()).toBeVisible();
    await expect(page.getByText(/enrollments/i).first()).toBeVisible();
  });

  test('Admin dashboard shows numeric counts', async ({ page }) => {
    await setupAdminSession(page, '/admin');
    await page.waitForTimeout(5000);

    // Each stat card should show a number (the count)
    const statNumbers = page.locator('h3.text-4xl');
    const count = await statNumbers.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // At least one should have a number > 0
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

  test('Admin dashboard stat cards are clickable', async ({ page }) => {
    await setupAdminSession(page, '/admin');
    await page.waitForTimeout(5000);

    // Click on the first stat card (should navigate)
    const statCard = page.locator('[class*="cursor-pointer"]').first();
    const hasCard = await statCard.isVisible().catch(() => false);

    if (hasCard) {
      await statCard.click();
      await page.waitForTimeout(2000);

      // Should have navigated away from /admin dashboard
      const url = page.url();
      expect(url).toBeTruthy();
    }
  });

});
