// تنسيق الأرقام والأرقام المعنوية وقراءة ما يكتبه الطالب

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';
const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** تقريب لعدد محدد من الأرقام المعنوية */
export function roundSig(x: number, sig: number): number {
  if (!isFinite(x) || x === 0) return x;
  const p = Math.floor(Math.log10(Math.abs(x)));
  const factor = Math.pow(10, sig - 1 - p);
  return Math.round(x * factor) / factor;
}

/** يزيل ضجيج الفاصلة العائمة (0.1 + 0.2) */
export function clean(x: number): number {
  return Number.parseFloat(x.toPrecision(12));
}

export interface SciParts {
  mantissa: string;
  exponent: number | null;
}

/** يقسم الرقم إلى جزء عشري وأس عند الحاجة (الأرقام الكبيرة جداً أو الصغيرة جداً) */
export function toParts(x: number, sig = 4): SciParts {
  if (x === 0) return { mantissa: '0', exponent: null };
  const r = roundSig(x, sig);
  const abs = Math.abs(r);
  if (abs >= 1e5 || abs < 1e-3) {
    let exp = Math.floor(Math.log10(abs));
    let m = roundSig(r / Math.pow(10, exp), sig);
    if (Math.abs(m) >= 10) {
      m = m / 10;
      exp += 1;
    }
    return { mantissa: trimZeros(clean(m).toString()), exponent: exp };
  }
  return { mantissa: trimZeros(clean(r).toString()), exponent: null };
}

function trimZeros(s: string): string {
  return s.includes('.') && !s.includes('e') ? s.replace(/\.?0+$/, '') : s;
}

/** رقم عشري كامل بلا أس (0.00045 أو 36000) */
export function fmtDecimal(x: number): string {
  return clean(x).toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 });
}

/** نص عادي: 1.6×10^-19 */
export function fmtPlain(x: number, sig = 4): string {
  const { mantissa, exponent } = toParts(x, sig);
  return exponent === null ? mantissa : `${mantissa}×10^${exponent}`;
}

/** صيغة KaTeX */
export function fmtLatex(x: number, sig = 4): string {
  const { mantissa, exponent } = toParts(x, sig);
  return exponent === null ? mantissa : `${mantissa}\\times10^{${exponent}}`;
}

/** تحويل الأرقام الهندية والفارسية والفاصلة العربية إلى صيغة غربية */
export function normalizeDigits(input: string): string {
  let out = '';
  for (const ch of input) {
    const a = ARABIC_INDIC.indexOf(ch);
    const f = PERSIAN.indexOf(ch);
    const s = SUPERSCRIPT.indexOf(ch);
    if (a >= 0) out += String(a);
    else if (f >= 0) out += String(f);
    else if (s >= 0) out += '^' + String(s);
    else if (ch === '٫') out += '.';
    else if (ch === '٬') out += '';
    else if (ch === '−' || ch === '–' || ch === '⁻') out += '-';
    else out += ch;
  }
  return out;
}

/**
 * يقرأ رقماً مكتوباً بأي صيغة مقبولة:
 * 0.25 · .25 · 2.5e-1 · 2.5×10^-1 · 2.5x10^-1 · 2.5*10^(-1) · ٢٫٥
 * يعيد null إن لم يكن رقماً مفهوماً (ولا تُحسب محاولة).
 */
export function parseNumber(raw: string): number | null {
  let s = normalizeDigits(raw).trim().replace(/\s+/g, '');
  if (!s) return null;
  // فاصلة عشرية أوروبية: 2,5 → 2.5 (فقط إن لم توجد نقطة)
  if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  s = s.replace(/,/g, '');
  // ×10^n بأشكاله
  const sci = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+))(?:[×xX*·]10\^?\(?([+-]?\d+)\)?)$/);
  if (sci) {
    const v = Number(sci[1]) * Math.pow(10, Number(sci[2]));
    return isFinite(v) ? clean(v) : null;
  }
  // 10^n وحدها
  const pow = s.match(/^10\^\(?([+-]?\d+)\)?$/);
  if (pow) return Math.pow(10, Number(pow[1]));
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(s)) {
    const v = Number(s);
    return isFinite(v) ? v : null;
  }
  return null;
}
