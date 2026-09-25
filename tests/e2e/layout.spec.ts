import { expect, test } from '@playwright/test';
import { onboardWithDrafts, trackExternal } from './helpers';

const ROUTES = ['/', '/lessons', '/gym', '/gym/gym.prefixes', '/map', '/more', '/review', '/errors', '/mixed', '/lesson/L06', '/practice/ch01.mixed-circuit?mode=full', '/dev/ui', '/dev/content-preview'];

test.describe('العرض على 360px', () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test('لا تمرير أفقي في أي شاشة، وصفر طلبات خارجية', async ({ page }) => {
    const external = trackExternal(page);
    await onboardWithDrafts(page);
    for (const r of ROUTES) {
      await page.evaluate((h) => (location.hash = h), r);
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `تمرير أفقي في ${r}`).toBeLessThanOrEqual(0);
    }
    expect(external).toEqual([]);
  });
});

test('المعادلات من اليسار لليمين داخل الفقرة العربية (المرحلة 5)', async ({ page }) => {
  await onboardWithDrafts(page);
  await page.evaluate(() => (location.hash = '/dev/ui'));
  const math = page.getByTestId('rtl-math').locator('.math').first();
  await expect(math).toHaveAttribute('dir', 'ltr');
  expect(await math.evaluate((e) => getComputedStyle(e).direction)).toBe('ltr');
  // ترتيب الرموز: I قبل = قبل الكسر (من اليسار لليمين)
  const xs = await math.evaluate((e) => {
    const find = (t: string) => [...e.querySelectorAll('.mord, .mrel')].find((n) => n.textContent === t)!.getBoundingClientRect().x;
    return { I: find('I'), eq: find('=') };
  });
  expect(xs.I).toBeLessThan(xs.eq);
  expect(await page.locator('html').getAttribute('dir')).toBe('rtl');
});

test('معاينة المحتوى تعرض كل القوالب بدون أخطاء رسم', async ({ page }) => {
  await onboardWithDrafts(page);
  await page.evaluate(() => (location.hash = '/dev/content-preview'));
  await expect(page.getByTestId('preview-template')).toHaveCount(35);
  expect(await page.locator('.katex-error').count()).toBe(0);
});
