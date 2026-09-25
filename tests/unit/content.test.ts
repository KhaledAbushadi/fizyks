import { describe, expect, it } from 'vitest';
import { runValidation } from '../../scripts/validate-content';

describe('المتحقق من المحتوى (المرحلة 2)', () => {
  it('المحتوى الحقيقي ينجح', () => {
    const { errors, bundle } = runValidation(['content']);
    expect(errors).toEqual([]);
    expect(bundle.templates.get('ch01.closed-circuit-current')).toBeDefined();
  }, 60_000);

  it('يفشل برسالة واضحة: متغير غير معرّف', () => {
    const { errors } = runValidation(['content', 'tests/fixtures/broken-undefined-var']);
    expect(errors.map((e) => e.message).join('\n')).toContain('متغير غير معرّف {tt}');
  }, 60_000);

  it('يفشل برسالة واضحة: مفهوم خاطئ غير موجود', () => {
    const { errors } = runValidation(['content', 'tests/fixtures/broken-unknown-misconception']);
    expect(errors.map((e) => e.message).join('\n')).toContain('مفهوم خاطئ غير موجود في القاموس: M-DOES-NOT-EXIST');
  }, 60_000);

  it('يفشل برسالة واضحة: قيود مستحيلة', () => {
    const { errors } = runValidation(['content', 'tests/fixtures/broken-impossible']);
    const text = errors.map((e) => `${e.file} ${e.message}`).join('\n');
    expect(text).toContain('fixture.impossible');
    expect(text).toContain('فشل التوليد بعد 50 محاولة');
  }, 60_000);

  it('مثال كيرشوف من الكتاب: I3 = 0.71 أمبير', async () => {
    const { bundle } = runValidation(['content']);
    const { evalExpr } = await import('../../src/engine/template');
    const t = bundle.templates.get('ch01.kirchhoff-two-loops')!;
    const v = evalExpr(t.answer.expr, { E1: 6, R1: 2, E2: 2, R2: 3, R3: 5 });
    expect(v).toBeCloseTo(0.71, 2);
    const i2 = evalExpr(t.derived!.I2, { E1: 6, R1: 2, E2: 2, R2: 3, R3: 5 });
    expect(i2).toBeCloseTo(-0.516, 3);
  }, 60_000);
});
