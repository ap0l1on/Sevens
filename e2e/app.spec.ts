import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('scenario 1: Deniz sees 33/45 on track and P01 plan', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByText('33/45').first()).toBeVisible();
  await expect(page.getByText('Diploma on track').first()).toBeVisible();
  // Offer 36 is prefilled by example; plan should list raises.
  await expect(page.getByText('Raise 3 grades to meet it:').first()).toBeVisible();
});

test('scenario 2: grade 1 shows red not on track naming subject', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try an example' }).click();
  // Set last subject to 1 via keyboard: focus last row grade 1.
  const rows = page.locator('.subj-row');
  const last = rows.nth(5);
  await last.getByRole('radio', { name: '1' }).click();
  await expect(page.getByText('Diploma not on track').first()).toBeVisible();
  await expect(page.getByText(/A 1 in .* means no diploma/).first()).toBeVisible();
});

test('share link round trip', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByText('33/45').first()).toBeVisible();
  const url = page.url();
  expect(url).toContain('s=');
  const page2 = await context.newPage();
  await page2.goto(url);
  await expect(page2.getByText('33/45').first()).toBeVisible();
});

test('hostile link opens clean page with note', async ({ page }) => {
  await page.goto('/?s=<script>alert(1)</script>');
  await expect(page.getByText('This link was damaged').first()).toBeVisible();
});

test('axe zero violations', async ({ page }) => {
  for (const state of ['empty', 'example']) {
    await page.goto('/');
    if (state === 'example') {
      await page.getByRole('button', { name: 'Try an example' }).click();
      await expect(page.getByText('33/45').first()).toBeVisible();
    }
    const res = await new AxeBuilder({ page }).analyze();
    expect(res.violations).toEqual([]);
  }
});
