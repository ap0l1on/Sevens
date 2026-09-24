import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function workOutSlot(page: Page, slot: number) {
  const card = page.locator(`#slot-card-${slot}`);
  await card.getByRole('button', { name: 'Work out this grade' }).click();
  await expect(page.locator('#subject-h')).toBeFocused();
}

async function fillMarks(page: Page, marks: number[]) {
  const inputs = page.locator('#subject .mark-inputs > input');
  for (let i = 0; i < marks.length; i++) {
    await inputs.nth(i).fill(String(marks[i]));
  }
}

test('in-page calculator gives Chemistry SL grade 7 and fills the slot', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await page.locator('.result-card').getByText('33/45').waitFor();
  // Slot 4 holds Chemistry HL in the example; use SL marks instead.
  await workOutSlot(page, 3);
  await page.locator('#subject').getByRole('button', { name: 'SL', exact: true }).click();
  await fillMarks(page, [24, 18, 37, 19]);
  await expect(page.getByText('Predicted grade: 7').first()).toBeVisible();
  await page.getByRole('button', { name: 'Use this grade' }).click();
  await expect(page.locator('#slot-card-3').getByRole('radio', { name: '7' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  const res = await new AxeBuilder({ page }).analyze();
  expect(res.violations).toEqual([]);
});

test('regression: three uses keep every grade and the total', async ({ page }) => {
  await page.goto('/');
  // Slot 1 <- Chemistry HL: 35/40, 30/35, 75/90, 20/24 -> 7.
  await workOutSlot(page, 0);
  await page.locator('#subject .slot-select').selectOption('Chemistry');
  await fillMarks(page, [35, 30, 75, 20]);
  await expect(page.getByText('Predicted grade: 7').first()).toBeVisible();
  await page.getByRole('button', { name: 'Use this grade' }).click();
  await expect(page).toHaveURL(/H7-Chemistry/);
  // Slot 2 <- Biology HL: 30/40, 25/35, 60/80, 18/24 = 74.39 -> 7.
  await workOutSlot(page, 1);
  await page.locator('#subject .slot-select').selectOption('Biology');
  await fillMarks(page, [30, 25, 60, 18]);
  await page.getByRole('button', { name: 'Use this grade' }).click();
  await expect(page).toHaveURL(/H7-Biology/);
  // Slot 1 still 7, slot 2 is 7.
  await expect(page.locator('#slot-card-0').getByRole('radio', { name: '7' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.locator('#slot-card-1').getByRole('radio', { name: '7' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  // Reload: both persist.
  await page.reload();
  await expect(page.locator('#slot-card-0').getByRole('radio', { name: '7' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.locator('#slot-card-1').getByRole('radio', { name: '7' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  // Third subject: Physics HL in slot 4 (slot defaults to SL, so switch).
  await workOutSlot(page, 3);
  await page.locator('#subject .slot-select').selectOption('Physics');
  await page.locator('#subject').getByRole('button', { name: 'HL', exact: true }).click();
  await fillMarks(page, [40, 20, 90, 24]);
  await page.getByRole('button', { name: 'Use this grade' }).click();
  await expect(page).toHaveURL(/H7-Physics/);
  await expect(page.locator('#slot-card-0').getByRole('radio', { name: '7' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.locator('#slot-card-1').getByRole('radio', { name: '7' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.locator('#slot-card-3').getByRole('radio', { name: '7' })).toBeVisible();
  // 7 + 7 + 7 so far.
  await expect(page.locator('.result-card').getByText('21')).toBeVisible();
});

test('subject.html redirects to the in-page calculator', async ({ page }) => {
  await page.goto('subject.html');
  await expect(page).toHaveURL(/index\.html#subject/);
  await expect(page.getByRole('heading', { name: /Subject grade/ }).first()).toBeVisible();
});

test('more.html shows offer results from the hash', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await page.locator('.result-card').getByText('33/45').waitFor();
  await expect(page).toHaveURL(/Chemistry/);
  const indexUrl = new URL(page.url());
  indexUrl.pathname = indexUrl.pathname.replace(/\/(index\.html)?$/, '/more.html');
  const page2 = await context.newPage();
  await page2.goto(indexUrl.toString());
  await expect(page2.getByText('Raise 3 grades to meet it:').first()).toBeVisible();
  const res = await new AxeBuilder({ page: page2 }).analyze();
  expect(res.violations).toEqual([]);
});
