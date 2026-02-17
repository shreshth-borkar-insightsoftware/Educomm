import { Page } from '@playwright/test';

const API_BASE = 'https://localhost:50135/api';

// Test credentials — these are real accounts in the database
export const TEST_CUSTOMER = {
  email: 'shreshth@1',
  password: 'shreshth1',
};

export const TEST_ADMIN = {
  email: 'shreshth@10',
  password: 'shreshth@10',
};

/**
 * Login via the UI by filling the login form.
 */
export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

/**
 * Login as customer via UI and wait for navigation.
 */
export async function loginAsCustomer(page: Page) {
  await loginViaUI(page, TEST_CUSTOMER.email, TEST_CUSTOMER.password);
  // Customer role is not "Admin", so redirects to /dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

/**
 * Login as admin via UI and wait for navigation.
 */
export async function loginAsAdmin(page: Page) {
  await loginViaUI(page, TEST_ADMIN.email, TEST_ADMIN.password);
  // Admin role is "Admin", so redirects to /admin
  await page.waitForURL('**/admin', { timeout: 15000 });
}

/**
 * Login via API and inject token into localStorage (faster than UI login).
 * Use this for tests where login isn't the thing being tested.
 * Includes retry logic for transient database connection errors.
 */
export async function loginViaAPI(page: Page, email: string, password: string) {
  const context = page.context();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await context.request.post(`${API_BASE}/auth/Login`, {
      data: { email, password },
      ignoreHTTPSErrors: true,
      timeout: 30000,
    });

    if (response.ok()) {
      const data = await response.json();
      const token = typeof data === 'string' ? data : (data.token || data.jwtToken);
      const user = data.user || data;

      await context.addInitScript(({ token, user }) => {
        window.localStorage.setItem('token', token);
        window.localStorage.setItem('user', JSON.stringify(user));
      }, { token, user });
      return;
    }

    lastError = new Error(`Login API failed (attempt ${attempt}): ${response.status()} ${await response.text()}`);
    if (attempt < 3) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  throw lastError;
}

/**
 * Fast login as customer via API, then navigate to a page.
 */
export async function setupCustomerSession(page: Page, navigateTo = '/dashboard') {
  await loginViaAPI(page, TEST_CUSTOMER.email, TEST_CUSTOMER.password);
  await page.goto(navigateTo);
  await page.waitForLoadState('networkidle');
}

/**
 * Fast login as admin via API, then navigate to a page.
 */
export async function setupAdminSession(page: Page, navigateTo = '/admin') {
  await loginViaAPI(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto(navigateTo);
  await page.waitForLoadState('networkidle');
}
