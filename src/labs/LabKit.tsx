// أدوات المعامل: منزلقات كبيرة للمس، شاشات قراءة، ومخطط بياني صغير
import type { ReactNode } from 'react';
import { toParts } from '../engine/numbers';

export function Slider({ label, value, min, max, step, unit, onChange, testid }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void; testid?: string }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-[15px]">
        <span className="font-semibold">{label}</span>
        <bdi className="num font-bold text-amber">
          {fmt(value)} {unit}
        </bdi>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} data-testid={testid} />
    </label>
  );
}

const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

/** رقم مختصر للقراءات: 1.79×10⁻⁸ (أس بحروف مرتفعة يشتغل في HTML وSVG) */
export function fmt(x: number, sig = 3): string {
  if (!isFinite(x)) return '∞';
  const p = toParts(x, sig);
  return p.exponent === null ? p.mantissa : `${p.mantissa}×10${String(p.exponent).split('').map((c) => SUP[c] ?? c).join('')}`;
}

export function Readout({ label, value, unit, tone = 'amber', big = false }: { label: string; value: string; unit?: string; tone?: 'amber' | 'teal' | 'warm' | 'good' | 'ink'; big?: boolean }) {
  const color = { amber: 'text-amber', teal: 'text-teal', warm: 'text-warm', good: 'text-good', ink: 'text-ink' }[tone];
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2 text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className={`num font-bold ${color} ${big ? 'text-2xl' : 'text-lg'}`}>
        {value}
        {unit && <span className="ms-1 text-sm font-semibold opacity-80">{unit}</span>}
      </p>
    </div>
  );
}

export function LabCard({ children, controls, readouts, note }: { children: ReactNode; controls: ReactNode; readouts?: ReactNode; note?: ReactNode }) {
  return (
    <div className="card overflow-hidden" data-testid="lab">
      <div className="bg-surface p-2">{children}</div>
      {readouts && <div className="grid grid-cols-2 gap-2 border-t border-line p-3 min-[420px]:grid-cols-3">{readouts}</div>}
      <div className="space-y-3 border-t border-line p-3">{controls}</div>
      {note && <div className="border-t border-line bg-surface-2 p-3 text-[15px]">{note}</div>}
    </div>
  );
}

/** شريط مكدّس: يوضح إن الأجزاء مجموعها = الكل */
export function StackBar({ parts, total, unit }: { parts: { label: string; value: number; color: string }[]; total: number; unit: string }) {
  return (
    <div>
      <div className="flex h-7 overflow-hidden rounded-lg border border-line" dir="ltr">
        {parts.map((p) => (
          <div key={p.label} style={{ width: `${Math.max(0, (p.value / total) * 100)}%`, background: p.color }} className="flex items-center justify-center text-[11px] font-bold text-[#1b1300] transition-all" title={p.label}>
            {p.value / total > 0.12 ? p.label : ''}
          </div>
        ))}
      </div>
      <p className="mt-1 text-center text-sm text-muted">
        <bdi className="num">
          {parts.map((p) => fmt(p.value)).join(' + ')} = {fmt(total)} {unit}
        </bdi>
      </p>
    </div>
  );
}

/** مخطط خطي صغير (التيار مقابل الجهد مثلاً) */
export function MiniChart({ xMax, yMax, lines, points, xLabel, yLabel }: { xMax: number; yMax: number; lines: { slope: number; color: string; label: string }[]; points: { x: number; y: number; color?: string }[]; xLabel: string; yLabel: string }) {
  const W = 260;
  const H = 150;
  const pad = { l: 34, r: 12, t: 24, b: 28 };
  const sx = (x: number) => pad.l + (x / xMax) * (W - pad.l - pad.r);
  const sy = (y: number) => H - pad.b - (y / yMax) * (H - pad.t - pad.b);
  const ticksX = [0, xMax / 2, xMax];
  const ticksY = [0, yMax / 2, yMax];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ direction: 'ltr' }} role="img" aria-label={`${yLabel} مقابل ${xLabel}`}>
      {ticksY.map((y) => (
        <g key={y}>
          <line x1={pad.l} x2={W - pad.r} y1={sy(y)} y2={sy(y)} stroke="var(--line)" />
          <text x={pad.l - 4} y={sy(y) + 4} fontSize={10} textAnchor="end" fill="var(--muted)">{fmt(y, 2)}</text>
        </g>
      ))}
      {ticksX.map((x) => (
        <text key={x} x={sx(x)} y={H - pad.b + 14} fontSize={10} textAnchor="middle" fill="var(--muted)">{fmt(x, 2)}</text>
      ))}
      <line x1={pad.l} y1={sy(0)} x2={W - pad.r} y2={sy(0)} stroke="var(--ink-2)" />
      <line x1={pad.l} y1={sy(0)} x2={pad.l} y2={pad.t} stroke="var(--ink-2)" />
      {lines.map((l) => {
        const xEnd = Math.min(xMax, yMax / Math.max(l.slope, 1e-9));
        return <line key={l.label} x1={sx(0)} y1={sy(0)} x2={sx(xEnd)} y2={sy(l.slope * xEnd)} stroke={l.color} strokeWidth={2.5} strokeLinecap="round" />;
      })}
      {points.map((p, i) => (
        <circle key={i} cx={sx(Math.min(p.x, xMax))} cy={sy(Math.min(p.y, yMax))} r={4.5} fill={p.color ?? 'var(--amber)'} stroke="var(--surface)" strokeWidth={1.5} />
      ))}
      <text x={W - pad.r} y={H - 4} fontSize={10.5} textAnchor="end" fill="var(--ink-2)">{xLabel}</text>
      <text x={pad.l + 4} y={12} fontSize={10.5} fill="var(--ink-2)">{yLabel}</text>
    </svg>
  );
}
