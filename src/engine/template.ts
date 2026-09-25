// محرك القوالب: كل مسألة قالب يولّد أرقاماً جديدة ويحسب الإجابة والبدائل الخاطئة المشخِّصة
import {
  create, type EvalFunction,
  evaluateDependencies, compileDependencies, addDependencies, subtractDependencies, multiplyDependencies, divideDependencies,
  powDependencies, unaryMinusDependencies, unaryPlusDependencies, largerDependencies, smallerDependencies, largerEqDependencies,
  smallerEqDependencies, equalDependencies, unequalDependencies, andDependencies, orDependencies, notDependencies,
  minDependencies, maxDependencies, absDependencies, sqrtDependencies, piDependencies,
} from 'mathjs';
import type { ProblemTemplate } from '../content/schemas';
import { mulberry32, shuffle, type Rng } from './rng';
import { clean, fmtDecimal, fmtLatex, fmtPlain, roundSig } from './numbers';

// نسخة مصغّرة من mathjs: الدوال اللي القوالب محتاجاها بس (بدل المكتبة كاملة)
const math = create(
  {
    evaluateDependencies, compileDependencies, addDependencies, subtractDependencies, multiplyDependencies, divideDependencies,
    powDependencies, unaryMinusDependencies, unaryPlusDependencies, largerDependencies, smallerDependencies, largerEqDependencies,
    smallerEqDependencies, equalDependencies, unequalDependencies, andDependencies, orDependencies, notDependencies,
    minDependencies, maxDependencies, absDependencies, sqrtDependencies, piDependencies,
  },
  {},
);
const compiled = new Map<string, EvalFunction>();

export function evalExpr(expr: string, scope: Record<string, number>): number {
  let fn = compiled.get(expr);
  if (!fn) {
    fn = math.compile(expr);
    compiled.set(expr, fn);
  }
  const v = fn.evaluate({ ...scope });
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return n;
}

/** الثوابت المتاحة في كل التعبيرات (من constants.json) */
let constantsScope: Record<string, number> = { qe: 1.6e-19 };
export function setConstants(c: { e: { value: number }; h: { value: number }; c: { value: number }; me: { value: number } }) {
  constantsScope = { qe: c.e.value, hP: c.h.value, cL: c.c.value, me: c.me.value };
}
export function getConstantsScope() {
  return constantsScope;
}

export const MAX_TRIES = 50;
export const RESERVED = ['answer'];

export interface Choice {
  value: number;
  correct: boolean;
  misconception?: string;
}

export interface Instance {
  templateId: string;
  seed: number;
  vars: Record<string, number>;
  answer: number;
  answerUnit: string;
  sigFigs: number;
  distractors: { value: number; misconception: string }[];
  choices: Choice[];
  signature: string;
}

function drawVariables(t: ProblemTemplate, rng: Rng): Record<string, number> {
  const vars: Record<string, number> = {};
  for (const [name, spec] of Object.entries(t.variables)) {
    if ('values' in spec) {
      vars[name] = spec.values[Math.floor(rng() * spec.values.length)];
    } else {
      const n = Math.floor((spec.max - spec.min) / spec.step + 1e-9) + 1;
      vars[name] = clean(spec.min + Math.floor(rng() * n) * spec.step);
    }
  }
  return vars;
}

export class TemplateError extends Error {}

/** ينشئ نسخة من القالب ببذرة؛ يعيد null إن فشلت القيود 50 مرة (ويُسجَّل الخطأ) */
export function instantiate(t: ProblemTemplate, seed: number): Instance | null {
  try {
    return instantiateOrThrow(t, seed);
  } catch (e) {
    console.error(`[فُكّها] القالب ${t.id} اتخطّى:`, (e as Error).message);
    return null;
  }
}

export function instantiateOrThrow(t: ProblemTemplate, seed: number): Instance {
  const rng = mulberry32(seed);
  let lastReason = '';
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const base = drawVariables(t, rng);
    const scope: Record<string, number> = { ...constantsScope, ...base };
    for (const [name, expr] of Object.entries(t.derived ?? {})) {
      scope[name] = clean(evalExpr(expr, scope));
    }
    const ok = t.constraints.every((c) => evalExpr(c, scope) === 1);
    if (!ok) {
      lastReason = 'القيود غير متحققة';
      continue;
    }
    const raw = evalExpr(t.answer.expr, scope);
    if (!isFinite(raw) || raw === 0) {
      lastReason = 'إجابة غير صالحة';
      continue;
    }
    const sig = t.answer.sigFigs;
    const answer = roundSig(raw, sig);
    const distractors = t.distractors.map((d) => ({
      value: roundSig(evalExpr(d.expr, scope), sig),
      misconception: d.misconception,
    }));
    // تكملة البدائل بخطأ رتبة الأس إن كانت أقل من 3
    const fill = [10, 0.1, 100];
    for (const f of fill) {
      if (distractors.length >= 3) break;
      distractors.push({ value: roundSig(raw * f, sig), misconception: 'M-POWER-OF-TEN' });
    }
    const all = [answer, ...distractors.map((d) => d.value)];
    if (all.some((v) => !isFinite(v))) {
      lastReason = 'بديل غير صالح';
      continue;
    }
    if (new Set(all.map((v) => v.toPrecision(sig))).size !== all.length) {
      lastReason = 'بديلان متساويان أو بديل يساوي الإجابة';
      continue;
    }
    const picked = shuffle(rng, distractors).slice(0, 3);
    const choices = shuffle(rng, [
      { value: answer, correct: true } as Choice,
      ...picked.map((d) => ({ value: d.value, correct: false, misconception: d.misconception })),
    ]);
    const vars: Record<string, number> = {};
    for (const k of Object.keys(scope)) if (!(k in constantsScope)) vars[k] = scope[k];
    return {
      templateId: t.id,
      seed,
      vars,
      answer,
      answerUnit: t.answer.unit,
      sigFigs: sig,
      distractors,
      choices,
      signature: Object.keys(t.variables).map((k) => `${k}=${base[k]}`).join('|'),
    };
  }
  throw new TemplateError(`فشل التوليد بعد ${MAX_TRIES} محاولة: ${lastReason}`);
}

/** هل القيمة x منطقية حسب شرط "افحص"؟ */
export function sanityHolds(t: ProblemTemplate, inst: Instance, x: number): boolean {
  if (!t.workshop) return true;
  return evalExpr(t.workshop.sanityExpr, { ...constantsScope, ...inst.vars, answer: inst.answer, x }) === 1;
}

// ———————— تعبئة النصوص ————————

export type Segment =
  | { type: 'text'; text: string }
  | { type: 'var'; name: string; value: number; plain?: boolean }
  | { type: 'math'; latex: string };

const PLACEHOLDER = /\{([A-Za-z_][A-Za-z0-9_]*)(:plain)?\}/g;
/** داخل المعادلات $...$ يُكتب المتغير @name حتى لا يتعارض مع أقواس LaTeX */
const MATH_PLACEHOLDER = /@([A-Za-z_][A-Za-z0-9_]*)(:plain)?/g;
const MATH_SPLIT = /(\$[^$]+\$)/g;

function isMathPart(part: string) {
  return part.startsWith('$') && part.endsWith('$') && part.length > 1;
}

function valueOf(name: string, inst: Instance): number | undefined {
  if (name === 'answer') return inst.answer;
  return inst.vars[name];
}

function sigFor(name: string, inst: Instance) {
  return name === 'answer' ? inst.sigFigs : 4;
}

function mathFill(latex: string, inst: Instance): string {
  return latex.replace(MATH_PLACEHOLDER, (m, name: string, plain?: string) => {
    const v = valueOf(name, inst);
    if (v === undefined) return m;
    return plain ? fmtDecimal(v) : fmtLatex(v, sigFor(name, inst));
  });
}

/** يقسم النص إلى نص عادي + متغيرات قابلة للّمس + معادلات $...$ */
export function segments(text: string, inst: Instance | null): Segment[] {
  const out: Segment[] = [];
  for (const part of text.split(MATH_SPLIT)) {
    if (!part) continue;
    if (isMathPart(part)) {
      out.push({ type: 'math', latex: inst ? mathFill(part.slice(1, -1), inst) : part.slice(1, -1) });
      continue;
    }
    if (!inst) {
      out.push({ type: 'text', text: part });
      continue;
    }
    let last = 0;
    for (const m of part.matchAll(PLACEHOLDER)) {
      const v = valueOf(m[1], inst);
      if (v === undefined) continue;
      if (m.index! > last) out.push({ type: 'text', text: part.slice(last, m.index) });
      out.push({ type: 'var', name: m[1], value: roundSig(v, sigFor(m[1], inst)), plain: !!m[2] });
      last = m.index! + m[0].length;
    }
    if (last < part.length) out.push({ type: 'text', text: part.slice(last) });
  }
  return out;
}

/** LaTeX بسيط ← نص عادي (للحافظة) */
export function latexToPlain(latex: string): string {
  let s = latex;
  for (let i = 0; i < 3; i++) s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
  return s
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\rho/g, 'ρ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\pi/g, 'π')
    .replace(/\\ell/g, 'ℓ')
    .replace(/\\Sigma/g, 'Σ')
    .replace(/\\varepsilon/g, 'ε')
    .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, '$1')
    .replace(/\\[,;!]/g, ' ')
    .replace(/_\{([^{}]*)\}/g, '$1')
    .replace(/\^\{([^{}]*)\}/g, '^$1')
    .replace(/\\left|\\right/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** نص عادي بعد التعبئة (للحافظة والتعليمة الجاهزة) */
export function fillPlain(text: string, inst: Instance): string {
  return text
    .split(MATH_SPLIT)
    .map((part) => {
      if (isMathPart(part)) return latexToPlain(mathFill(part.slice(1, -1), inst));
      return part.replace(PLACEHOLDER, (m, name: string, plain?: string) => {
        const v = valueOf(name, inst);
        if (v === undefined) return m;
        return plain ? fmtDecimal(v) : fmtPlain(v, sigFor(name, inst));
      });
    })
    .join('');
}

/** كل أسماء المتغيرات المستخدمة في نص: {x} في النص و@x في المعادلات (للتحقق من المحتوى) */
export function placeholdersIn(text: string): string[] {
  const names: string[] = [];
  for (const part of text.split(MATH_SPLIT)) {
    const re = isMathPart(part) ? MATH_PLACEHOLDER : PLACEHOLDER;
    for (const m of part.matchAll(re)) names.push(m[1]);
  }
  return names;
}

export function templateTexts(t: ProblemTemplate): string[] {
  return [t.stem, ...t.hints, ...Object.values(t.solutionSteps), ...(t.workshop ? [t.workshop.hiddenGiven, t.workshop.sanityCheck] : [])];
}
