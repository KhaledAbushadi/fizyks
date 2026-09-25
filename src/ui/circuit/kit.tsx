// مجموعة رسم دوائر SVG: أسلاك، مقاومات، بطاريات، أجهزة قياس، مفاتيح، وشحنات متحركة
import { useEffect, useRef, type ReactNode } from 'react';

export type Pt = [number, number];
export const INK = 'var(--ink)';
const MASK = 'var(--surface)';

export function Wire({ d, color = INK, width = 2.2, dash }: { d: Pt[]; color?: string; width?: number; dash?: string }) {
  return <polyline points={d.map((p) => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={dash} />;
}

export function Lbl({ x, y, t, sub, anchor = 'middle', size = 12, color = INK, weight = 600 }: { x: number; y: number; t: string; sub?: string; anchor?: 'start' | 'middle' | 'end'; size?: number; color?: string; weight?: number }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={color} fontWeight={weight} direction="ltr" style={{ unicodeBidi: 'plaintext', fontStyle: 'italic', fontFamily: 'KaTeX_Main, "Times New Roman", serif' }}>
      {t}
      {sub && (
        <tspan fontSize={size * 0.7} dy={size * 0.3}>
          {sub}
        </tspan>
      )}
    </text>
  );
}

type Orient = 'h' | 'v';

/** مقاومة متعرجة مركزها (x,y) */
export function Resistor({ x, y, orient = 'h', len = 34, label, sub, labelSide = -1, hot = 0 }: { x: number; y: number; orient?: Orient; len?: number; label?: string; sub?: string; labelSide?: 1 | -1; hot?: number }) {
  const n = 6;
  const amp = 6;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = -len / 2 + (len * i) / n;
    const off = i === 0 || i === n ? 0 : i % 2 ? amp : -amp;
    pts.push(orient === 'h' ? [x + t, y + off] : [x + off, y + t]);
  }
  const mask = orient === 'h' ? { x: x - len / 2, y: y - 9, width: len, height: 18 } : { x: x - 9, y: y - len / 2, width: 18, height: len };
  const lx = orient === 'h' ? x : x + labelSide * 16;
  const ly = orient === 'h' ? y + labelSide * 15 + (labelSide > 0 ? 4 : 0) : y + 4;
  return (
    <g>
      <rect {...mask} fill={MASK} />
      {hot > 0 && <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--warm)" strokeWidth={6} opacity={Math.min(0.55, hot)} strokeLinejoin="round" />}
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      {label && <Lbl x={lx} y={ly} t={label} sub={sub} anchor={orient === 'v' ? (labelSide > 0 ? 'start' : 'end') : 'middle'} />}
    </g>
  );
}

/** بطارية: اللوح الطويل = القطب الموجب. pos يحدد جهة القطب الموجب */
export function Battery({ x, y, pos = 'up', label, sub, labelSide = -1 }: { x: number; y: number; pos?: 'up' | 'down' | 'left' | 'right'; label?: string; sub?: string; labelSide?: 1 | -1 }) {
  const v = pos === 'up' || pos === 'down';
  const sgn = pos === 'up' || pos === 'left' ? -1 : 1;
  const long = 24;
  const short = 12;
  const gap = 4;
  const L = v ? { x1: x - long / 2, x2: x + long / 2, y1: y + sgn * gap, y2: y + sgn * gap } : { y1: y - long / 2, y2: y + long / 2, x1: x + sgn * gap, x2: x + sgn * gap };
  const S = v ? { x1: x - short / 2, x2: x + short / 2, y1: y - sgn * gap, y2: y - sgn * gap } : { y1: y - short / 2, y2: y + short / 2, x1: x - sgn * gap, x2: x - sgn * gap };
  const mask = v ? { x: x - 14, y: y - gap - 1, width: 28, height: gap * 2 + 2 } : { x: x - gap - 1, y: y - 14, width: gap * 2 + 2, height: 28 };
  const plus: Pt = v ? [x + 15, y + sgn * gap + (sgn < 0 ? -2 : 8)] : [x + sgn * gap + (sgn < 0 ? -6 : 6), y - 15];
  return (
    <g>
      <rect {...mask} fill={MASK} />
      <line {...L} stroke={INK} strokeWidth={2.4} />
      <line {...S} stroke={INK} strokeWidth={4.5} />
      <text x={plus[0]} y={plus[1]} fontSize={11} fill="var(--warm)" fontWeight={700} textAnchor="middle">+</text>
      {label && <Lbl x={v ? x + labelSide * 20 : x} y={v ? y + 4 : y + labelSide * 20 + (labelSide > 0 ? 6 : 0)} t={label} sub={sub} anchor={v ? (labelSide > 0 ? 'start' : 'end') : 'middle'} />}
    </g>
  );
}

export function Meter({ x, y, letter, reading, r = 11 }: { x: number; y: number; letter: 'A' | 'V'; reading?: string; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={MASK} stroke={INK} strokeWidth={2} />
      <text x={x} y={y + 4.5} textAnchor="middle" fontSize={12} fontWeight={700} fill={letter === 'A' ? 'var(--amber)' : 'var(--teal)'}>{letter}</text>
      {reading && (
        <g>
          <rect x={x - 26} y={y + r + 3} width={52} height={17} rx={5} fill="var(--ink)" />
          <text x={x} y={y + r + 15.5} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--spark)" direction="ltr" style={{ fontFamily: 'ui-monospace, monospace' }}>{reading}</text>
        </g>
      )}
    </g>
  );
}

export function Bulb({ x, y, glow = 0, r = 12 }: { x: number; y: number; glow?: number; r?: number }) {
  const g = Math.max(0, Math.min(1, glow));
  return (
    <g>
      {g > 0.02 && <circle cx={x} cy={y} r={r + 6 + g * 16} fill="var(--spark)" opacity={0.15 + g * 0.45} style={{ filter: 'blur(4px)' }} />}
      <circle cx={x} cy={y} r={r} fill={g > 0.02 ? `color-mix(in srgb, var(--spark) ${Math.round(30 + g * 70)}%, var(--surface))` : MASK} stroke={INK} strokeWidth={2} />
      <path d={`M${x - r * 0.7},${y + r * 0.7} L${x + r * 0.7},${y - r * 0.7} M${x - r * 0.7},${y - r * 0.7} L${x + r * 0.7},${y + r * 0.7}`} stroke={INK} strokeWidth={1.3} opacity={0.7} />
    </g>
  );
}

export function Switch({ x, y, open, len = 26 }: { x: number; y: number; open: boolean; len?: number }) {
  const a: Pt = [x - len / 2, y];
  const b: Pt = [x + len / 2, y];
  return (
    <g>
      <rect x={a[0]} y={y - 6} width={len} height={12} fill={MASK} />
      <circle cx={a[0]} cy={y} r={2.8} fill={INK} />
      <circle cx={b[0]} cy={y} r={2.8} fill={INK} />
      <line x1={a[0]} y1={y} x2={open ? a[0] + len * 0.82 : b[0]} y2={open ? y - len * 0.55 : y} stroke={INK} strokeWidth={2.4} strokeLinecap="round" style={{ transition: 'all .25s' }} />
    </g>
  );
}

export function Node({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={3.4} fill={INK} />;
}

export function Arrow({ from, to, color = 'var(--amber)', label, sub, labelOffset = [0, -8] }: { from: Pt; to: Pt; color?: string; label?: string; sub?: string; labelOffset?: Pt }) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const h = 7;
  const p1: Pt = [x2 - h * Math.cos(ang - 0.45), y2 - h * Math.sin(ang - 0.45)];
  const p2: Pt = [x2 - h * Math.cos(ang + 0.45), y2 - h * Math.sin(ang + 0.45)];
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${p1.join(',')} ${p2.join(',')}`} fill={color} />
      {label && <Lbl x={(x1 + x2) / 2 + labelOffset[0]} y={(y1 + y2) / 2 + labelOffset[1]} t={label} sub={sub} color={color} />}
    </g>
  );
}

export function Svg({ w = 240, h = 150, children, label, className = '' }: { w?: number; h?: number; children: ReactNode; label: string; className?: string }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className={`block h-auto w-full ${className}`} style={{ direction: 'ltr' }}>
      {children}
    </svg>
  );
}

// ———— الشحنات المتحركة: سرعتها تتناسب مع التيار، وكثافتها ثابتة (الشحنات لا تُستهلك) ————

type Sub = (dt: number) => void;
const subs = new Set<Sub>();
let raf = 0;
let last = 0;
function loop(t: number) {
  const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
  last = t;
  subs.forEach((s) => s(dt));
  raf = subs.size ? requestAnimationFrame(loop) : 0;
  if (!raf) last = 0;
}
function subscribe(s: Sub) {
  subs.add(s);
  if (!raf && typeof requestAnimationFrame !== 'undefined') raf = requestAnimationFrame(loop);
  return () => {
    subs.delete(s);
  };
}

const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function measure(path: Pt[]) {
  const segs: { a: Pt; b: Pt; len: number; start: number }[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ a, b, len, start: total });
    total += len;
  }
  return { segs, total };
}

function pointAt(m: ReturnType<typeof measure>, s: number): Pt {
  for (const seg of m.segs) {
    if (s <= seg.start + seg.len) {
      const f = seg.len ? (s - seg.start) / seg.len : 0;
      return [seg.a[0] + (seg.b[0] - seg.a[0]) * f, seg.a[1] + (seg.b[1] - seg.a[1]) * f];
    }
  }
  return m.segs.length ? m.segs[m.segs.length - 1].b : [0, 0];
}

/**
 * شحنات تتحرك على مسار. speed بالبكسل/ثانية (موجبة = مع ترتيب النقاط).
 * water = شكل قطرات ميّه (تشبيه المواسير) بدل نقاط.
 */
export function Flow({ path, speed, spacing = 16, color = 'var(--amber)', r = 3, water = false, closed = false }: { path: Pt[]; speed: number; spacing?: number; color?: string; r?: number; water?: boolean; closed?: boolean }) {
  const pts = closed ? [...path, path[0]] : path;
  const m = measure(pts);
  const count = Math.max(1, Math.floor(m.total / spacing));
  const step = m.total / count;
  const refs = useRef<(SVGCircleElement | null)[]>([]);
  const phase = useRef(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const key = pts.map((p) => p.join(',')).join(';');
  useEffect(() => {
    const mm = measure(pts);
    const place = () => {
      refs.current.forEach((el, i) => {
        if (!el) return;
        let s = (phase.current + i * step) % mm.total;
        if (s < 0) s += mm.total;
        const [x, y] = pointAt(mm, s);
        el.setAttribute('cx', x.toFixed(1));
        el.setAttribute('cy', y.toFixed(1));
      });
    };
    place();
    if (reduced) return;
    return subscribe((dt) => {
      phase.current = (phase.current + speedRef.current * dt) % (mm.total * 1000);
      place();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, step]);
  return (
    <g aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} ref={(el) => { refs.current[i] = el; }} r={water ? r + 0.8 : r} fill={water ? 'var(--teal)' : color} opacity={water ? 0.85 : 1} stroke={water ? 'none' : 'var(--surface)'} strokeWidth={0.8} />
      ))}
    </g>
  );
}

/** سرعة الرسم من التيار: خطية مع سقف */
export function speedFor(current: number, k = 26, max = 190): number {
  const v = current * k;
  return Math.sign(v) * Math.min(max, Math.abs(v));
}
