import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('core picks light up and read +3', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await page.locator('.result-card').getByText('33/45').waitFor();
  const tokB = page.getByRole('radio', { name: 'TOK grade B' });
  const eeA = page.getByRole('radio', { name: 'Extended Essay grade A' });
  await eeA.click();
  await expect(tokB).toHaveAttribute('aria-checked', 'true');
  await expect(eeA).toHaveAttribute('aria-checked', 'true');
  await expect(tokB).toHaveCSS('background-color', 'rgb(199, 234, 124)');
  await expect(eeA).toHaveCSS('background-color', 'rgb(199, 234, 124)');
  await expect(page.locator('.result-card').getByText('+3')).toBeVisible();
  // Deselect clears the highlight again.
  await tokB.click();
  await expect(tokB).toHaveAttribute('aria-checked', 'false');
});

test('scenario 1: Deniz sees 33/45 on track and P01 plan', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.locator('.result-card').getByText('33/45')).toBeVisible();
  await expect(page.locator('.result-card').getByText('Diploma on track')).toBeVisible();
  // Offer 36 is prefilled by example; the plan lives on more.html now.
  await page.getByRole('link', { name: 'More: offers and FAQ' }).first().click();
  await expect(page).toHaveURL(/more\.html/);
  await expect(page.getByText('Raise 3 grades to meet it:').first()).toBeVisible();
});

test('scenario 2: grade 1 shows red not on track naming subject', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try an example' }).click();
  // Set last subject to 1 via keyboard: focus last row grade 1.
  const rows = page.locator('.subj-card');
  const last = rows.nth(5);
  await last.getByRole('radio', { name: '1' }).click();
  await expect(page.locator('.result-card').getByText('Diploma not on track')).toBeVisible();
  await expect(page.getByText(/A 1 in .* means no diploma/).first()).toBeVisible();
});

test('share link round trip', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.locator('.result-card').getByText('33/45')).toBeVisible();
  // Wait for the 300ms-debounced hash sync of the EXAMPLE (names appear
  // in the hash; the empty state syncs first, so bare /s=/ would race).
  await expect(page).toHaveURL(/Chemistry/);
  const url = page.url();
  expect(url).toContain('s=');
  const page2 = await context.newPage();
  await page2.goto(url);
  await expect(page2.locator('.result-card').getByText('33/45')).toBeVisible();
});

test('hostile link opens clean page with note', async ({ page }) => {
  await page.goto('#s=<script>alert(1)</script>');
  await expect(page.getByText('This link was damaged').first()).toBeVisible();
});

test('axe zero violations', async ({ page }) => {
  for (const state of ['empty', 'example']) {
    await page.goto('/');
    if (state === 'example') {
      await page.getByRole('button', { name: 'Try an example' }).click();
      await expect(page.locator('.result-card').getByText('33/45')).toBeVisible();
    }
    const res = await new AxeBuilder({ page }).analyze();
    expect(res.violations).toEqual([]);
  }
});
