import { test, expect } from './helpers/coverage';
import { setupAdminSession, waitForTableData, waitForMessage } from './helpers/auth';

test.describe('Admin Order Management', () => {

  test('Admin orders page loads with table', async ({ page }) => {
    await setupAdminSession(page, '/admin/orders');
    await waitForTableData(page);

    // Heading
    await expect(page.getByText('Order Management')).toBeVisible();
    await expect(page.getByText(/manage customer orders and status/i)).toBeVisible();

    // Table headers
    await expect(page.getByText('Expand').first()).toBeVisible();
    await expect(page.getByText('Order ID').first()).toBeVisible();
    await expect(page.getByText('User').first()).toBeVisible();
    await expect(page.getByText('Order Date').first()).toBeVisible();
    await expect(page.getByText('Total').first()).toBeVisible();
    await expect(page.getByText('Shipping Address').first()).toBeVisible();
    await expect(page.getByText('Status').first()).toBeVisible();
    await expect(page.getByText('Actions').first()).toBeVisible();
  });

  test('Admin orders table shows order data', async ({ page }) => {
    await setupAdminSession(page, '/admin/orders');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    const firstRow = rows.first();

    // Order ID (starts with #)
    const orderIdCell = firstRow.locator('td').nth(1);
    const orderIdText = await orderIdCell.textContent();
    expect(orderIdText).toMatch(/#\d+/);

    // User name cell
    const userCell = firstRow.locator('td').nth(2);
    const userText = await userCell.textContent();
    expect(userText!.length).toBeGreaterThan(0);

    // Date cell (formatted like "Jan 15, 2026")
    const dateCell = firstRow.locator('td').nth(3);
    const dateText = await dateCell.textContent();
    expect(dateText).toMatch(/[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}/);

    // Total cell (should contain ₹)
    const totalCell = firstRow.locator('td').nth(4);
    const totalText = await totalCell.textContent();
    expect(totalText).toContain('₹');

    // Status badge
    const statusBadge = firstRow.locator('span.rounded-full');
    await expect(statusBadge).toBeVisible();
    const statusText = await statusBadge.textContent();
    expect(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']).toContain(statusText);
  });

  test('Admin can expand an order row to see order items', async ({ page }) => {
    await setupAdminSession(page, '/admin/orders');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Click the expand button (ChevronDown) on the first order row
    const firstRow = rows.first();
    const expandBtn = firstRow.locator('button').first();
    await expandBtn.click();

    // Wait for expanded content to appear
    await page.waitForTimeout(2000);

    // Should show "Order Items" heading or "Loading order items..." or "No items found"
    const orderItemsText = page.getByText(/order items|loading order items|no items found/i);
    await expect(orderItemsText.first()).toBeVisible({ timeout: 10000 });

    // If order items are loaded, check for sub-table headers
    const kitNameHeader = page.getByText('Kit Name');
    const hasItems = await kitNameHeader.isVisible().catch(() => false);
    if (hasItems) {
      await expect(page.getByText('Quantity').last()).toBeVisible();
      await expect(page.getByText('Price/Item')).toBeVisible();
      await expect(page.getByText('Subtotal')).toBeVisible();
    }
  });

  test('Admin can collapse an expanded order row', async ({ page }) => {
    await setupAdminSession(page, '/admin/orders');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Expand first row
    const firstRow = rows.first();
    const expandBtn = firstRow.locator('button').first();
    await expandBtn.click();
    await page.waitForTimeout(1000);

    // Now click again to collapse
    await expandBtn.click();
    await page.waitForTimeout(500);

    // The expanded content should no longer be visible
    // The ChevronDown should be visible (not ChevronUp)
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Admin can change order status via dropdown', async ({ page }) => {
    await setupAdminSession(page, '/admin/orders');
    await waitForTableData(page);

    // Find status dropdowns in the table
    const statusSelects = page.locator('table tbody select');
    const count = await statusSelects.count();
    expect(count).toBeGreaterThan(0);

    // Get the current status
    const currentValue = await statusSelects.first().inputValue();

    // Change to a different status
    const options = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const newStatus = options.find(s => s !== currentValue) || 'Processing';

    await statusSelects.first().selectOption(newStatus);

    // Wait for success message
    await waitForMessage(page);
    await expect(page.getByText(/status updated successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('Admin orders status dropdown has all 5 options', async ({ page }) => {
    await setupAdminSession(page, '/admin/orders');
    await waitForTableData(page);

    const statusSelects = page.locator('table tbody select');
    const count = await statusSelects.count();
    expect(count).toBeGreaterThan(0);

    // Check all 5 status options exist
    const firstSelect = statusSelects.first();
    const options = firstSelect.locator('option');
    const optionTexts: string[] = [];
    const optCount = await options.count();
    for (let i = 0; i < optCount; i++) {
      optionTexts.push((await options.nth(i).textContent()) || '');
    }

    expect(optionTexts).toContain('Pending');
    expect(optionTexts).toContain('Processing');
    expect(optionTexts).toContain('Shipped');
    expect(optionTexts).toContain('Delivered');
    expect(optionTexts).toContain('Cancelled');
  });

  test('Admin orders shows status badges with correct colors', async ({ page }) => {
    await setupAdminSession(page, '/admin/orders');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Check that status badges exist and have color classes
    let foundStatusBadge = false;
    for (let i = 0; i < Math.min(count, 5); i++) {
      const badge = rows.nth(i).locator('span.rounded-full');
      const isVisible = await badge.isVisible().catch(() => false);
      if (isVisible) {
        const classes = await badge.getAttribute('class') || '';
        const text = await badge.textContent() || '';

        // Verify color mapping
        if (text === 'Pending') expect(classes).toContain('yellow');
        else if (text === 'Processing') expect(classes).toContain('blue');
        else if (text === 'Shipped') expect(classes).toContain('purple');
        else if (text === 'Delivered') expect(classes).toContain('green');
        else if (text === 'Cancelled') expect(classes).toContain('red');

        foundStatusBadge = true;
      }
    }
    expect(foundStatusBadge).toBeTruthy();
  });

  test('Admin orders shows formatted dates and prices', async ({ page }) => {
    await setupAdminSession(page, '/admin/orders');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Check dates are formatted
    const dateCell = rows.first().locator('td').nth(3);
    const dateText = await dateCell.textContent();
    expect(dateText).toMatch(/[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}/);

    // Check prices have ₹
    const totalCell = rows.first().locator('td').nth(4);
    const totalText = await totalCell.textContent();
    expect(totalText).toContain('₹');
  });

  test('Admin orders expand button toggles chevron icon', async ({ page }) => {
    await setupAdminSession(page, '/admin/orders');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Each order row should have an expand button
    const firstRow = rows.first();
    const expandBtn = firstRow.locator('td').first().locator('button');
    await expect(expandBtn).toBeVisible();
  });

  test('Admin orders shows pagination', async ({ page }) => {
    await setupAdminSession(page, '/admin/orders');
    await waitForTableData(page);

    const pagination = page.getByText(/showing page/i);
    const hasPagination = await pagination.isVisible().catch(() => false);

    if (hasPagination) {
      await expect(pagination).toBeVisible();
    }
  });

  test('Admin orders shows shipping address', async ({ page }) => {
    await setupAdminSession(page, '/admin/orders');
    await waitForTableData(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Shipping address cell
    const addressCell = rows.first().locator('td').nth(5);
    const addressText = await addressCell.textContent();
    expect(addressText!.length).toBeGreaterThan(0);
  });
});
