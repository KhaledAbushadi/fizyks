import { expect, test } from '@playwright/test';
import { answerFromStem, onboardWithDrafts, passToCompute, trackExternal, typeNumber } from './helpers';

test.describe('ورشة المسألة (المرحلة 6)', () => {
  test('4 إجابات خاطئة: التلميحات 1 ثم 2 ثم 3، ثم الحل، ثم مسألة توأم إلزامية بأرقام مختلفة', async ({ page }) => {
    const external = trackExternal(page);
    await onboardWithDrafts(page);
    await page.evaluate(() => (location.hash = '/practice/ch01.closed-circuit-current?seed=4242&mode=full'));
    await passToCompute(page);
    const original = await page.getByTestId('problem-stem').innerText();

    await page.locator('[data-unit="A"]').click();
    for (let k = 1; k <= 4; k++) {
      await typeNumber(page, 999);
      await page.getByTestId('compute-submit').click();
      if (k < 4) {
        await expect(page.getByTestId(`hint-${k}`)).toBeVisible();
        await expect(page.getByTestId(`hint-${k + 1}`)).toHaveCount(0);
        await expect(page.getByTestId('revealed')).toHaveCount(0);
      }
    }
    await expect(page.getByTestId('revealed')).toBeVisible();
    await expect(page.getByTestId('solution')).toBeVisible();
    // لا يوجد أي زر يتخطى المسألة التوأم
    await expect(page.getByRole('button', { name: /تخط|تجاوز|skip|اعرض الحل/i })).toHaveCount(0);
    await page.getByTestId('after-reveal').click();
    await expect(page.getByTestId('twin-banner')).toBeVisible();
    const twin = await page.getByTestId('problem-stem').innerText();
    expect(twin).not.toEqual(original);
    await expect(page.getByRole('button', { name: /تخط|تجاوز|skip/i })).toHaveCount(0);
    expect(external).toEqual([]);
  });

  test('اختيار بديل M-IGNORE-INTERNAL-R يعرض شرح ذلك المفهوم', async ({ page }) => {
    await onboardWithDrafts(page);
    await page.evaluate(() => (location.hash = '/practice/ch01.closed-circuit-current?seed=77&mode=exam'));
    await page.locator('button.choice[data-misconception="M-IGNORE-INTERNAL-R"]').click();
    await expect(page.getByTestId('misconception')).toContainText('تجاهل المقاومة الداخلية');
    await expect(page.getByTestId('hint-1')).toBeVisible();
  });

  test('نفس الشرح يظهر لما الطالب يكتب الرقم بنفسه (emf ÷ R)', async ({ page }) => {
    await onboardWithDrafts(page);
    await page.evaluate(() => (location.hash = '/practice/ch01.closed-circuit-current?seed=4242&mode=full'));
    await page.locator('button.choice[data-correct="1"]').first().click();
    await expect(page.getByText('صنّف: أنهي قانون')).toBeVisible();
    await page.locator('button.choice[data-correct="1"]').first().click();
    await expect(page.getByTestId('inventory-stem')).toBeVisible();
    const vals = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-testid=inventory-stem] [data-var]')].map((e) => [e.getAttribute('data-var'), Number(e.getAttribute('data-value'))])));
    const slots = await page.locator('[data-slot-var]').all();
    for (const s of slots) {
      await s.click();
      await page.locator(`[data-testid=inventory-stem] [data-var="${await s.getAttribute('data-slot-var')}"]`).click();
    }
    await page.getByTestId('inventory-confirm').click();
    await page.getByTestId('inventory-next').click();
    await typeNumber(page, Number((vals.emf / vals.R).toPrecision(3)));
    await page.locator('[data-unit="A"]').click();
    await page.getByTestId('compute-submit').click();
    await expect(page.getByTestId('misconception')).toContainText('تجاهل المقاومة الداخلية');
  });

  test('زر "اسأل مساعد مجاني": مخفي قبل التلميح 2، وبعده ينسخ نصاً فيه المسألة بأرقامها، بلا أي طلب شبكة', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const external = trackExternal(page);
    const requests: string[] = [];
    await onboardWithDrafts(page);
    await page.evaluate(() => (location.hash = '/practice/ch01.closed-circuit-current?seed=909&mode=full'));
    await passToCompute(page);
    await page.locator('[data-unit="A"]').click();
    await typeNumber(page, 999);
    await page.getByTestId('compute-submit').click();
    await expect(page.getByTestId('hint-1')).toBeVisible();
    await expect(page.getByTestId('free-tutor-btn')).toHaveCount(0);
    await typeNumber(page, 998);
    await page.getByTestId('compute-submit').click();
    await expect(page.getByTestId('free-tutor-btn')).toBeVisible();

    const vals = await page.evaluate(() => [...document.querySelectorAll('[data-testid=problem-stem] [data-var]')].map((e) => e.getAttribute('data-value')));
    page.on('request', (r) => requests.push(r.url()));
    await page.getByTestId('free-tutor-btn').click();
    await expect(page.getByTestId('free-tutor-copied')).toBeVisible();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('لا تعطني الحل');
    for (const v of vals) expect(text).toContain(String(v));
    expect(text).toContain('أنا جاوبت: 998');
    expect(requests).toEqual([]);
    expect(external).toEqual([]);
  });

  test('حل صحيح من أول مرة: الخطوات الخمس ثم "فكّيتها"', async ({ page }) => {
    await onboardWithDrafts(page);
    await page.evaluate(() => (location.hash = '/practice/ch01.closed-circuit-current?seed=31337&mode=full'));
    await passToCompute(page);
    const ans = await answerFromStem(page, 'ch01.closed-circuit-current');
    await typeNumber(page, ans);
    await page.locator('[data-unit="A"]').click();
    await page.getByTestId('compute-submit').click();
    await page.locator('button.choice[data-correct="1"]').first().click();
    await expect(page.getByTestId('workshop-done')).toContainText('من أول مرة');
  });
});
