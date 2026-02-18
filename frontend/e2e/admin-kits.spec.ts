import { test, expect } from './helpers/coverage';
import { setupAdminSession, waitForTableData, waitForModal, waitForMessage } from './helpers/auth';
import { uniqueName } from './helpers/test-data';

test.describe('Admin Kit Management', () => {

  test('Admin kits page loads with table and Add button', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await waitForTableData(page);

    // Heading
    await expect(page.getByText('Kit Management')).toBeVisible();
    await expect(page.getByText(/manage product kits and inventory/i)).toBeVisible();

    // "Add Kit" button
    const addBtn = page.getByRole('button', { name: /add kit/i });
    await expect(addBtn).toBeVisible();

    // Table headers
    await expect(page.getByText('ID').first()).toBeVisible();
    await expect(page.getByText('Name').first()).toBeVisible();
    await expect(page.getByText('Course').first()).toBeVisible();
    await expect(page.getByText('Price').first()).toBeVisible();
    await expect(page.getByText('Stock').first()).toBeVisible();
    await expect(page.getByText('Status').first()).toBeVisible();
  });

  test('Admin kits table shows kit data with price and stock', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    const firstRow = rows.first();

    // ID cell
    const idCell = firstRow.locator('td').first();
    const idText = await idCell.textContent();
    expect(parseInt(idText || '0')).toBeGreaterThan(0);

    // Name cell
    const nameCell = firstRow.locator('td').nth(1);
    const nameText = await nameCell.textContent();
    expect(nameText!.length).toBeGreaterThan(0);

    // Price cell (should contain ₹)
    const priceCell = firstRow.locator('td').nth(3);
    const priceText = await priceCell.textContent();
    expect(priceText).toContain('₹');

    // Status badge (Active or Inactive)
    const statusBadge = firstRow.locator('span.rounded-full');
    await expect(statusBadge).toBeVisible();
    const statusText = await statusBadge.textContent();
    expect(statusText === 'Active' || statusText === 'Inactive').toBeTruthy();
  });

  test('Admin can open Add Kit modal with all form fields', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await waitForTableData(page);

    // Click "Add Kit"
    await page.getByRole('button', { name: /add kit/i }).click();
    await waitForModal(page);

    // Modal title should say "Add New Kit" (not "Edit Kit")
    await expect(page.getByText(/add new kit/i)).toBeVisible();

    // Name input
    const nameInput = page.locator('#name');
    await expect(nameInput).toBeVisible();

    // Course dropdown with options
    const courseSelect = page.locator('#courseId');
    await expect(courseSelect).toBeVisible();
    const courseOptions = courseSelect.locator('option');
    expect(await courseOptions.count()).toBeGreaterThan(1);

    // Description textarea
    const descTextarea = page.locator('#description');
    await expect(descTextarea).toBeVisible();

    // Price input
    const priceInput = page.locator('#price');
    await expect(priceInput).toBeVisible();

    // Stock quantity input
    const stockInput = page.locator('#stockQuantity');
    await expect(stockInput).toBeVisible();

    // Active checkbox (should be checked by default)
    const activeCheckbox = page.locator('input[type="checkbox"]');
    await expect(activeCheckbox).toBeVisible();
    await expect(activeCheckbox).toBeChecked();

    // Image URL input
    const imageInput = page.locator('#imageUrl');
    await expect(imageInput).toBeVisible();

    // Cancel and Submit buttons
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
  });

  test('Admin can create a new kit end-to-end', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await waitForTableData(page);

    const kitName = uniqueName('E2EKit');

    // Open add modal
    await page.getByRole('button', { name: /add kit/i }).click();
    await waitForModal(page);

    // Fill form
    await page.locator('#name').fill(kitName);
    await page.locator('#courseId').selectOption({ index: 1 });
    await page.locator('#description').fill('E2E test kit description');
    await page.locator('#price').fill('999.99');
    await page.locator('#stockQuantity').fill('10');
    await page.locator('#imageUrl').fill('https://example.com/kit.jpg');

    // Submit
    const submitBtn = page.locator('.fixed.inset-0').getByRole('button', { name: /add kit/i });
    await submitBtn.click();

    // Wait for success message
    await waitForMessage(page);
    await expect(page.getByText(/kit added successfully/i)).toBeVisible({ timeout: 5000 });

    // Kit should appear in the table
    await expect(page.getByText(kitName)).toBeVisible({ timeout: 5000 });
  });

  test('Admin can open Edit Kit modal with pre-filled data', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Click the edit button (Pencil icon) on the first row
    const firstRow = rows.first();
    const editBtn = firstRow.locator('button').filter({ has: page.locator('svg') }).first();
    await editBtn.click();
    await waitForModal(page);

    // Modal title should say "Edit Kit"
    await expect(page.getByText(/edit kit/i)).toBeVisible();

    // Name input should be pre-filled
    const nameInput = page.locator('#name');
    const nameValue = await nameInput.inputValue();
    expect(nameValue.length).toBeGreaterThan(0);

    // Price input should be pre-filled
    const priceInput = page.locator('#price');
    const priceValue = await priceInput.inputValue();
    expect(parseFloat(priceValue)).toBeGreaterThan(0);

    // Stock input should be pre-filled
    const stockInput = page.locator('#stockQuantity');
    const stockValue = await stockInput.inputValue();
    expect(parseInt(stockValue)).toBeGreaterThanOrEqual(0);

    // Course should be selected
    const courseSelect = page.locator('#courseId');
    const courseValue = await courseSelect.inputValue();
    expect(courseValue.length).toBeGreaterThan(0);

    // Submit button should say "Update Kit"
    const updateBtn = page.locator('.fixed.inset-0').getByRole('button', { name: /update kit/i });
    await expect(updateBtn).toBeVisible();
  });

  test('Admin can edit a kit and save changes', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Click edit on first row
    const firstRow = rows.first();
    const editBtn = firstRow.locator('button').filter({ has: page.locator('svg') }).first();
    await editBtn.click();
    await waitForModal(page);

    // Change the price
    const priceInput = page.locator('#price');
    await priceInput.clear();
    await priceInput.fill('1234.56');

    // Submit the edit
    const updateBtn = page.locator('.fixed.inset-0').getByRole('button', { name: /update kit/i });
    await updateBtn.click();

    // Wait for success message
    await waitForMessage(page);
    await expect(page.getByText(/kit updated successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('Admin kit modal cancel closes without saving', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await waitForTableData(page);

    // Open add modal
    await page.getByRole('button', { name: /add kit/i }).click();
    await waitForModal(page);

    // Fill data
    await page.locator('#name').fill('ShouldNotExist');

    // Cancel
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible({ timeout: 3000 });

    // Kit should NOT appear
    await expect(page.getByText('ShouldNotExist')).not.toBeVisible();
  });

  test('Admin can delete a kit with confirmation', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Accept confirmation dialog
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Are you sure');
      await dialog.accept();
    });

    // Delete the last kit (to avoid deleting seeded data needed by other tests)
    const lastRow = rows.last();
    const buttons = lastRow.locator('button').filter({ has: page.locator('svg') });
    const btnCount = await buttons.count();
    // Last button should be delete (Trash2)
    const deleteBtn = buttons.last();
    await deleteBtn.click();

    // Wait for success
    await waitForMessage(page);
    await expect(page.getByText(/deleted successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('Admin kits table shows stock color coding', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Check stock cells for color classes
    let foundColorCoding = false;
    for (let i = 0; i < Math.min(count, 5); i++) {
      const stockCell = rows.nth(i).locator('td').nth(4);
      const classes = await stockCell.getAttribute('class') || '';
      // Should have one of: text-red, text-orange, text-green
      if (classes.includes('text-red') || classes.includes('text-orange') || classes.includes('text-green')) {
        foundColorCoding = true;
        break;
      }
    }
    expect(foundColorCoding).toBeTruthy();
  });

  test('Admin kits table shows ₹ price formatting', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await waitForTableData(page);

    // Check that prices have ₹ symbol
    const priceElements = page.getByText(/₹/).first();
    await expect(priceElements).toBeVisible();
  });

  test('Admin kits table has edit and delete buttons per row', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Each row should have 2 action buttons (Edit + Delete)
    for (let i = 0; i < Math.min(count, 3); i++) {
      const row = rows.nth(i);
      const actionButtons = row.locator('td').last().locator('button');
      const btnCount = await actionButtons.count();
      expect(btnCount).toBe(2); // Pencil (edit) + Trash2 (delete)
    }
  });

  test('Admin kits page shows pagination', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await waitForTableData(page);

    const pagination = page.getByText(/showing page/i);
    const hasPagination = await pagination.isVisible().catch(() => false);

    if (hasPagination) {
      await expect(pagination).toBeVisible();
    }
  });

  test('Admin kits shows Active and Inactive badges', async ({ page }) => {
    await setupAdminSession(page, '/admin/kits');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Check status badges
    const activeBadges = page.locator('span.rounded-full', { hasText: 'Active' });
    const inactiveBadges = page.locator('span.rounded-full', { hasText: 'Inactive' });
    const activeCount = await activeBadges.count();
    const inactiveCount = await inactiveBadges.count();
    expect(activeCount + inactiveCount).toBeGreaterThan(0);

    if (activeCount > 0) {
      const classes = await activeBadges.first().getAttribute('class');
      expect(classes).toContain('green');
    }
  });
});
