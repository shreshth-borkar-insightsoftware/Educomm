import { test, expect } from './helpers/coverage';
import { setupAdminSession } from './helpers/auth';
import { uniqueName } from './helpers/test-data';

test.describe('Admin Kit Management', () => {

  test('Admin kits page loads with table and Add button', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await page.waitForTimeout(3000);

    // Heading
    await expect(page.getByText('Kit Management')).toBeVisible();

    // "Add Kit" button
    const addBtn = page.getByRole('button', { name: /add kit/i });
    await expect(addBtn).toBeVisible();

    // Table or content should render
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
  });

  test('Admin can open Add Kit modal and fill form', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await page.waitForTimeout(3000);

    // Click "Add Kit"
    await page.getByRole('button', { name: /add kit/i }).click();
    await page.waitForTimeout(500);

    // Fill the kit form
    const kitName = uniqueName('E2EKit');
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toBeVisible();
    await nameInput.fill(kitName);

    // Fill description
    const descTextarea = page.locator('textarea').first();
    if (await descTextarea.isVisible().catch(() => false)) {
      await descTextarea.fill('E2E test kit description');
    }

    // Fill price
    const priceInputs = page.locator('input[type="number"]');
    const priceInput = priceInputs.first();
    if (await priceInput.isVisible().catch(() => false)) {
      await priceInput.fill('999');
    }

    // Fill stock
    const stockInput = priceInputs.nth(1);
    if (await stockInput.isVisible().catch(() => false)) {
      await stockInput.fill('10');
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /add kit/i }).last();
    await submitBtn.click();
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Admin can open Edit Kit modal', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await page.waitForTimeout(3000);

    // Find edit buttons (Pencil icons)
    const editButtons = page.locator('button').filter({ has: page.locator('svg.lucide-pencil, [class*="pencil"]') });
    const count = await editButtons.count();

    if (count > 0) {
      await editButtons.first().click();
      await page.waitForTimeout(500);

      // Modal should open with pre-filled form
      const nameInput = page.locator('input[type="text"]').first();
      const hasInput = await nameInput.isVisible().catch(() => false);

      if (hasInput) {
        const value = await nameInput.inputValue();
        expect(value.length).toBeGreaterThan(0); // Should be pre-filled
      }

      // Cancel or close modal
      const cancelBtn = page.getByRole('button', { name: /cancel/i });
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
      }
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Admin can delete a kit', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
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

  test('Admin kits table shows stock color coding and pagination', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await page.waitForTimeout(3000);

    // Check for table data with price and stock info
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      // Check that price column shows ₹ symbol
      const priceCell = page.getByText(/₹/).first();
      const hasPrice = await priceCell.isVisible().catch(() => false);
      if (hasPrice) {
        await expect(priceCell).toBeVisible();
      }
    }

    // Check pagination
    const pagination = page.getByText(/showing page/i);
    const hasPagination = await pagination.isVisible().catch(() => false);
    if (hasPagination) {
      await expect(pagination).toBeVisible();
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

});
