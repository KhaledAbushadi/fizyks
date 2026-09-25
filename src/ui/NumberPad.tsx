// لوحة أرقام مخصصة فيها زر ×10ⁿ (الإدخال بأسس بدون لوحة مفاتيح الموبايل)
import { toHindi } from './Num';

export interface PadValue {
  mantissa: string;
  exponent: string | null; // null = بدون أس
  editingExp: boolean;
}

export const EMPTY_PAD: PadValue = { mantissa: '', exponent: null, editingExp: false };

export function padToString(v: PadValue): string {
  if (v.exponent === null) return v.mantissa;
  return `${v.mantissa || '1'}×10^${v.exponent || '0'}`;
}

function press(v: PadValue, key: string): PadValue {
  const part = v.editingExp ? 'exponent' : 'mantissa';
  const cur = (v.editingExp ? v.exponent : v.mantissa) ?? '';
  switch (key) {
    case 'back':
      if (v.editingExp && cur === '') return { ...v, exponent: null, editingExp: false };
      return { ...v, [part]: cur.slice(0, -1) };
    case 'clear':
      return EMPTY_PAD;
    case 'exp':
      return v.exponent === null ? { ...v, exponent: '', editingExp: true } : { ...v, editingExp: !v.editingExp };
    case 'neg':
      return { ...v, [part]: cur.startsWith('-') ? cur.slice(1) : '-' + cur };
    case '.':
      if (v.editingExp || cur.includes('.')) return v;
      return { ...v, mantissa: (cur === '' || cur === '-' ? cur + '0' : cur) + '.' };
    default:
      if (cur.replace('-', '').length >= (v.editingExp ? 3 : 10)) return v;
      return { ...v, [part]: cur + key };
  }
}

export function NumberPad({ value, onChange, disabled, hindi = false }: { value: PadValue; onChange: (v: PadValue) => void; disabled?: boolean; hindi?: boolean }) {
  const d = (s: string) => (hindi ? toHindi(s) : s);
  const keys: { k: string; label: string; cls?: string; aria?: string }[] = [
    { k: '7', label: '7' }, { k: '8', label: '8' }, { k: '9', label: '9' }, { k: 'back', label: '⌫', cls: 'bg-surface-2', aria: 'امسح' },
    { k: '4', label: '4' }, { k: '5', label: '5' }, { k: '6', label: '6' }, { k: 'exp', label: '×10ⁿ', cls: 'bg-amber-soft font-bold', aria: 'أس عشري' },
    { k: '1', label: '1' }, { k: '2', label: '2' }, { k: '3', label: '3' }, { k: 'neg', label: '±', cls: 'bg-surface-2', aria: 'سالب' },
    { k: 'clear', label: 'C', cls: 'bg-surface-2', aria: 'مسح الكل' }, { k: '0', label: '0' }, { k: '.', label: '.' }, { k: 'noop', label: '' },
  ];
  return (
    <div>
      <div className="card mb-3 flex min-h-16 items-center justify-center px-4 text-3xl font-bold" dir="ltr" data-testid="pad-display" aria-live="polite">
        <span className={v(value).mCls}>{value.mantissa ? d(value.mantissa) : value.exponent === null ? <span className="text-muted text-xl font-normal">اكتب الناتج</span> : '1'}</span>
        {value.exponent !== null && (
          <span className="ms-1">
            ×10
            <sup className={`text-xl ${value.editingExp ? 'rounded bg-amber-soft px-1 outline-2 outline-amber' : ''}`}>{value.exponent ? d(value.exponent) : '□'}</sup>
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2" dir="ltr">
        {keys.map(({ k, label, cls, aria }) =>
          k === 'noop' ? (
            <span key={k} />
          ) : (
            <button
              key={k}
              type="button"
              disabled={disabled}
              aria-label={aria ?? label}
              data-key={k}
              onClick={() => onChange(press(value, k))}
              className={`tap h-14 rounded-2xl border border-line text-2xl font-semibold active:scale-95 ${cls ?? 'bg-surface'}`}
            >
              {k.length === 1 && /\d/.test(k) ? d(label) : label}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function v(value: PadValue) {
  return { mCls: value.editingExp ? 'opacity-60' : '' };
}
