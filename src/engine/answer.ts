// التحقق من الإجابة المكتوبة (القسم 5.5): هامش 1% أو تطابق بعد التقريب لرقمين معنويين
import { parseNumber, roundSig } from './numbers';
import { toBase, unit } from './units';

export const REL_TOLERANCE = 0.01;

export function numbersMatch(given: number, expected: number): boolean {
  if (!isFinite(given) || !isFinite(expected)) return false;
  if (expected === 0) return Math.abs(given) < 1e-12;
  if (Math.abs(given - expected) / Math.abs(expected) <= REL_TOLERANCE) return true;
  return roundSig(given, 2) === roundSig(expected, 2);
}

export type CheckResult =
  | { kind: 'unreadable' }
  | { kind: 'correct' }
  | { kind: 'unit'; message: string }
  | { kind: 'distractor'; index: number }
  | { kind: 'wrong' };

export interface Checkable {
  answer: number;
  answerUnit: string;
  distractors: { value: number }[];
}

/**
 * يفحص إجابة الطالب: الرقم + الوحدة المختارة.
 * الرقم يُحوَّل حسب بادئة الوحدة المختارة (250 مع mA = 0.25 A صحيحة).
 */
export function checkAnswer(raw: string, chosenUnit: string, p: Checkable): CheckResult {
  const n = parseNumber(raw);
  if (n === null) return { kind: 'unreadable' };
  const chosen = unit(chosenUnit);
  const target = unit(p.answerUnit);
  const targetBase = toBase(p.answer, p.answerUnit);
  if (chosen.base === target.base) {
    const givenBase = toBase(n, chosenUnit);
    if (numbersMatch(givenBase, targetBase)) return { kind: 'correct' };
    // رقم صحيح لكن البادئة غلط (مثلاً 0.25 مع mA)
    if (chosenUnit !== p.answerUnit && numbersMatch(n, p.answer)) {
      return { kind: 'unit', message: `الرقم صح، بس الوحدة مش ${chosen.symbol}. راجع البادئة.` };
    }
  } else if (numbersMatch(n, p.answer)) {
    return { kind: 'unit', message: `الرقم صح، بس الوحدة غلط: المطلوب ${target.ar} مش ${chosen.ar}.` };
  }
  const givenInAnswerUnit = chosen.base === target.base ? toBase(n, chosenUnit) / target.factor : n;
  const idx = p.distractors.findIndex((d) => numbersMatch(givenInAnswerUnit, d.value));
  if (idx >= 0) return { kind: 'distractor', index: idx };
  return { kind: 'wrong' };
}
