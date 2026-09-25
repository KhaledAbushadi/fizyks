import { expect, test } from '@playwright/test';
import { onboardWithDrafts } from './helpers';

test('أول تشغيل ← ترحيب ← تشخيص ← "خطة النهارده" تضع مهارة البادئات أولاً (المرحلة 8)', async ({ page }) => {
  await onboardWithDrafts(page);
  await page.evaluate(() => (location.hash = '/'));
  await expect(page.getByTestId('todo-diagnostic')).toBeVisible();
  await page.getByTestId('todo-diagnostic').click();
  await page.getByTestId('diagnostic-start').click();
  for (let i = 0; i < 15; i++) {
    // أسئلة البادئات هي أول سؤالين: نجاوبها غلط، والباقي صح
    if (i < 2) await page.locator('button.choice[data-correct="0"]').first().click();
    else await page.locator('button.choice[data-correct="1"]').first().click();
  }
  await expect(page.getByTestId('diagnostic-result')).toContainText('13/15');
  await page.getByTestId('diagnostic-home').click();
  const first = page.getByTestId('plan').locator('li').first();
  await expect(first).toContainText('البادئات');
  await expect(page.getByTestId('plan').locator('li')).toHaveCount(1 + 1); // الصالة + الدرس الأول
});

test('في الإنتاج بدون تفعيل المسودات: المحتوى تحت المراجعة ولا يظهر للطالب', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('welcome-start').click();
  await expect(page.getByTestId('diagnostic-pending')).toBeVisible();
  await page.evaluate(() => (location.hash = '/lessons'));
  await expect(page.getByText('الدروس تحت المراجعة')).toBeVisible();
});
