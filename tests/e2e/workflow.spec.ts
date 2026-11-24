import { test, expect } from '@playwright/test';

test('citizen journey persists through recovery and refresh', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Plan my day' }).click();
  await expect(page).toHaveURL(/my-day/);
  await page.getByRole('button', { name: 'Add obligation' }).click();
  await page.getByLabel('Activity name').fill('Pick up parcel');
  await page.getByRole('button', { name: 'Save obligation' }).click();
  await expect(page.getByText('Pick up parcel').first()).toBeVisible();
  await page.goto('/aftershock');
  await page.getByLabel('Delay (minutes)').fill('30');
  await page.goto('/resync');
  await expect(page.getByRole('heading', { name: 'Find a way forward.' })).toBeVisible();
  page.on('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Accept this plan' }).click();
  await page.goto('/my-day/accepted');
  await expect(page.getByRole('heading', { name: 'Your recovered itinerary.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /recovery/i })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Pick up parcel').first()).toBeVisible();
});
test('playback preserves focus and city lab optimizes', async ({ page }) => {
  await page.goto('/aftershock');
  await page.getByRole('button', { name: 'Start time playback' }).click();
  await page.getByLabel('Playback speed').focus();
  await page.waitForTimeout(600);
  await expect(page.getByLabel('Playback speed')).toBeFocused();
  await page.goto('/city-lab');
  await page.getByRole('button', { name: 'Optimize within budget' }).click();
  await expect(page.getByRole('heading', { name: 'Population access' })).toBeVisible();
});
