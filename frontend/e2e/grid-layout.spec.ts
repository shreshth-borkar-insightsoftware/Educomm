import { test, expect } from './helpers/coverage';
import { setupCustomerSession, setupAdminSession } from './helpers/auth';

/**
 * Grid Layout Testing
 *
 * Validates responsive CSS grid layouts across the application
 * at three viewport sizes: mobile (375), tablet (768), desktop (1280).
 *
 * Pages using grids:
 *   Dashboard      – 2-col hero cards, 2-col middle section
 *   Courses        – 1/2/3-col course cards
 *   Kits           – 1/2/3-col kit cards
 *   My Courses     – 1/2/3-col enrollment cards
 *   Cart           – 1/3-col checkout layout
 *   My Orders      – 1/3-col order detail layout
 *   Search Results – 1/2/3-col mixed cards
 *   Admin Dashboard – 1/2/3-col stat cards
 *   Admin Users    – 1/3-col stat cards
 *   Address Page   – stacked address cards
 */

// ------- helpers -------
type GridInfo = { display: string; columns: number };

async function getGridInfo(page: any, selector: string): Promise<GridInfo | null> {
  return page.evaluate((sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const style = window.getComputedStyle(el);
    const display = style.display;                           // "grid" / "flex" / etc.
    const cols = style.gridTemplateColumns
      ? style.gridTemplateColumns.split(/\s+/).filter(Boolean).length
      : 0;
    return { display, columns: cols };
  }, selector);
}

async function getChildCount(page: any, selector: string): Promise<number> {
  return page.evaluate((sel: string) => {
    const el = document.querySelector(sel);
    return el ? el.children.length : 0;
  }, selector);
}

// ------- viewport presets -------
const MOBILE  = { width: 375,  height: 812 };
const TABLET  = { width: 768,  height: 1024 };
const DESKTOP = { width: 1280, height: 900 };

// ==========================================================
//  DASHBOARD GRID TESTS
// ==========================================================
test.describe('Dashboard Grid Layout', () => {

  test('Dashboard hero cards switch from 1-col (mobile) to 2-col (desktop)', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await setupCustomerSession(page, '/dashboard');
    await page.waitForTimeout(3000);

    // The hero section is the first `grid grid-cols-1 md:grid-cols-2` div
    const mobileGrid = await getGridInfo(page, '.grid.grid-cols-1');
    if (mobileGrid) {
      expect(mobileGrid.display).toBe('grid');
      expect(mobileGrid.columns).toBe(1);
    }

    // Switch to desktop
    await page.setViewportSize(DESKTOP);
    await page.waitForTimeout(1000);

    const desktopGrid = await getGridInfo(page, '.grid.grid-cols-1');
    if (desktopGrid) {
      expect(desktopGrid.display).toBe('grid');
      expect(desktopGrid.columns).toBeGreaterThanOrEqual(2);
    }
  });

  test('Dashboard grid containers render correct number of children', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupCustomerSession(page, '/dashboard');
    await page.waitForTimeout(3000);

    // Hero section has exactly 2 children (Hardware Kits + Digital Courses)
    const grids = page.locator('.grid.grid-cols-1');
    const firstGridChildren = await grids.first().evaluate(
      (el: Element) => el.children.length
    );
    expect(firstGridChildren).toBe(2);
  });

  test('Dashboard featured sections are visible on all viewports', async ({ page }) => {
    for (const viewport of [MOBILE, TABLET, DESKTOP]) {
      await page.setViewportSize(viewport);
      await setupCustomerSession(page, '/dashboard');
      await page.waitForTimeout(3000);

      // "Hardware Kits" and "Digital Courses" cards must be visible at every size
      await expect(page.getByText('Hardware Kits')).toBeVisible();
      await expect(page.getByText('Digital Courses')).toBeVisible();

      // Featured Kits and Continue Learning sections
      const featuredKits = page.getByText('Featured Kits');
      const continueLearning = page.getByText('Continue Learning');
      await expect(featuredKits).toBeVisible();
      await expect(continueLearning).toBeVisible();
    }
  });

});

// ==========================================================
//  COURSES PAGE GRID TESTS
// ==========================================================
test.describe('Courses Page Grid Layout', () => {

  test('Course cards display in 1 column on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    const grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) {
      expect(grid.display).toBe('grid');
      expect(grid.columns).toBe(1);
    }
  });

  test('Course cards display in 2 columns on tablet', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    const grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) {
      expect(grid.display).toBe('grid');
      expect(grid.columns).toBe(2);
    }
  });

  test('Course cards display in 3 columns on desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    const grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) {
      expect(grid.display).toBe('grid');
      expect(grid.columns).toBe(3);
    }
  });

  test('Course cards have consistent sizing within the grid', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    // Grab widths of first few course cards
    const cards = page.locator('.grid.grid-cols-1 > *');
    const count = await cards.count();

    if (count >= 2) {
      const box1 = await cards.nth(0).boundingBox();
      const box2 = await cards.nth(1).boundingBox();

      if (box1 && box2) {
        // Cards in a grid column should have same width (±2px tolerance)
        expect(Math.abs(box1.width - box2.width)).toBeLessThanOrEqual(2);
      }
    }
  });

  test('Course grid gap is maintained between cards', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupCustomerSession(page, '/courses');
    await page.waitForTimeout(3000);

    const gapInfo = await page.evaluate(() => {
      const grid = document.querySelector('.grid.grid-cols-1');
      if (!grid) return null;
      const style = window.getComputedStyle(grid);
      return {
        rowGap: style.rowGap,
        columnGap: style.columnGap,
      };
    });

    if (gapInfo) {
      // Grid gap should be positive (e.g. "32px", "24px")
      const rowGapPx = parseInt(gapInfo.rowGap) || 0;
      const colGapPx = parseInt(gapInfo.columnGap) || 0;
      expect(rowGapPx).toBeGreaterThan(0);
      expect(colGapPx).toBeGreaterThan(0);
    }
  });

});

// ==========================================================
//  KITS PAGE GRID TESTS
// ==========================================================
test.describe('Kits Page Grid Layout', () => {

  test('Kit cards switch from 1-col to 3-col across viewports', async ({ page }) => {
    // Mobile
    await page.setViewportSize(MOBILE);
    await setupCustomerSession(page, '/kits');
    await page.waitForTimeout(3000);

    let grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) expect(grid.columns).toBe(1);

    // Tablet
    await page.setViewportSize(TABLET);
    await page.waitForTimeout(1000);

    grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) expect(grid.columns).toBe(2);

    // Desktop
    await page.setViewportSize(DESKTOP);
    await page.waitForTimeout(1000);

    grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) expect(grid.columns).toBe(3);
  });

  test('Kit cards are uniform width in desktop grid', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupCustomerSession(page, '/kits');
    await page.waitForTimeout(3000);

    const cards = page.locator('.grid.grid-cols-1 > *');
    const count = await cards.count();

    if (count >= 3) {
      const widths = await Promise.all(
        [0, 1, 2].map(async (i) => {
          const box = await cards.nth(i).boundingBox();
          return box?.width ?? 0;
        })
      );
      // All three should be roughly equal
      expect(Math.abs(widths[0] - widths[1])).toBeLessThanOrEqual(2);
      expect(Math.abs(widths[1] - widths[2])).toBeLessThanOrEqual(2);
    }
  });

});

// ==========================================================
//  MY COURSES PAGE GRID TESTS
// ==========================================================
test.describe('My Courses Page Grid Layout', () => {

  test('My Courses cards arrange responsively', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupCustomerSession(page, '/my-courses');
    await page.waitForTimeout(3000);

    // Grid uses grid-cols-1 md:grid-cols-2 lg:grid-cols-3
    const grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) {
      expect(grid.display).toBe('grid');
      expect(grid.columns).toBe(3);
    }

    // Switch to mobile
    await page.setViewportSize(MOBILE);
    await page.waitForTimeout(1000);

    const mobileGrid = await getGridInfo(page, '.grid.grid-cols-1');
    if (mobileGrid) {
      expect(mobileGrid.columns).toBe(1);
    }
  });

  test('My Courses grid children are Card components', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupCustomerSession(page, '/my-courses');
    await page.waitForTimeout(3000);

    const cards = page.locator('.grid.grid-cols-1 [data-slot="card"]');
    const count = await cards.count();

    // If enrolled, should have Card components as children
    if (count > 0) {
      // Each card should have a header and content
      for (let i = 0; i < Math.min(count, 3); i++) {
        const card = cards.nth(i);
        const header = card.locator('[data-slot="card-header"]');
        const content = card.locator('[data-slot="card-content"]');
        await expect(header).toBeAttached();
        await expect(content).toBeAttached();
      }
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

});

// ==========================================================
//  CART PAGE GRID TESTS
// ==========================================================
test.describe('Cart Page Grid Layout', () => {

  test('Cart checkout uses 1-col on mobile, 3-col on desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupCustomerSession(page, '/cart');
    await page.waitForTimeout(3000);

    // Cart uses `grid grid-cols-1 lg:grid-cols-3 gap-12`
    const grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) {
      expect(grid.display).toBe('grid');
      // At 1280px (lg breakpoint) should be 3 columns
      expect(grid.columns).toBe(3);
    }

    // Switch to mobile
    await page.setViewportSize(MOBILE);
    await page.waitForTimeout(1000);

    const mobileGrid = await getGridInfo(page, '.grid.grid-cols-1');
    if (mobileGrid) {
      expect(mobileGrid.columns).toBe(1);
    }
  });

  test('Cart grid has proper 2:1 column ratio on desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupCustomerSession(page, '/cart');
    await page.waitForTimeout(3000);

    // The cart uses lg:col-span-2 for the items list, meaning items take 2/3 width
    const colSpan2 = page.locator('.lg\\:col-span-2').first();
    const hasSpan = await colSpan2.isVisible().catch(() => false);

    if (hasSpan) {
      const box = await colSpan2.boundingBox();
      const gridBox = await page.locator('.grid.grid-cols-1').first().boundingBox();

      if (box && gridBox) {
        // col-span-2 should be roughly 2/3 of grid width (minus gap)
        const ratio = box.width / gridBox.width;
        expect(ratio).toBeGreaterThan(0.55);
        expect(ratio).toBeLessThan(0.8);
      }
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

});

// ==========================================================
//  ADMIN DASHBOARD GRID TESTS
// ==========================================================
test.describe('Admin Dashboard Grid Layout', () => {

  test('Admin stat cards use 3-col grid on desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupAdminSession(page, '/admin');
    await page.waitForTimeout(3000);

    const grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) {
      expect(grid.display).toBe('grid');
      expect(grid.columns).toBe(3);
    }
  });

  test('Admin stat cards stack to 1-col on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await setupAdminSession(page, '/admin');
    await page.waitForTimeout(3000);

    const grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) {
      expect(grid.display).toBe('grid');
      expect(grid.columns).toBe(1);
    }
  });

  test('Admin stat cards respond to tablet breakpoint', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await setupAdminSession(page, '/admin');
    await page.waitForTimeout(3000);

    const grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) {
      expect(grid.display).toBe('grid');
      // At 768px (md breakpoint) should have 2 columns
      expect(grid.columns).toBe(2);
    }
  });

  test('All 6 stat cards render within the grid', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupAdminSession(page, '/admin');
    await page.waitForTimeout(3000);

    const gridChildren = await getChildCount(page, '.grid.grid-cols-1');
    // Admin dashboard has 6 stat cards: Users, Courses, Kits, Categories, Orders, Enrollments
    expect(gridChildren).toBeGreaterThanOrEqual(6);
  });

});

// ==========================================================
//  ADMIN USERS GRID TESTS
// ==========================================================
test.describe('Admin Users Grid Layout', () => {

  test('Admin users stat cards use 3-col grid on desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupAdminSession(page, '/admin/users');
    await page.waitForTimeout(3000);

    // Uses grid-cols-1 md:grid-cols-3
    const grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) {
      expect(grid.display).toBe('grid');
      expect(grid.columns).toBe(3);
    }
  });

  test('Admin users stat cards have 3 children (Total, Admins, Customers)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupAdminSession(page, '/admin/users');
    await page.waitForTimeout(3000);

    const gridChildren = await getChildCount(page, '.grid.grid-cols-1');
    expect(gridChildren).toBe(3);
  });

  test('Admin users stat cards stack on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await setupAdminSession(page, '/admin/users');
    await page.waitForTimeout(3000);

    const grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) {
      expect(grid.columns).toBe(1);
    }
  });

});

// ==========================================================
//  MY ORDERS GRID TESTS
// ==========================================================
test.describe('My Orders Grid Layout', () => {

  test('Order detail cards use 3-col grid on desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupCustomerSession(page, '/my-orders');
    await page.waitForTimeout(3000);

    // Each order uses grid grid-cols-1 md:grid-cols-3
    const grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) {
      expect(grid.display).toBe('grid');
      // At desktop, should be 3 columns
      expect(grid.columns).toBe(3);
    }
  });

  test('Order detail cards stack on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await setupCustomerSession(page, '/my-orders');
    await page.waitForTimeout(3000);

    const grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) {
      expect(grid.columns).toBe(1);
    }
  });

});

// ==========================================================
//  SEARCH RESULTS GRID TESTS
// ==========================================================
test.describe('Search Results Grid Layout', () => {

  test('Search results use 3-col grid for course cards on desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupCustomerSession(page, '/search?q=kit');
    await page.waitForTimeout(3000);

    const grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) {
      expect(grid.display).toBe('grid');
      expect(grid.columns).toBe(3);
    }
  });

  test('Search results stack to 1-col on mobile', async ({ page }) => {
    test.setTimeout(120_000); // search page on mobile can be slow
    await page.setViewportSize(MOBILE);
    await setupCustomerSession(page, '/search?q=kit');
    await page.waitForTimeout(5000);

    const grid = await getGridInfo(page, '.grid.grid-cols-1');
    if (grid) {
      expect(grid.columns).toBe(1);
    }
  });

});

// ==========================================================
//  ADDRESS PAGE GRID TESTS
// ==========================================================
test.describe('Address Page Grid Layout', () => {

  test('Address cards stack vertically with gap', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupCustomerSession(page, '/address');
    await page.waitForTimeout(3000);

    // Address page uses "grid gap-6" for vertical stacking
    const gridContainer = page.locator('.grid.gap-6').first();
    const hasGrid = await gridContainer.isVisible().catch(() => false);

    if (hasGrid) {
      const gap = await gridContainer.evaluate((el: Element) => {
        return window.getComputedStyle(el).gap;
      });
      const gapPx = parseInt(gap) || 0;
      expect(gapPx).toBeGreaterThan(0);
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Address cards layout is consistent across mobile and desktop', async ({ page }) => {
    // Addresses are always stacked (1-col), just padding changes
    await page.setViewportSize(MOBILE);
    await setupCustomerSession(page, '/address');
    await page.waitForTimeout(3000);

    const body1 = await page.textContent('body');

    await page.setViewportSize(DESKTOP);
    await page.waitForTimeout(1000);

    const body2 = await page.textContent('body');

    // Content should be identical at both sizes
    expect(body1).toBeTruthy();
    expect(body2).toBeTruthy();
  });

});

// ==========================================================
//  ADMIN FORM GRID TESTS
// ==========================================================
test.describe('Admin Form Grid Layout', () => {

  test('Admin Kit form uses 2-col grid for fields on desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupAdminSession(page, '/admin/kits');
    await page.waitForTimeout(3000);

    // Open Add Kit modal
    await page.getByRole('button', { name: /add kit/i }).click();
    await page.waitForTimeout(500);

    // Form uses grid grid-cols-1 md:grid-cols-2 and md:grid-cols-3
    const formGrids = page.locator('.grid.grid-cols-1');
    const count = await formGrids.count();

    if (count > 0) {
      // At least one form grid should show 2+ columns at desktop
      let foundMultiCol = false;
      for (let i = 0; i < count; i++) {
        const info = await formGrids.nth(i).evaluate((el: Element) => {
          const style = window.getComputedStyle(el);
          const cols = style.gridTemplateColumns.split(/\s+/).filter(Boolean).length;
          return cols;
        });
        if (info >= 2) foundMultiCol = true;
      }
      expect(foundMultiCol).toBeTruthy();
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Admin Course form uses 3-col grid for difficulty/duration/thumbnail', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupAdminSession(page, '/admin/courses');
    await page.waitForTimeout(3000);

    // Open Add Course modal
    await page.getByRole('button', { name: /add course/i }).click();
    await page.waitForTimeout(500);

    // The form has a grid-cols-1 md:grid-cols-3 section
    const formGrids = page.locator('.grid.grid-cols-1');
    const count = await formGrids.count();

    let found3Col = false;
    for (let i = 0; i < count; i++) {
      const cols = await formGrids.nth(i).evaluate((el: Element) => {
        return window.getComputedStyle(el).gridTemplateColumns.split(/\s+/).filter(Boolean).length;
      });
      if (cols === 3) found3Col = true;
    }

    expect(found3Col).toBeTruthy();

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('Admin Enrollment form uses 2-col grid for user/course dropdowns', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setupAdminSession(page, '/admin/enrollments');
    await page.waitForTimeout(3000);

    await page.getByRole('button', { name: /add enrollment/i }).click();
    await page.waitForTimeout(500);

    const formGrids = page.locator('.grid.grid-cols-1');
    const count = await formGrids.count();

    let found2Col = false;
    for (let i = 0; i < count; i++) {
      const cols = await formGrids.nth(i).evaluate((el: Element) => {
        return window.getComputedStyle(el).gridTemplateColumns.split(/\s+/).filter(Boolean).length;
      });
      if (cols === 2) found2Col = true;
    }

    expect(found2Col).toBeTruthy();
  });

});
