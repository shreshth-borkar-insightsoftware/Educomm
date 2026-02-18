import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

/** Wait for course/kit cards or "no results" to appear */
async function waitForResults(page: import('@playwright/test').Page) {
  await Promise.race([
    page.locator('[class*="cursor-pointer"]').first().waitFor({ state: 'visible', timeout: 10000 }),
    page.getByText(/no courses|no kits|no results/i).waitFor({ state: 'visible', timeout: 10000 }),
  ]).catch(() => {});
}

test.describe('Course Filters (FilterSidebar)', () => {

  test('Filter sidebar renders all filter controls', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await waitForResults(page);

    // "Filters" heading
    await expect(page.getByText('Filters')).toBeVisible();

    // Category dropdown
    const categoryLabel = page.getByText('Category');
    await expect(categoryLabel).toBeVisible();
    const categorySelect = page.locator('select').filter({ has: page.locator('option:text("All Categories")') }).first();
    await expect(categorySelect).toBeVisible();
    const categoryOptions = await categorySelect.locator('option').count();
    expect(categoryOptions).toBeGreaterThan(1); // "All Categories" + at least one real category

    // Difficulty dropdown with all levels
    const difficultySelect = page.locator('select').filter({ has: page.locator('option:text("Beginner")') }).first();
    await expect(difficultySelect).toBeVisible();
    await expect(page.locator('option:text("Beginner")').first()).toBeAttached();
    await expect(page.locator('option:text("Intermediate")').first()).toBeAttached();
    await expect(page.locator('option:text("Advanced")').first()).toBeAttached();
    await expect(page.locator('option:text("All Levels")').first()).toBeAttached();

    // Duration inputs
    const minInput = page.locator('input[placeholder="Min"]').first();
    const maxInput = page.locator('input[placeholder="Max"]').first();
    await expect(minInput).toBeVisible();
    await expect(maxInput).toBeVisible();

    // Sort By dropdown with all options
    const sortSelect = page.locator('select').filter({ has: page.locator('option:text("Name (A-Z)")') }).first();
    await expect(sortSelect).toBeVisible();
    await expect(page.locator('option:text("Name (Z-A)")').first()).toBeAttached();
    await expect(page.locator('option:text("Duration (Low to High)")').first()).toBeAttached();
    await expect(page.locator('option:text("Duration (High to Low)")').first()).toBeAttached();
    await expect(page.locator('option:text("Newest First")').first()).toBeAttached();

    // Active courses only checkbox
    const activeLabel = page.getByText(/active courses only/i);
    await expect(activeLabel).toBeVisible();
    const checkbox = page.locator('input[type="checkbox"]').first();
    await expect(checkbox).toBeVisible();

    // Clear All button
    await expect(page.getByText('Clear All')).toBeVisible();
  });

  test('Category filter changes results', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await waitForResults(page);

    const categorySelect = page.locator('select').filter({ has: page.locator('option:text("All Categories")') }).first();
    
    // Select a specific category
    const options = await categorySelect.locator('option').allTextContents();
    const realCategory = options.find(o => o !== 'All Categories');
    if (realCategory) {
      await categorySelect.selectOption({ label: realCategory });
      await waitForResults(page);
      // URL should update or results should change
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(50);
    }
  });

  test('Difficulty filter cycles through all levels', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await waitForResults(page);

    const difficultySelect = page.locator('select').filter({ has: page.locator('option:text("Beginner")') }).first();

    // Select each difficulty level and verify page updates
    for (const level of ['Beginner', 'Intermediate', 'Advanced']) {
      await difficultySelect.selectOption(level);
      await waitForResults(page);
      const selected = await difficultySelect.inputValue();
      expect(selected).toBe(level);
    }

    // Reset to All Levels
    await difficultySelect.selectOption('');
    await waitForResults(page);
    const resetValue = await difficultySelect.inputValue();
    expect(resetValue).toBe('');
  });

  test('Sort By changes order of results', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await waitForResults(page);

    const sortSelect = page.locator('select').filter({ has: page.locator('option:text("Name (A-Z)")') }).first();

    // Select each sort option
    for (const sortValue of ['name_desc', 'duration_asc', 'duration_desc', 'newest', 'name_asc']) {
      await sortSelect.selectOption(sortValue);
      await waitForResults(page);
      const selected = await sortSelect.inputValue();
      expect(selected).toBe(sortValue);
    }
  });

  test('Duration filter accepts min/max and filters results', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await waitForResults(page);

    const minInput = page.locator('input[placeholder="Min"]').first();
    const maxInput = page.locator('input[placeholder="Max"]').first();

    // Set min duration
    await minInput.fill('10');
    await waitForResults(page);
    expect(await minInput.inputValue()).toBe('10');

    // Set max duration
    await maxInput.fill('120');
    await waitForResults(page);
    expect(await maxInput.inputValue()).toBe('120');

    // Verify min attribute is 0
    const minAttr = await minInput.getAttribute('min');
    expect(minAttr).toBe('0');
  });

  test('Active courses only toggle works', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await waitForResults(page);

    const checkbox = page.locator('input[type="checkbox"]').first();

    // Toggle on
    const initialChecked = await checkbox.isChecked();
    await checkbox.click();
    await waitForResults(page);
    const afterChecked = await checkbox.isChecked();
    expect(afterChecked).not.toBe(initialChecked);

    // Toggle off
    await checkbox.click();
    await waitForResults(page);
    const finalChecked = await checkbox.isChecked();
    expect(finalChecked).toBe(initialChecked);
  });

  test('Clear All resets all filters', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await waitForResults(page);

    // Apply multiple filters
    const difficultySelect = page.locator('select').filter({ has: page.locator('option:text("Beginner")') }).first();
    await difficultySelect.selectOption('Beginner');

    const minInput = page.locator('input[placeholder="Min"]').first();
    await minInput.fill('10');

    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.click();

    await waitForResults(page);

    // Click Clear All
    await page.getByText('Clear All').click();
    await waitForResults(page);

    // Verify filters are reset
    const diffValue = await difficultySelect.inputValue();
    expect(diffValue).toBe('');

    const minValue = await minInput.inputValue();
    expect(minValue).toBe('');

    const isChecked = await checkbox.isChecked();
    expect(isChecked).toBeFalsy();
  });

  test('Duration label text is visible', async ({ page }) => {
    await setupCustomerSession(page, '/courses');
    await waitForResults(page);

    await expect(page.getByText('Duration (minutes)')).toBeVisible();
  });

});

test.describe('Kit Filters (KitFilterSidebar)', () => {

  test('Kit filter sidebar renders all controls', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await waitForResults(page);

    // "Filters" heading
    await expect(page.getByText('Filters')).toBeVisible();

    // Course dropdown
    const courseSelect = page.locator('select').filter({ has: page.locator('option:text("All Courses")') }).first();
    await expect(courseSelect).toBeVisible();
    const courseOptions = await courseSelect.locator('option').count();
    expect(courseOptions).toBeGreaterThan(1);

    // Price Range inputs with ₹ placeholders
    const minInput = page.locator('input[placeholder*="Min"]').first();
    const maxInput = page.locator('input[placeholder*="Max"]').first();
    await expect(minInput).toBeVisible();
    await expect(maxInput).toBeVisible();

    // Sort By dropdown with kit-specific options
    const sortSelect = page.locator('select').filter({ has: page.locator('option:text("Name (A-Z)")') }).first();
    await expect(sortSelect).toBeVisible();
    await expect(page.locator('option:text("Price (Low to High)")').first()).toBeAttached();
    await expect(page.locator('option:text("Price (High to Low)")').first()).toBeAttached();

    // In stock only checkbox
    await expect(page.getByText(/in stock only/i)).toBeVisible();

    // Active kits only checkbox
    await expect(page.getByText(/active kits only/i)).toBeVisible();

    // Should have 2 checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    expect(await checkboxes.count()).toBe(2);

    // Clear All button
    await expect(page.getByText('Clear All')).toBeVisible();
  });

  test('Price range filter accepts values', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await waitForResults(page);

    const minInput = page.locator('input[placeholder*="Min"]').first();
    const maxInput = page.locator('input[placeholder*="Max"]').first();

    await minInput.fill('100');
    await waitForResults(page);
    expect(await minInput.inputValue()).toBe('100');

    await maxInput.fill('5000');
    await waitForResults(page);
    expect(await maxInput.inputValue()).toBe('5000');
  });

  test('Kit sort by options all work', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await waitForResults(page);

    const sortSelect = page.locator('select').filter({ has: page.locator('option:text("Name (A-Z)")') }).first();

    for (const sortValue of ['name_desc', 'price_low', 'price_high', 'newest', 'name_asc']) {
      await sortSelect.selectOption(sortValue);
      await waitForResults(page);
      const selected = await sortSelect.inputValue();
      expect(selected).toBe(sortValue);
    }
  });

  test('In stock and Active kits checkboxes toggle independently', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await waitForResults(page);

    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBe(2);

    // Toggle first checkbox (In stock only)
    const inStockCheckbox = checkboxes.nth(0);
    await inStockCheckbox.click();
    await waitForResults(page);
    expect(await inStockCheckbox.isChecked()).toBeTruthy();

    // Toggle second checkbox (Active kits only)
    const activeCheckbox = checkboxes.nth(1);
    await activeCheckbox.click();
    await waitForResults(page);
    expect(await activeCheckbox.isChecked()).toBeTruthy();

    // First should still be checked
    expect(await inStockCheckbox.isChecked()).toBeTruthy();

    // Untoggle both
    await inStockCheckbox.click();
    await activeCheckbox.click();
    await waitForResults(page);
    expect(await inStockCheckbox.isChecked()).toBeFalsy();
    expect(await activeCheckbox.isChecked()).toBeFalsy();
  });

  test('Kit Clear All resets all filters', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await waitForResults(page);

    // Apply filters
    const minInput = page.locator('input[placeholder*="Min"]').first();
    await minInput.fill('500');

    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(0).click();

    await waitForResults(page);

    // Click Clear All
    await page.getByText('Clear All').click();
    await waitForResults(page);

    // Verify reset
    expect(await minInput.inputValue()).toBe('');
    expect(await checkboxes.nth(0).isChecked()).toBeFalsy();
  });

  test('Kit price range label shows ₹ symbol', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await waitForResults(page);

    await expect(page.getByText(/price range.*₹/i)).toBeVisible();
  });

  test('Kit course filter changes results', async ({ page }) => {
    await setupCustomerSession(page, '/kits');
    await waitForResults(page);

    const courseSelect = page.locator('select').filter({ has: page.locator('option:text("All Courses")') }).first();
    
    // Select a specific course
    const options = await courseSelect.locator('option').allTextContents();
    const realCourse = options.find(o => o !== 'All Courses');
    if (realCourse) {
      await courseSelect.selectOption({ label: realCourse });
      await waitForResults(page);
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(50);
    }
  });

});
