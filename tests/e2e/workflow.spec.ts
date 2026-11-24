import { test, expect } from '@playwright/test';

test('citizen recovery workspace persists plan edits, disruption, and accepted schedule', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: /Try disruption recovery/i }).click();
  await expect(page).toHaveURL(/recovery/);

  await page.getByRole('button', { name: /Customize plan/i }).click();
  await page.getByRole('button', { name: /Add activity/i }).click();
  await page.getByLabel('Activity name').fill('Pick up parcel');
  await page.getByRole('button', { name: /Save obligation/i }).click();
  await expect(page.getByText('Pick up parcel').first()).toBeVisible();

  await page.getByRole('button', { name: '+30m' }).click();
  page.on('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: /Reclaim schedule|Accept partial recovery/i }).click();
  await expect(page.getByText('Schedule reclaimed.')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Schedule reclaimed.')).toBeVisible();
  await page.getByRole('button', { name: /Customize plan/i }).click();
  await expect(page.getByText('Pick up parcel').first()).toBeVisible();
});

test('playback preserves speed select focus', async ({ page }) => {
  await page.goto('/recovery');
  await page.getByRole('button', { name: 'Start time playback' }).click();
  await page.getByLabel('Playback speed').focus();
  await page.waitForTimeout(600);
  await expect(page.getByLabel('Playback speed')).toBeFocused();
});
