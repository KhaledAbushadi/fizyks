import { expect, test } from '@playwright/test';
import { answerFromStem, onboardWithDrafts, trackExternal, typeNumber } from './helpers';

async function readSkills(page: import('@playwright/test').Page) {
  return page.evaluate(
    () =>
      new Promise<{ skillId: string; level: number }[]>((resolve) => {
        const req = indexedDB.open('fukkaha');
        req.onsuccess = () => {
          const tx = req.result.transaction('skills', 'readonly');
          const all = tx.objectStore('skills').getAll();
          all.onsuccess = () => resolve(all.result);
        };
      }),
  );
}

test('رحلة درس كاملة (المرحلة 7): قفل "تنبّأ"، المحطات الثماني، وتذكرة الخروج تحدّث المهارات', async ({ page }) => {
  const external = trackExternal(page);
  await onboardWithDrafts(page);
  await page.evaluate(() => (location.hash = '/lesson/L01'));

  await expect(page.getByTestId('station-1')).toBeVisible();
  await page.getByTestId('next').click();

  // المحطة 2: لا يمكن التقدم دون اختيار
  await expect(page.getByTestId('station-2')).toBeVisible();
  await expect(page.getByTestId('next')).toBeDisabled();
  await page.getByTestId('predict-1').click();
  await page.getByTestId('next').click();

  // المحطة 3: المعمل + مقارنة التوقع بالحقيقة
  await expect(page.getByTestId('station-3')).toBeVisible();
  await expect(page.getByTestId('lab')).toBeVisible();
  await page.getByTestId('see-compare').click();
  await expect(page.getByTestId('prediction-compare')).toContainText('توقعت');
  await page.getByTestId('next').click();

  // المحطة 4: الحكاية ← الصورة ← الرمز
  for (let i = 0; i < 3; i++) await page.getByTestId('next').click();
  // المحطة 5: الرموز وصندوق الكتاب
  await expect(page.getByTestId('book-box')).toBeVisible();
  await page.getByTestId('next').click();
  // المحطة 6: مثال محلول خطوة خطوة
  await expect(page.getByTestId('worked-steps').locator('li')).toHaveCount(1);
  for (let i = 0; i < 4; i++) await page.getByTestId('worked-next').click();
  await expect(page.getByTestId('worked-steps').locator('li')).toHaveCount(5);
  await page.getByTestId('next').click();

  // المحطة 7: ناقص خطوة ثم ناقص خطوتين
  await expect(page.getByTestId('station-7')).toBeVisible();
  let ans = await answerFromStem(page, 'ch01.charge-from-current');
  await typeNumber(page, ans);
  await page.locator('[data-unit="C"]').click();
  await page.getByTestId('compute-submit').click();
  await page.getByTestId('workshop-continue').click();
  await expect(page.getByTestId('inventory-stem')).toBeVisible();
  const slots = await page.locator('[data-slot-var]').all();
  for (const s of slots) {
    await s.click();
    await page.locator(`[data-testid=inventory-stem] [data-var="${await s.getAttribute('data-slot-var')}"]`).click();
  }
  await page.getByTestId('inventory-confirm').click();
  await page.getByTestId('inventory-next').click();
  ans = await answerFromStem(page, 'ch01.charge-from-current');
  await typeNumber(page, ans);
  await page.locator('[data-unit="C"]').click();
  await page.getByTestId('compute-submit').click();
  await page.getByTestId('workshop-continue').click();
  await page.getByTestId('next').click();

  // المحطة 8: تذكرة الخروج
  await expect(page.getByTestId('station-8')).toBeVisible();
  await page.locator('button.choice[data-correct="1"]').click();
  await page.getByTestId('next').click();
  await page.locator('button.choice[data-correct="1"]').click();
  await page.getByTestId('next').click();
  await page.locator('button.choice[data-correct="1"]').click();
  await page.getByTestId('workshop-continue').click();
  await expect(page.getByTestId('lesson-done')).toContainText('3 / 3');

  const skills = await readSkills(page);
  expect(skills.find((s) => s.skillId === 'ch01.electrons-count')?.level).toBe(1);
  expect(external).toEqual([]);
});

test('الطالب يرجع لنفس المحطة لو قفل التطبيق وسط الدرس', async ({ page }) => {
  await onboardWithDrafts(page);
  await page.evaluate(() => (location.hash = '/lesson/L03'));
  await page.getByTestId('next').click();
  await page.getByTestId('predict-0').click();
  await page.getByTestId('next').click();
  await expect(page.getByTestId('station-3')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('station-3')).toBeVisible();
});
