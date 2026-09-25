// الوحدات والبادئات: التطبيق يحوّل البادئات تلقائياً ويُظهر التحويل للطالب
import { normalizeDigits, parseNumber, fmtPlain } from './numbers';

export interface Prefix {
  symbol: string;
  ar: string;
  power: number;
}

/** البادئات القياسية (ملحق 3 في كتاب الوزارة) */
export const PREFIXES: Prefix[] = [
  { symbol: 'p', ar: 'بيكو', power: -12 },
  { symbol: 'n', ar: 'نانو', power: -9 },
  { symbol: 'µ', ar: 'ميكرو', power: -6 },
  { symbol: 'm', ar: 'مللي', power: -3 },
  { symbol: 'c', ar: 'سنتي', power: -2 },
  { symbol: 'k', ar: 'كيلو', power: 3 },
  { symbol: 'M', ar: 'ميجا', power: 6 },
  { symbol: 'G', ar: 'جيجا', power: 9 },
];

export interface UnitDef {
  id: string;
  /** الوحدة الأساسية التي نحسب بها */
  base: string;
  factor: number;
  symbol: string;
  ar: string;
}

const BASES: { base: string; symbol: string; ar: string; prefixes: string[] }[] = [
  { base: 'A', symbol: 'A', ar: 'أمبير', prefixes: ['m', 'µ', 'k'] },
  { base: 'V', symbol: 'V', ar: 'فولت', prefixes: ['m', 'k'] },
  { base: 'Ω', symbol: 'Ω', ar: 'أوم', prefixes: ['m', 'k', 'M'] },
  { base: 'C', symbol: 'C', ar: 'كولوم', prefixes: ['m', 'µ', 'n'] },
  { base: 'J', symbol: 'J', ar: 'جول', prefixes: ['k', 'm'] },
  { base: 's', symbol: 's', ar: 'ثانية', prefixes: ['m'] },
  { base: 'm', symbol: 'm', ar: 'متر', prefixes: ['c', 'm', 'k'] },
  { base: 'm²', symbol: 'm²', ar: 'متر مربع', prefixes: [] },
  { base: 'Ω·m', symbol: 'Ω·m', ar: 'أوم.متر', prefixes: [] },
  { base: 'Ω⁻¹m⁻¹', symbol: 'Ω⁻¹m⁻¹', ar: 'أوم⁻¹.متر⁻¹', prefixes: [] },
  { base: 'e⁻', symbol: 'إلكترون', ar: 'إلكترون', prefixes: [] },
  { base: '1', symbol: '', ar: 'بدون وحدة', prefixes: [] },
];

export const UNITS: Record<string, UnitDef> = {};
for (const b of BASES) {
  UNITS[b.base] = { id: b.base, base: b.base, factor: 1, symbol: b.symbol, ar: b.ar };
  for (const p of b.prefixes) {
    const pre = PREFIXES.find((x) => x.symbol === p)!;
    const id = p + b.base;
    UNITS[id] = { id, base: b.base, factor: Math.pow(10, pre.power), symbol: p + b.symbol, ar: pre.ar + ' ' + b.ar };
  }
}
// مساحة بالملليمتر المربع (شائعة في مسائل المقاومة النوعية)
UNITS['mm²'] = { id: 'mm²', base: 'm²', factor: 1e-6, symbol: 'mm²', ar: 'مللي متر مربع' };
UNITS['cm²'] = { id: 'cm²', base: 'm²', factor: 1e-4, symbol: 'cm²', ar: 'سنتيمتر مربع' };
UNITS['min'] = { id: 'min', base: 's', factor: 60, symbol: 'min', ar: 'دقيقة' };

export function unit(id: string): UnitDef {
  const u = UNITS[id];
  if (!u) throw new Error(`وحدة غير معروفة: ${id}`);
  return u;
}

/** قائمة وحدات بديلة معقولة للاختيار (نفس الوحدة ببادئات + وحدات أخرى من نفس الفصل) */
export function unitChoices(answerUnit: string): string[] {
  const u = unit(answerUnit);
  const sameBase = Object.values(UNITS).filter((x) => x.base === u.base && x.id !== u.id && !['mm²', 'cm²', 'min'].includes(x.id)).map((x) => x.id);
  const others = ['A', 'V', 'Ω', 'C', 'J'].filter((x) => x !== u.base);
  const list = [u.id, ...sameBase.slice(0, 1), ...others.slice(0, 3)];
  return Array.from(new Set(list));
}

/** تحويل قيمة من وحدة إلى أساسها */
export function toBase(value: number, unitId: string): number {
  return value * unit(unitId).factor;
}

/** نص تحويل يُعرض للطالب: "250 مللي أمبير = 0.25 أمبير" */
export function conversionText(value: number, unitId: string): string | null {
  const u = unit(unitId);
  if (u.factor === 1) return null;
  const b = unit(u.base);
  return `${fmtPlain(value)} ${u.ar} = ${fmtPlain(toBase(value, unitId))} ${b.ar}`;
}

const ALIASES: [RegExp, string][] = [
  [/^(مللي|ملي)\s*أمبير$/, 'mA'],
  [/^ميكرو\s*أمبير$/, 'µA'],
  [/^أمبير$/, 'A'],
  [/^كيلو\s*أوم$/, 'kΩ'],
  [/^ميجا\s*أوم$/, 'MΩ'],
  [/^أوم$/, 'Ω'],
  [/^(مللي|ملي)\s*فولت$/, 'mV'],
  [/^كيلو\s*فولت$/, 'kV'],
  [/^فولت$/, 'V'],
  [/^ميكرو\s*كولوم$/, 'µC'],
  [/^كولوم$/, 'C'],
  [/^جول$/, 'J'],
  [/^ohm$/i, 'Ω'],
  [/^kohm$/i, 'kΩ'],
  [/^uA$/, 'µA'],
  [/^uC$/, 'µC'],
];

function resolveUnit(token: string): string | null {
  const t = token.trim();
  if (!t) return null;
  if (UNITS[t]) return t;
  for (const [re, id] of ALIASES) if (re.test(t)) return id;
  return null;
}

/** يقرأ "250 mA" أو "250 مللي أمبير" → { value: 0.25, base: 'A' } */
export function parseQuantity(raw: string): { value: number; base: string; unitId: string } | null {
  const s = normalizeDigits(raw).trim();
  const m = s.match(/^([-+0-9.,×xX*^()eE·\s]+?)\s*([^\d\s].*)?$/);
  if (!m) return null;
  const num = parseNumber(m[1]);
  if (num === null) return null;
  if (!m[2]) return { value: num, base: '1', unitId: '1' };
  const id = resolveUnit(m[2]);
  if (!id) return null;
  const u = unit(id);
  return { value: num * u.factor, base: u.base, unitId: id };
}
