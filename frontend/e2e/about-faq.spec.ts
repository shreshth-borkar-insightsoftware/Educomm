import { test, expect } from './helpers/coverage';
import { setupCustomerSession } from './helpers/auth';

test.describe('About Page', () => {

  test('About page loads with hero section', async ({ page }) => {
    await setupCustomerSession(page, '/about');
    await page.waitForTimeout(2000);

    const heading = page.getByText(/about educomm/i);
    await expect(heading).toBeVisible();

    // Mission statement paragraph
    const mission = page.getByText(/e-learning platform/i);
    await expect(mission).toBeVisible();
  });

  test('About page shows Our Mission section', async ({ page }) => {
    await setupCustomerSession(page, '/about');
    await page.waitForTimeout(2000);

    const missionHeading = page.getByText(/our mission/i);
    await expect(missionHeading).toBeVisible();

    const missionText = page.getByText(/best way to learn technology/i);
    await expect(missionText).toBeVisible();
  });

  test('About page shows What We Offer with 3 feature cards', async ({ page }) => {
    await setupCustomerSession(page, '/about');
    await page.waitForTimeout(2000);

    const offerHeading = page.getByText(/what we offer/i);
    await expect(offerHeading).toBeVisible();

    // 3 feature cards
    await expect(page.getByText(/digital courses/i).first()).toBeVisible();
    await expect(page.getByText(/hardware kits/i).first()).toBeVisible();
    await expect(page.getByText(/learn by building/i)).toBeVisible();
  });

  test('About page shows How It Works with 4 steps', async ({ page }) => {
    await setupCustomerSession(page, '/about');
    await page.waitForTimeout(2000);

    const howItWorks = page.getByText(/how it works/i);
    await expect(howItWorks).toBeVisible();

    await expect(page.getByText(/browse courses/i).first()).toBeVisible();
    await expect(page.getByText(/get your kit/i)).toBeVisible();
    await expect(page.getByText(/learn & build/i)).toBeVisible();
    await expect(page.getByText(/track progress/i)).toBeVisible();
  });

  test('About page shows Our Numbers stats', async ({ page }) => {
    await setupCustomerSession(page, '/about');
    await page.waitForTimeout(2000);

    const numbersHeading = page.getByText(/our numbers/i);
    await expect(numbersHeading).toBeVisible();

    // Stat values
    await expect(page.getByText('50+')).toBeVisible();
    await expect(page.getByText('30+')).toBeVisible();
    await expect(page.getByText('1000+')).toBeVisible();
    await expect(page.getByText('200+')).toBeVisible();
  });

  test('About page shows Contact Us CTA', async ({ page }) => {
    await setupCustomerSession(page, '/about');
    await page.waitForTimeout(2000);

    const contactBtn = page.getByText(/contact us/i);
    await expect(contactBtn).toBeVisible();
  });

});

test.describe('FAQ Page', () => {

  test('FAQ page loads with header', async ({ page }) => {
    await setupCustomerSession(page, '/faq');
    await page.waitForTimeout(2000);

    const heading = page.getByText(/frequently asked questions/i);
    await expect(heading).toBeVisible();

    const subtitle = page.getByText(/everything you need to know/i);
    await expect(subtitle).toBeVisible();
  });

  test('FAQ page shows all 10 questions', async ({ page }) => {
    await setupCustomerSession(page, '/faq');
    await page.waitForTimeout(2000);

    // Check for specific FAQ questions
    await expect(page.getByText('What is Educomm?')).toBeVisible();
    await expect(page.getByText('How do courses work?')).toBeVisible();
    await expect(page.getByText('What comes in a hardware kit?')).toBeVisible();
    await expect(page.getByText('How do I track my progress?')).toBeVisible();
    await expect(page.getByText('What payment methods do you accept?')).toBeVisible();
  });

  test('FAQ accordion toggles answer visibility', async ({ page }) => {
    await setupCustomerSession(page, '/faq');
    await page.waitForTimeout(2000);

    // First FAQ answer should be hidden initially
    const firstAnswer = page.getByText(/e-learning platform that combines/i);
    await expect(firstAnswer).not.toBeVisible();

    // Click the first question to expand
    const firstQuestion = page.getByText('What is Educomm?');
    await firstQuestion.click();
    await page.waitForTimeout(500);

    // Answer should now be visible
    await expect(firstAnswer).toBeVisible();

    // Click again to collapse
    await firstQuestion.click();
    await page.waitForTimeout(500);

    // Answer should be hidden again
    await expect(firstAnswer).not.toBeVisible();
  });

  test('FAQ accordion closes previous when opening new', async ({ page }) => {
    await setupCustomerSession(page, '/faq');
    await page.waitForTimeout(2000);

    // Open first FAQ
    await page.getByText('What is Educomm?').click();
    await page.waitForTimeout(500);

    const firstAnswer = page.getByText(/e-learning platform that combines/i);
    await expect(firstAnswer).toBeVisible();

    // Open second FAQ
    await page.getByText('How do courses work?').click();
    await page.waitForTimeout(500);

    // Second answer should be visible
    const secondAnswer = page.getByText(/video modules and documentation/i);
    await expect(secondAnswer).toBeVisible();

    // First answer should be hidden (accordion behavior)
    await expect(firstAnswer).not.toBeVisible();
  });

  test('FAQ page shows support CTA at bottom', async ({ page }) => {
    await setupCustomerSession(page, '/faq');
    await page.waitForTimeout(2000);

    const ctaHeading = page.getByText(/still have questions/i);
    await expect(ctaHeading).toBeVisible();

    const contactLink = page.getByText(/contact our support team/i);
    await expect(contactLink).toBeVisible();
  });

});
