import { expect, test, type Page } from '@playwright/test';
import { onboardWithDrafts } from './helpers';
import { readFileSync } from 'node:fs';

const ch01Templates = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08'].flatMap((l) =>
  (JSON.parse(readFileSync(`content/ch01/problems/${l}.json`, 'utf8')) as { id: string; lesson: string }[]).map((t) => ({ id: t.id, lesson: t.lesson })),
);

/** يزرع مهارات متقنة لدروس معينة مباشرة في IndexedDB */
async function seedMastered(page: Page, lessons: string[]) {
  const ids = ch01Templates.filter((t) => lessons.includes(t.lesson)).map((t) => t.id);
  await page.evaluate(
    ({ ids, lessons }) =>
      new Promise<void>((resolve) => {
        const req = indexedDB.open('fukkaha');
        req.onsuccess = () => {
          const tx = req.result.transaction(['skills', 'lessonProgress'], 'readwrite');
          for (const id of ids) tx.objectStore('skills').put({ skillId: id, level: 5, streakUnassisted: 3, spacedCorrect: true, masteredAt: Date.now() });
          for (const l of lessons) tx.objectStore('lessonProgress').put({ lessonId: l, stationReached: 8, completedAt: Date.now() });
          tx.oncomplete = () => resolve();
        };
      }),
    { ids, lessons },
  );
  await page.reload();
}

test('الجلسة المختلطة مقفولة قبل إتقان درسين، والرسالة التحذيرية تظهر مرة واحدة (المرحلة 9)', async ({ page }) => {
  await onboardWithDrafts(page);
  await page.evaluate(() => (location.hash = '/mixed'));
  await expect(page.getByTestId('mixed-locked')).toBeVisible();
  await seedMastered(page, ['L01', 'L02']);
  await expect(page.getByTestId('mixed-warning')).toBeVisible();
  await page.getByTestId('mixed-start').click();
  await page.locator('button.choice[data-correct="1"]').first().click();
  await page.evaluate(() => (location.hash = '/'));
  await page.evaluate(() => (location.hash = '/mixed'));
  await expect(page.getByTestId('mixed-start')).toBeVisible();
  await expect(page.getByTestId('mixed-warning')).toHaveCount(0);
});

test('خريطة الدرجات تعرض 8 درجات للفصل 1 عند إتقان كل دروسه', async ({ page }) => {
  await onboardWithDrafts(page);
  await seedMastered(page, ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08']);
  await page.evaluate(() => (location.hash = '/map'));
  await expect(page.getByTestId('secured')).toHaveText('8');
  await expect(page.locator('[data-testid=score-grid] [data-filled="1"]')).toHaveCount(8);
});

test('النسخة الاحتياطية: تصدير ثم استيراد بعد تأكيد', async ({ page }) => {
  await onboardWithDrafts(page);
  await page.evaluate(() => (location.hash = '/more'));
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('backup-export').click()]);
  expect(download.suggestedFilename()).toMatch(/^fukkaha-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await download.path();
  await page.getByTestId('backup-file').setInputFiles(path!);
  await expect(page.getByTestId('import-confirm')).toBeVisible();
  await page.getByTestId('import-yes').click();
  await expect(page.getByTestId('backup-msg')).toContainText('اتستوردت');
  await page.getByTestId('backup-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"app":"fukkaha","schemaVersion":99}') });
  await expect(page.getByTestId('backup-msg')).toContainText('إصدار أحدث');
});
