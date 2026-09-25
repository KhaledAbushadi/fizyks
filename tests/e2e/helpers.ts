import { expect, type Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { evalExpr } from '../../src/engine/template';
import { roundSig } from '../../src/engine/numbers';
import type { ProblemTemplate } from '../../src/content/schemas';

/** كل الطلبات لغير نطاق التطبيق نفسه (يجب أن تبقى صفراً) */
export function trackExternal(page: Page): string[] {
  const external: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol.startsWith('http')) external.push(r.url());
  });
  return external;
}

/** أول تشغيل: ترحيب ← الرئيسية ← تفعيل المسودات بلمس الشعار 5 مرات */
export async function onboardWithDrafts(page: Page) {
  await page.goto('/');
  await page.getByTestId('welcome-start').click();
  await expect(page).toHaveURL(/#\/diagnostic/);
  await page.evaluate(() => (location.hash = '/'));
  for (let i = 0; i < 5; i++) await page.getByTestId('logo').click();
  await expect(page.getByTestId('drafts-on')).toBeVisible();
}

const templates = new Map<string, ProblemTemplate>();
function loadTemplates() {
  if (templates.size) return;
  const dirs = ['content/ch01/problems', 'content/math-gym'];
  for (const d of dirs) {
    for (const f of readdirSync(d)) {
      const data = JSON.parse(readFileSync(join(d, f), 'utf8'));
      const list: ProblemTemplate[] = Array.isArray(data) ? data : data.templates ?? [];
      for (const t of list) templates.set(t.id, t);
    }
  }
}

export function template(id: string): ProblemTemplate {
  loadTemplates();
  return templates.get(id)!;
}

/** يحسب الإجابة الصحيحة من الأرقام الظاهرة في نص المسألة */
export async function answerFromStem(page: Page, id: string): Promise<number> {
  const t = template(id);
  // انتظر ظهور كل متغيرات القالب في نص المسألة قبل القراءة
  const names = Object.keys(t.variables);
  await expect
    .poll(() => page.evaluate((ns) => ns.every((n) => document.querySelector(`[data-testid=problem-stem] [data-var="${n}"]`)), names))
    .toBe(true);
  const scope: Record<string, number> = await page.evaluate(() =>
    Object.fromEntries([...document.querySelectorAll('[data-testid=problem-stem] [data-var][data-value]')].map((e) => [e.getAttribute('data-var')!, Number(e.getAttribute('data-value'))])),
  );
  scope.qe = 1.6e-19;
  for (const [k, expr] of Object.entries(t.derived ?? {})) if (!(k in scope)) scope[k] = evalExpr(expr, scope);
  return roundSig(evalExpr(t.answer.expr, scope), t.answer.sigFigs);
}

export async function typeNumber(page: Page, value: number | string) {
  const s = typeof value === 'number' ? String(value) : value;
  for (const ch of s) {
    if (ch === '-') await page.locator('[data-key="neg"]').click();
    else await page.locator(`[data-key="${ch}"]`).click();
  }
}

/** يمرّ بخطوات ارسم/صنّف/اجرد صح */
export async function passToCompute(page: Page) {
  await page.locator('button.choice[data-correct="1"]').first().click();
  await expect(page.getByText('صنّف: أنهي قانون')).toBeVisible();
  await page.locator('button.choice[data-correct="1"]').first().click();
  await expect(page.getByTestId('inventory-stem')).toBeVisible();
  const slots = await page.locator('[data-slot-var]').all();
  for (const s of slots) {
    const v = await s.getAttribute('data-slot-var');
    await s.click();
    await page.locator(`[data-testid=inventory-stem] [data-var="${v}"]`).click();
  }
  await page.getByTestId('inventory-confirm').click();
  await page.getByTestId('inventory-next').click();
  await expect(page.getByTestId('compute-submit')).toBeVisible();
}
