import { expect, test } from '@playwright/test';
import { onboardWithDrafts } from './helpers';

test('بعد أول تحميل: يعمل التطبيق والدرس والمعمل دون إنترنت (المرحلة 11)', async ({ page, context }) => {
  await onboardWithDrafts(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // انتظر لحد ما الـ Service Worker يتحكم في الصفحة
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15_000 }).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('logo')).toBeVisible();
  await page.evaluate(() => (location.hash = '/lesson/L05'));
  await page.getByTestId('next').click();
  await page.getByTestId('predict-0').click();
  await page.getByTestId('next').click();
  await expect(page.getByTestId('lab')).toBeVisible();
  await context.setOffline(false);
});
