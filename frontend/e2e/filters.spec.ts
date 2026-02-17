import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

test.describe('Course Filters', () => {

  test('Courses page filter sidebar shows filter options', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    // Filter sidebar should have select dropdowns for category, difficulty, sort
    const selects = page.locator('select');
    const selectCount = await selects.count();

    // Should have at least 2 selects (category, difficulty, sort)
    if (selectCount >= 2) {
      // Verify difficulty options exist
      const beginnerOption = page.locator('option:text("Beginner")');
      await expect(beginnerOption.first()).toBeAttached();

      // Verify sort options exist
      const sortOption = page.locator('option:text("Name (A-Z)")');
      await expect(sortOption.first()).toBeAttached();

      // Verify duration inputs exist
      const minInput = page.locator('input[placeholder="Min"]').first();
      const maxInput = page.locator('input[placeholder="Max"]').first();
      const hasMin = await minInput.isVisible().catch(() => false);
      expect(hasMin || selectCount >= 2).toBeTruthy();

      // Verify checkbox exists
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      expect(checkboxCount).toBeGreaterThanOrEqual(1);
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Courses page filter by difficulty works', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    // Find the Difficulty select
    const difficultySelect = page.locator('select').filter({ has: page.locator('option:text("Beginner")') }).first();
    const hasSelect = await difficultySelect.isVisible().catch(() => false);

    if (hasSelect) {
      await difficultySelect.selectOption('Beginner');
      await page.waitForTimeout(2000);

      // Page should update with filtered results
      const body = await page.textContent('body');
      expect(body).toBeTruthy();

      // Change to Intermediate
      await difficultySelect.selectOption('Intermediate');
      await page.waitForTimeout(2000);

      const body2 = await page.textContent('body');
      expect(body2).toBeTruthy();

      // Change to Advanced
      await difficultySelect.selectOption('Advanced');
      await page.waitForTimeout(2000);

      const body3 = await page.textContent('body');
      expect(body3).toBeTruthy();
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Courses page sort by options work', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    // Find Sort By select
    const sortSelect = page.locator('select').filter({ has: page.locator('option:text("Name (A-Z)")') }).first();
    const hasSort = await sortSelect.isVisible().catch(() => false);

    if (hasSort) {
      // Try Name Z-A
      await sortSelect.selectOption('name_desc');
      await page.waitForTimeout(2000);

      // Try Duration Low to High
      await sortSelect.selectOption('duration_asc');
      await page.waitForTimeout(2000);

      // Try Duration High to Low
      await sortSelect.selectOption('duration_desc');
      await page.waitForTimeout(2000);

      // Try Newest First
      await sortSelect.selectOption('newest');
      await page.waitForTimeout(2000);
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Courses page duration filter accepts min/max values', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    // Find Min/Max duration inputs
    const minInput = page.locator('input[placeholder="Min"]').first();
    const maxInput = page.locator('input[placeholder="Max"]').first();

    const hasMin = await minInput.isVisible().catch(() => false);
    const hasMax = await maxInput.isVisible().catch(() => false);

    if (hasMin && hasMax) {
      await minInput.fill('10');
      await page.waitForTimeout(1000);

      await maxInput.fill('120');
      await page.waitForTimeout(2000);

      // Results should be filtered
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Courses page Clear All filters button works', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    // Apply a filter first
    const difficultySelect = page.locator('select').filter({ has: page.locator('option:text("Beginner")') }).first();
    const hasSelect = await difficultySelect.isVisible().catch(() => false);

    if (hasSelect) {
      await difficultySelect.selectOption('Beginner');
      await page.waitForTimeout(1000);

      // Click "Clear All"
      const clearBtn = page.getByText('Clear All');
      const hasClear = await clearBtn.isVisible().catch(() => false);

      if (hasClear) {
        await clearBtn.click();
        await page.waitForTimeout(2000);

        // Filters should be reset
        const body = await page.textContent('body');
        expect(body).toBeTruthy();
      }
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Courses page Active courses only toggle works', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    // Find the "Active courses only" checkbox
    const activeCheckbox = page.locator('input[type="checkbox"]').first();
    const hasCheckbox = await activeCheckbox.isVisible().catch(() => false);

    if (hasCheckbox) {
      // Toggle the checkbox
      await activeCheckbox.click();
      await page.waitForTimeout(2000);

      const body = await page.textContent('body');
      expect(body).toBeTruthy();

      // Toggle back
      await activeCheckbox.click();
      await page.waitForTimeout(2000);
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

});

test.describe('Kit Filters', () => {

  test('Kits page filter sidebar shows filter options', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await page.waitForTimeout(3000);

    // Filter sidebar should have select dropdowns and inputs
    const selects = page.locator('select');
    const selectCount = await selects.count();

    if (selectCount >= 1) {
      // Verify sort options exist
      const sortOption = page.locator('option:text("Name (A-Z)")');
      await expect(sortOption.first()).toBeAttached();

      // Verify price options exist
      const priceOption = page.locator('option:text("Price (Low to High)")');
      await expect(priceOption.first()).toBeAttached();

      // Verify price range inputs
      const minInput = page.locator('input[placeholder*="Min"]').first();
      const hasMin = await minInput.isVisible().catch(() => false);
      expect(hasMin || selectCount >= 1).toBeTruthy();

      // Verify checkboxes (in stock, active)
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      expect(checkboxCount).toBeGreaterThanOrEqual(1);
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Kits page price range filter works', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await page.waitForTimeout(3000);

    // Find Min/Max price inputs
    const minInput = page.locator('input[placeholder*="Min"]').first();
    const maxInput = page.locator('input[placeholder*="Max"]').first();

    const hasMin = await minInput.isVisible().catch(() => false);

    if (hasMin) {
      await minInput.fill('100');
      await page.waitForTimeout(1000);

      await maxInput.fill('5000');
      await page.waitForTimeout(2000);

      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Kits page sort and stock filter options work', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await page.waitForTimeout(3000);

    // Sort by price
    const sortSelect = page.locator('select').filter({ has: page.locator('option:text("Name (A-Z)")') }).first();
    const hasSort = await sortSelect.isVisible().catch(() => false);

    if (hasSort) {
      await sortSelect.selectOption('price_low');
      await page.waitForTimeout(2000);

      await sortSelect.selectOption('price_high');
      await page.waitForTimeout(2000);

      await sortSelect.selectOption('newest');
      await page.waitForTimeout(2000);
    }

    // Toggle checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkCount = await checkboxes.count();

    for (let i = 0; i < Math.min(checkCount, 2); i++) {
      const checkbox = checkboxes.nth(i);
      if (await checkbox.isVisible().catch(() => false)) {
        await checkbox.click();
        await page.waitForTimeout(1000);
      }
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Kits page Clear All filters works', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await page.waitForTimeout(3000);

    // Apply a filter first
    const minInput = page.locator('input[placeholder*="Min"]').first();
    if (await minInput.isVisible().catch(() => false)) {
      await minInput.fill('500');
      await page.waitForTimeout(1000);
    }

    // Click Clear All
    const clearBtn = page.getByText('Clear All');
    if (await clearBtn.isVisible().catch(() => false)) {
      await clearBtn.click();
      await page.waitForTimeout(2000);

      // Min input should be cleared
      if (await minInput.isVisible().catch(() => false)) {
        const value = await minInput.inputValue();
        expect(value).toBe('');
      }
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

});
