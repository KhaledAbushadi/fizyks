// عرض رقم: 1.6×10⁻¹⁹ بخط أرقام ثابت ومعزول الاتجاه
import { createContext, useContext } from 'react';
import { toParts } from '../engine/numbers';
import { unit as unitDef } from '../engine/units';

export const HindiDigits = createContext(false);
const HINDI = '٠١٢٣٤٥٦٧٨٩';
export function toHindi(s: string) {
  return s.replace(/[0-9]/g, (d) => HINDI[Number(d)]).replace('.', '٫');
}

export function Num({ value, sig = 4, unit, plain = false, className = '' }: { value: number; sig?: number; unit?: string; plain?: boolean; className?: string }) {
  const hindi = useContext(HindiDigits);
  const conv = (s: string) => (hindi ? toHindi(s) : s);
  const p = plain
    ? { mantissa: value.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 }), exponent: null }
    : toParts(value, sig);
  const u = unit && unit !== '1' ? unitDef(unit).symbol : '';
  return (
    <bdi className={`num ${className}`}>
      {conv(p.mantissa)}
      {p.exponent !== null && (
        <>
          ×10<sup>{conv(String(p.exponent)).replace('-', '−')}</sup>
        </>
      )}
      {u && <span className="ms-1 font-normal opacity-80">{u}</span>}
    </bdi>
  );
}
