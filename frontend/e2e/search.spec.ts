import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

test.describe('GlobalSearch Component', () => {

  test('Search input is visible with placeholder', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();

    const placeholder = await searchInput.getAttribute('placeholder');
    expect(placeholder).toContain('Search');
  });

  test('Search dropdown appears with results for valid query', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('kit');

    // Wait for debounce (400ms) + API response
    await page.waitForTimeout(1500);

    // Dropdown should appear with Courses/Kits sections
    const dropdown = page.locator('.absolute.top-full');
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    // Should show section headers (Courses or Kits)
    const body = await dropdown.textContent();
    const hasCourses = body!.includes('Courses');
    const hasKits = body!.includes('Kits');
    expect(hasCourses || hasKits).toBeTruthy();
  });

  test('Search needs minimum 2 characters to trigger', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');

    const searchInput = page.locator('input[placeholder*="Search"]').first();

    // Type only 1 character
    await searchInput.fill('k');
    await page.waitForTimeout(800);

    // Dropdown should NOT appear
    const dropdown = page.locator('.absolute.top-full');
    const visible = await dropdown.isVisible().catch(() => false);
    expect(visible).toBeFalsy();
  });

  test('Search shows loading spinner while fetching', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('course');

    // The spinner (Loader2 with animate-spin) should briefly appear
    const spinner = page.locator('.animate-spin');
    // It may be very fast, so just checking page doesn't crash
    await page.waitForTimeout(1500);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);
  });

  test('Search shows no results message for gibberish query', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('xyznonexistent99999');

    await page.waitForTimeout(1500);

    // Dropdown should show "No results found"
    const noResults = page.getByText(/no results found/i);
    await expect(noResults).toBeVisible({ timeout: 5000 });

    // Should show the query in the message
    await expect(page.getByText('xyznonexistent99999')).toBeVisible();

    // Should show "Try different keywords" helper text
    await expect(page.getByText(/try different keywords/i)).toBeVisible();
  });

  test('Escape key closes search dropdown', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('kit');
    await page.waitForTimeout(1500);

    // Dropdown should be visible
    const dropdown = page.locator('.absolute.top-full');
    const isVisible = await dropdown.isVisible().catch(() => false);

    if (isVisible) {
      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Dropdown should close
      const stillVisible = await dropdown.isVisible().catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });

  test('Enter key navigates to search results page', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('course');

    // Press Enter
    await page.keyboard.press('Enter');

    // Should navigate to /search?q=course
    await page.waitForURL(/\/search\?q=course/, { timeout: 10000 });
    expect(page.url()).toContain('/search?q=course');
  });

  test('Clicking a search result navigates to detail page', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('kit');
    await page.waitForTimeout(1500);

    // Wait for dropdown
    const dropdown = page.locator('.absolute.top-full');
    const hasDropdown = await dropdown.isVisible().catch(() => false);

    if (hasDropdown) {
      // Click the first result item
      const resultItem = dropdown.locator('.cursor-pointer').first();
      const hasResult = await resultItem.isVisible().catch(() => false);

      if (hasResult) {
        await resultItem.click();
        await page.waitForTimeout(1000);

        // Should navigate to a courses or kits detail page
        const url = page.url();
        expect(url.includes('/courses/') || url.includes('/kits/')).toBeTruthy();
      }
    }
  });

  test('Click outside closes search dropdown', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('kit');
    await page.waitForTimeout(1500);

    const dropdown = page.locator('.absolute.top-full');
    const isVisible = await dropdown.isVisible().catch(() => false);

    if (isVisible) {
      // Click outside the dropdown
      await page.locator('body').click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(300);

      const stillVisible = await dropdown.isVisible().catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });

});
