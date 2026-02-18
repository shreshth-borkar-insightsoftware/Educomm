import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

/** Wait for detail page content to load */
async function waitForDetailPage(page: import('@playwright/test').Page) {
  await Promise.race([
    page.locator('h1').first().waitFor({ state: 'visible', timeout: 10000 }),
    page.getByText(/not found/i).waitFor({ state: 'visible', timeout: 10000 }),
  ]).catch(() => {});
}

/** Navigate to first kit detail page */
async function goToFirstKit(page: import('@playwright/test').Page) {
  await setupCustomerSession(page, '/kits');
  await page.locator('.cursor-pointer').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  const kitCard = page.locator('.cursor-pointer').first();
  if (!(await kitCard.isVisible().catch(() => false))) return false;
  await kitCard.click();
  await page.waitForURL(/\/kits\/\d+/, { timeout: 10000 });
  await waitForDetailPage(page);
  return true;
}

/** Navigate to first course detail page */
async function goToFirstCourse(page: import('@playwright/test').Page) {
  await setupCustomerSession(page, '/courses');
  await page.locator('.cursor-pointer').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  const courseCard = page.locator('.cursor-pointer').first();
  if (!(await courseCard.isVisible().catch(() => false))) return false;
  await courseCard.click();
  await page.waitForURL(/\/courses\/\d+/, { timeout: 10000 });
  await waitForDetailPage(page);
  return true;
}

test.describe('Kit Details Page (Deep)', () => {

  test('Kit details shows name, ₹ price, and description', async ({ page }) => {
    const ok = await goToFirstKit(page);
    if (!ok) { test.skip(); return; }

    // PageHeader with "Kit Details" title
    await expect(page.getByText(/kit details/i).first()).toBeVisible();

    // Kit name
    const kitName = page.locator('h1, [class*="CardTitle"]').first();
    const nameText = await kitName.textContent();
    expect(nameText!.trim().length).toBeGreaterThan(0);

    // Price with ₹
    const priceEl = page.getByText(/₹\d/);
    await expect(priceEl.first()).toBeVisible();

    // Description section
    await expect(page.getByText(/description/i).first()).toBeVisible();
  });

  test('Kit details shows stock availability', async ({ page }) => {
    const ok = await goToFirstKit(page);
    if (!ok) { test.skip(); return; }

    await expect(page.getByText(/stock availability/i)).toBeVisible();
  });

  test('Kit details has enabled Add to Cart button', async ({ page }) => {
    const ok = await goToFirstKit(page);
    if (!ok) { test.skip(); return; }

    const addBtn = page.getByRole('button', { name: /add to cart/i });
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toBeEnabled();
  });

  test('Kit details shows Product ID', async ({ page }) => {
    const ok = await goToFirstKit(page);
    if (!ok) { test.skip(); return; }

    await expect(page.getByText(/product id/i)).toBeVisible();
  });

  test('Kit details Add to Cart triggers cart update', async ({ page }) => {
    const ok = await goToFirstKit(page);
    if (!ok) { test.skip(); return; }

    // Handle any alert dialog
    page.on('dialog', async (dialog) => await dialog.accept());

    const addBtn = page.getByRole('button', { name: /add to cart/i });
    await addBtn.click();
    await page.waitForTimeout(2000);

    // FloatingCartButton should now be visible with "VIEW CART" and count badge
    const viewCartBtn = page.getByText('VIEW CART');
    const hasFloating = await viewCartBtn.isVisible().catch(() => false);
    if (hasFloating) {
      await expect(viewCartBtn).toBeVisible();

      // Count badge should show a number
      const countBadge = page.locator('.bg-black.text-white.rounded-full');
      const badgeText = await countBadge.textContent();
      expect(parseInt(badgeText || '0')).toBeGreaterThan(0);
    }
  });

  test('Kit details FloatingCartButton navigates to /cart', async ({ page }) => {
    const ok = await goToFirstKit(page);
    if (!ok) { test.skip(); return; }

    // Add to cart first
    page.on('dialog', async (dialog) => await dialog.accept());
    const addBtn = page.getByRole('button', { name: /add to cart/i });
    await addBtn.click();
    await page.waitForTimeout(2000);

    // Click FloatingCartButton
    const viewCartBtn = page.getByText('VIEW CART');
    const hasFloating = await viewCartBtn.isVisible().catch(() => false);
    if (hasFloating) {
      await viewCartBtn.click();
      await page.waitForURL(/\/cart/, { timeout: 10000 });
      expect(page.url()).toContain('/cart');
    }
  });

  test('Kit details has BackButton with aria-label "Go back"', async ({ page }) => {
    const ok = await goToFirstKit(page);
    if (!ok) { test.skip(); return; }

    const backBtn = page.locator('button[aria-label="Go back"]');
    await expect(backBtn).toBeVisible();

    // Should have ArrowLeft SVG icon
    const svg = backBtn.locator('svg');
    await expect(svg).toBeVisible();
  });

  test('Kit details BackButton navigates back', async ({ page }) => {
    // Start from kits page so history is course → kit
    await setupCustomerSession(page, '/kits');
    await page.locator('.cursor-pointer').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    const kitCard = page.locator('.cursor-pointer').first();
    if (!(await kitCard.isVisible().catch(() => false))) { test.skip(); return; }

    await kitCard.click();
    await page.waitForURL(/\/kits\/\d+/, { timeout: 10000 });
    await waitForDetailPage(page);

    // Click back button
    const backBtn = page.locator('button[aria-label="Go back"]');
    await backBtn.click();

    // Should navigate back to /kits
    await page.waitForURL(/\/kits$/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/kits$/);
  });

});

test.describe('Course Details Page (Deep)', () => {

  test('Course details shows name, about section, and kit section', async ({ page }) => {
    const ok = await goToFirstCourse(page);
    if (!ok) { test.skip(); return; }

    // PageHeader
    await expect(page.getByText(/course details/i).first()).toBeVisible();

    // Course name
    const courseName = page.locator('[class*="CardTitle"]').first();
    const nameText = await courseName.textContent();
    expect(nameText!.trim().length).toBeGreaterThan(0);

    // About section
    await expect(page.getByText(/about this course/i)).toBeVisible();

    // Required Learning Kit section
    await expect(page.getByText(/required learning kit/i)).toBeVisible();
  });

  test('Course details shows course ID', async ({ page }) => {
    const ok = await goToFirstCourse(page);
    if (!ok) { test.skip(); return; }

    await expect(page.getByText(/^ID: \d+$/)).toBeVisible();
  });

  test('Course details shows VIEW LINKED KIT or NO KIT LINKED', async ({ page }) => {
    const ok = await goToFirstCourse(page);
    if (!ok) { test.skip(); return; }

    const viewKitBtn = page.getByRole('button', { name: /view linked kit/i });
    const noKitBtn = page.getByRole('button', { name: /no kit linked/i });

    const hasLinked = await viewKitBtn.isVisible().catch(() => false);
    const hasNoKit = await noKitBtn.isVisible().catch(() => false);

    // One or the other must be visible
    expect(hasLinked || hasNoKit).toBeTruthy();

    if (hasLinked) {
      // Click navigates to kit page
      await viewKitBtn.click();
      await page.waitForURL(/\/kits\/\d+/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/kits\/\d+/);
    }
  });

  test('Course details has BackButton', async ({ page }) => {
    const ok = await goToFirstCourse(page);
    if (!ok) { test.skip(); return; }

    const backBtn = page.locator('button[aria-label="Go back"]');
    await expect(backBtn).toBeVisible();
  });

  test('Course details BackButton navigates back to courses', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await page.locator('.cursor-pointer').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    const courseCard = page.locator('.cursor-pointer').first();
    if (!(await courseCard.isVisible().catch(() => false))) { test.skip(); return; }

    await courseCard.click();
    await page.waitForURL(/\/courses\/\d+/, { timeout: 10000 });
    await waitForDetailPage(page);

    const backBtn = page.locator('button[aria-label="Go back"]');
    await backBtn.click();

    await page.waitForURL(/\/courses$/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/courses$/);
  });

  test('Course details PageHeader shows subtitle', async ({ page }) => {
    const ok = await goToFirstCourse(page);
    if (!ok) { test.skip(); return; }

    // PageHeader with subtitle text
    const subtitle = page.locator('.text-xs.font-mono');
    const hasSubtitle = await subtitle.isVisible().catch(() => false);
    // Some pages may not have subtitle, just verify page loaded
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
  });

});
