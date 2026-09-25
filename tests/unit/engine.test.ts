import { describe, expect, it } from 'vitest';
import { instantiateOrThrow, instantiate, fillPlain, sanityHolds } from '../../src/engine/template';
import { checkAnswer, numbersMatch } from '../../src/engine/answer';
import { parseNumber, roundSig, fmtPlain } from '../../src/engine/numbers';
import { parseQuantity, conversionText } from '../../src/engine/units';
import { mulberry32 } from '../../src/engine/rng';
import { applyOutcome, emptySkill, isMastered, supportFor, DAY } from '../../src/engine/mastery';
import { closedCircuit, closedCircuitFixed, faraday } from '../fixtures/closed-circuit';

describe('قوالب المسائل', () => {
  it('الدائرة المغلقة: emf = 12، R = 5.5، r = 0.5 ← I = 2 أمبير', () => {
    const inst = instantiateOrThrow(closedCircuitFixed, 1);
    expect(inst.answer).toBe(2);
    expect(inst.answerUnit).toBe('A');
    expect(fillPlain('I = {emf} ÷ ({R} + {r}) = {answer} A', inst)).toBe('I = 12 ÷ (5.5 + 0.5) = 2 A');
  });

  it('مثال فاراداي: 200 × 0.05 × 0.3 ÷ 0.03 = 100 فولت', () => {
    const inst = instantiateOrThrow(faraday, 7);
    expect(inst.answer).toBe(100);
  });

  it('نفس البذرة ← نفس الأرقام ونفس ترتيب البدائل', () => {
    const a = instantiateOrThrow(closedCircuit, 424242);
    const b = instantiateOrThrow(closedCircuit, 424242);
    expect(a.vars).toEqual(b.vars);
    expect(a.choices).toEqual(b.choices);
    const c = instantiateOrThrow(closedCircuit, 424243);
    expect(c.signature === a.signature && JSON.stringify(c.choices) === JSON.stringify(a.choices)).toBe(false);
  });

  it('كل نسخة تحقق القيود وفيها 4 بدائل مختلفة، واحد صحيح', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const inst = instantiateOrThrow(closedCircuit, seed);
      const { emf, R, r } = inst.vars;
      expect(emf / (R + r)).toBeGreaterThanOrEqual(0.2);
      expect(emf / (R + r)).toBeLessThanOrEqual(10);
      expect(inst.choices).toHaveLength(4);
      expect(inst.choices.filter((c) => c.correct)).toHaveLength(1);
      expect(new Set(inst.choices.map((c) => c.value)).size).toBe(4);
    }
  });

  it('يكمّل البدائل بخطأ رتبة الأس عند نقصها', () => {
    const inst = instantiateOrThrow(faraday, 3);
    expect(inst.distractors.length).toBeGreaterThanOrEqual(3);
    expect(inst.distractors.some((d) => d.misconception === 'M-POWER-OF-TEN')).toBe(true);
  });

  it('قيود مستحيلة ← null بدل انهيار التطبيق', () => {
    const bad = { ...closedCircuit, id: 'test.bad', constraints: ['emf < 0'] };
    const orig = console.error;
    console.error = () => {};
    expect(instantiate(bad, 1)).toBeNull();
    console.error = orig;
  });

  it('افحص: شرط المنطقية يقبل الإجابة ويرفض بديل تجاهل المقاومة الداخلية', () => {
    const t = { ...closedCircuitFixed, workshop: { diagramChoices: ['a', 'b'], correctDiagram: 'a', lawChoices: ['1', '2', '3'], correctLaw: '1', inventory: [{ symbol: 'x', var: 'emf', unit: 'V' }], unknown: 'I', hiddenGiven: 'h', sanityCheck: 's', sanityExpr: 'x < emf / R' } };
    const inst = instantiateOrThrow(t, 1);
    expect(sanityHolds(t, inst, inst.answer)).toBe(true);
    expect(sanityHolds(t, inst, 12 / 5.5)).toBe(false);
  });
});

describe('التحقق من الإجابة (القسم 5.5)', () => {
  it('الكهروضوئي: 0.81 تُقبل مرجعاً 0.805 أو 0.806، و0.80 تُقبل كذلك', () => {
    expect(numbersMatch(0.81, 0.805)).toBe(true);
    expect(numbersMatch(0.81, 0.806)).toBe(true);
    expect(numbersMatch(0.8, 0.806)).toBe(true);
    expect(numbersMatch(0.8, 0.805)).toBe(true);
    expect(numbersMatch(0.9, 0.806)).toBe(false);
  });

  it('"٢٫٥" تُقرأ 2.5، وكل الصيغ المقبولة', () => {
    expect(parseNumber('٢٫٥')).toBe(2.5);
    expect(parseNumber('0.25')).toBe(0.25);
    expect(parseNumber('.25')).toBe(0.25);
    expect(parseNumber('2.5e-1')).toBe(0.25);
    expect(parseNumber('2.5×10^-1')).toBe(0.25);
    expect(parseNumber('2.5 x 10^-1')).toBe(0.25);
    expect(parseNumber('1.6×10^−19')).toBeCloseTo(1.6e-19, 30);
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('')).toBeNull();
  });

  it('"250 mA" بعد التحويل = 0.25', () => {
    expect(parseQuantity('250 mA')?.value).toBeCloseTo(0.25, 12);
    expect(parseQuantity('250 مللي أمبير')?.value).toBeCloseTo(0.25, 12);
    expect(parseQuantity('٢٥٠ mA')?.base).toBe('A');
    expect(conversionText(250, 'mA')).toBe('250 مللي أمبير = 0.25 أمبير');
  });

  it('رقم صحيح بوحدة خاطئة = خطأ unit، وبادئة صحيحة تُقبل', () => {
    const p = { answer: 0.25, answerUnit: 'A', distractors: [{ value: 250 }] };
    expect(checkAnswer('0.25', 'A', p).kind).toBe('correct');
    expect(checkAnswer('250', 'mA', p).kind).toBe('correct');
    expect(checkAnswer('0.25', 'V', p).kind).toBe('unit');
    expect(checkAnswer('0.25', 'mA', p).kind).toBe('unit');
    expect(checkAnswer('250', 'A', p)).toEqual({ kind: 'distractor', index: 0 });
    expect(checkAnswer('7', 'A', p).kind).toBe('wrong');
    expect(checkAnswer('سبعة', 'A', p).kind).toBe('unreadable');
  });

  it('تنسيق الأرقام', () => {
    expect(roundSig(0.64285, 3)).toBe(0.643);
    expect(fmtPlain(1.25e19, 3)).toBe('1.25×10^19');
    expect(fmtPlain(0.00045)).toBe('4.5×10^-4');
    expect(fmtPlain(2.972)).toBe('2.972');
  });

  it('المولّد ببذرة ثابت', () => {
    const a = mulberry32(5);
    const b = mulberry32(5);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('قواعد الإتقان الأربع', () => {
  const t0 = Date.UTC(2026, 8, 25);
  it('صحيحة نظيفة +1، بمساعدة 0، كشف الحل −1 بحد أدنى 0', () => {
    let s = emptySkill('x');
    s = applyOutcome(s, 'clean', 1, t0);
    expect(s.level).toBe(1);
    s = applyOutcome(s, 'assisted', 2, t0 + 1000);
    expect(s.level).toBe(1);
    s = applyOutcome(s, 'revealed', 3, t0 + 2000);
    expect(s.level).toBe(0);
    s = applyOutcome(s, 'revealed', 4, t0 + 3000);
    expect(s.level).toBe(0);
  });

  it('الإتقان يحتاج مستوى ≥ 4 وإجابتين نظيفتين على نسختين مختلفتين وإجابة بعد يومين', () => {
    let s = emptySkill('x');
    for (let i = 0; i < 5; i++) s = applyOutcome(s, 'clean', 100 + i, t0 + i * 1000);
    expect(s.level).toBe(5);
    expect(isMastered(s)).toBe(false); // لم تمر يومان
    s = applyOutcome(s, 'clean', 999, t0 + 3 * DAY);
    expect(isMastered(s)).toBe(true);
    expect(s.masteredAt).toBeDefined();
  });

  it('نفس النسخة مرتين لا تُحسب كنسختين مختلفتين', () => {
    let s = { ...emptySkill('x'), level: 4 };
    s = applyOutcome(s, 'clean', 7, t0);
    s = applyOutcome(s, 'clean', 7, t0 + 3 * DAY);
    expect(s.streakUnassisted).toBe(1);
    expect(isMastered(s)).toBe(false);
  });

  it('شكل الورشة حسب المستوى', () => {
    expect(supportFor(0)).toBe('full');
    expect(supportFor(1)).toBe('full');
    expect(supportFor(2)).toBe('partial');
    expect(supportFor(3)).toBe('partial');
    expect(supportFor(4)).toBe('exam');
  });
});

describe('تعبئة النصوص', () => {
  it('المعادلات تستخدم @var ولا تلمس أقواس LaTeX', async () => {
    const { fillPlain, segments } = await import('../../src/engine/template');
    const inst = instantiateOrThrow(closedCircuitFixed, 1);
    expect(fillPlain('$I = \\frac{@emf}{@R + @r} = @answer\\,A$', inst)).toBe('I = (12)/(5.5 + 0.5) = 2 A');
    const segs = segments('القانون $I = \\frac{V_B}{R + r}$ و{emf} فولت', inst);
    expect(segs[1]).toEqual({ type: 'math', latex: 'I = \\frac{V_B}{R + r}' });
    expect(segs[3]).toMatchObject({ type: 'var', name: 'emf', value: 12 });
  });
});
