import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('chemistry SL marks give predicted grade 7', async ({ page }) => {
  await page.goto('subject.html');
  await page.getByLabel('Subject', { exact: true }).selectOption('Chemistry');
  await page.getByRole('button', { name: 'SL', exact: true }).click();
  await expect(page.getByText('Paper 1A').first()).toBeVisible();
  await page.getByLabel('Paper 1A mark').fill('24');
  await page.getByLabel('Paper 1B mark').fill('18');
  await page.getByLabel('Paper 2 mark').fill('37');
  await page.getByLabel('Scientific investigation (IA) mark').fill('19');
  await expect(page.getByText('Predicted grade: 7').first()).toBeVisible();
  const res = await new AxeBuilder({ page }).analyze();
  expect(res.violations).toEqual([]);
});

test('invalid and missing marks show messages, custom boundaries apply', async ({ page }) => {
  await page.goto('subject.html');
  await page.getByLabel('Subject', { exact: true }).selectOption('Chemistry');
  await page.getByRole('button', { name: 'SL', exact: true }).click();
  await page.getByLabel('Paper 1A mark').fill('99');
  await expect(page.getByText('Max is 30.').first()).toBeVisible();
  await expect(page.getByText(/Add all your marks/).first()).toBeVisible();
  await page.getByLabel('Paper 1A mark').fill('24');
  await page.getByLabel('Paper 1B mark').fill('18');
  await page.getByLabel('Paper 2 mark').fill('37');
  await page.getByLabel('Scientific investigation (IA) mark').fill('19');
  await expect(page.getByText('Predicted grade: 7').first()).toBeVisible();
  await page.getByText("Have your teacher's grade boundaries?").click();
  await page.getByLabel('Minimum total for grade 7').fill('80');
  await expect(page.getByText('Predicted grade: 6').first()).toBeVisible();
});

test('TITC SL marks give predicted grade 7', async ({ page }) => {
  await page.goto('subject.html');
  await page.getByLabel('Subject', { exact: true }).selectOption('Turkey in the 20th Century');
  await page.getByLabel('Paper 1 mark').fill('18');
  await page.getByLabel('Paper 2 mark').fill('20');
  await page.getByLabel('Research project (IA) mark').fill('20');
  await expect(page.getByText('Predicted grade: 7').first()).toBeVisible();
});

test('use in diploma calculator fills the chemistry slot', async ({ page }) => {
  await page.goto('subject.html#s=chemistry&l=SL&m=24,18,37,19');
  await expect(page.getByText('Predicted grade: 7').first()).toBeVisible();
  const href = await page
    .getByRole('link', { name: 'Use in diploma calculator' })
    .getAttribute('href');
  expect(href).toContain('use=3:7');
  await page.getByRole('link', { name: 'Use in diploma calculator' }).click();
  await expect(page).toHaveURL(/index\.html#use=3:7/);
  await expect(page.locator('.result-card').getByText('so far')).toBeVisible();
});
