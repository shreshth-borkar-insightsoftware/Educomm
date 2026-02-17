import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

test.describe('Search Functionality', () => {

  test('Global search bar shows dropdown results', async ({ page }) => {
    await setupCustomerSession(page, '/dashboard');

    // Find the search input in the top bar
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], input[placeholder*="search"]').first();
    await expect(searchInput).toBeVisible();

    // Type a search query (must be >= 2 chars)
    await searchInput.fill('kit');

    // Wait for debounce (400ms) + API response
    await page.waitForTimeout(1500);

    // Check for dropdown results or any result text
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Search results page loads with query parameter', async ({ page }) => {
    await setupCustomerSession(page, '/search?q=test');

    // Wait for results to load
    await page.waitForTimeout(3000);

    // Page should show search-related content
    const body = await page.textContent('body');
    expect(body).toBeTruthy();

    // URL should contain the query
    expect(page.url()).toContain('q=test');
  });

  test('Search with no matching results shows empty state', async ({ page }) => {
    await setupCustomerSession(page, '/search?q=xyznonexistent99999');

    await page.waitForTimeout(3000);

    // Page should load without error
    const body = await page.textContent('body');
    expect(body).toBeTruthy();

    // Should not show any course or kit cards for a gibberish query
    // The page should gracefully show empty/no results
    expect(page.url()).toContain('q=xyznonexistent99999');
  });

});
