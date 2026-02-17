import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NYC_OUTPUT = path.join(__dirname, '..', '..', '.nyc_output');

// Ensure output directory exists
if (!fs.existsSync(NYC_OUTPUT)) {
  fs.mkdirSync(NYC_OUTPUT, { recursive: true });
}

/**
 * Extended test fixture that automatically collects Istanbul coverage
 * from the browser's window.__coverage__ after each test.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await use(page);

    // After the test, collect coverage from the page
    try {
      const coverage = await page.evaluate(() => {
        return (window as any).__coverage__ || null;
      });

      if (coverage) {
        const id = crypto.randomUUID();
        const filePath = path.join(NYC_OUTPUT, `coverage-${id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(coverage));
      }
    } catch {
      // Page may have been closed or navigated away — ignore
    }
  },
});

export { expect };
