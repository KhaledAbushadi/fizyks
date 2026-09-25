// رسوم "الخطّاف": مشاهد من الحياة اليومية ترسم بـSVG (بلا صور خارجية)
import type { ReactElement } from 'react';
import type { ArtId } from '../content/registry';
import { Flow } from './circuit/kit';

const Frame = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <svg viewBox="0 0 320 180" role="img" aria-label={label} className="block h-auto w-full" style={{ direction: 'ltr' }}>
    <rect x={0} y={0} width={320} height={180} rx={18} fill="var(--surface-2)" />
    {children}
  </svg>
);

const Charger = () => (
  <Frame label="موبايلين بيتشحنوا: شاحن عادي وشاحن سريع">
    {[0, 1].map((i) => {
      const x = 60 + i * 150;
      const fast = i === 1;
      return (
        <g key={i}>
          <rect x={x} y={40} width={62} height={112} rx={12} fill="var(--ink)" />
          <rect x={x + 6} y={50} width={50} height={90} rx={6} fill="var(--surface)" />
          <rect x={x + 16} y={70} width={30} height={52} rx={4} fill="none" stroke="var(--ink-2)" strokeWidth={2} />
          <rect x={x + 18} y={72 + (fast ? 10 : 30)} width={26} height={fast ? 48 : 28} rx={2} fill={fast ? 'var(--good)' : 'var(--amber)'} />
          <path d={`M${x + 31} 152 C ${x + 31} 168, ${x + 70} 168, ${x + 80} 172`} stroke="var(--ink-2)" strokeWidth={fast ? 5 : 2.5} fill="none" />
          <Flow path={[[x + 80, 172], [x + 60, 166], [x + 31, 156]]} speed={fast ? 40 : 18} spacing={10} r={2} />
          <text x={x + 31} y={30} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">{fast ? 'سريع: ساعة' : 'عادي: ساعتين'}</text>
        </g>
      );
    })}
  </Frame>
);

const Pump = () => (
  <Frame label="طلمبة بترفع الميّه لدور عالي ودور واطي">
    <rect x={200} y={20} width={90} height={150} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2} />
    {[0, 1, 2, 3].map((f) => (
      <g key={f}>
        <line x1={200} x2={290} y1={20 + f * 37.5} y2={20 + f * 37.5} stroke="var(--line)" />
        <rect x={250} y={30 + f * 37.5} width={24} height={18} fill="var(--teal-soft)" stroke="var(--ink-2)" />
      </g>
    ))}
    <rect x={40} y={130} width={50} height={40} rx={6} fill="var(--amber)" />
    <text x={65} y={155} textAnchor="middle" fontSize={12} fontWeight={700} fill="#1b1300">طلمبة</text>
    <path d="M90 150 H160 V35 H200" stroke="var(--teal)" strokeWidth={6} fill="none" />
    <path d="M90 160 H180 V150 H200" stroke="var(--teal)" strokeWidth={6} fill="none" opacity={0.5} />
    <Flow path={[[90, 150], [160, 150], [160, 35], [200, 35]]} speed={45} spacing={14} water />
    <text x={150} y={28} textAnchor="end" fontSize={12} fill="var(--ink)" fontWeight={700}>ارتفاع أكبر = طاقة أكبر لكل لتر</text>
  </Frame>
);

const Dimmer = () => (
  <Frame label="مفتاح نور بيتلف والنور بيخفت">
    <rect x={40} y={50} width={80} height={100} rx={12} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2} />
    <circle cx={80} cy={100} r={26} fill="var(--surface-2)" stroke="var(--ink)" strokeWidth={2} />
    <line x1={80} y1={100} x2={96} y2={82} stroke="var(--ink)" strokeWidth={4} strokeLinecap="round" />
    <path d="M52 132 A 34 34 0 0 1 108 132" stroke="var(--amber)" strokeWidth={3} fill="none" strokeDasharray="3 4" />
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(${170 + i * 50} 70)`}>
        <circle r={16 + (2 - i) * 6} fill="var(--spark)" opacity={0.15 + (2 - i) * 0.2} />
        <circle r={14} fill={`color-mix(in srgb, var(--spark) ${90 - i * 35}%, var(--surface))`} stroke="var(--ink)" strokeWidth={2} />
        <rect x={-6} y={14} width={12} height={10} fill="var(--ink-2)" />
        <text y={50} textAnchor="middle" fontSize={11} fill="var(--ink)">{['R صغيرة', 'R وسط', 'R كبيرة'][i]}</text>
      </g>
    ))}
  </Frame>
);

const Wires = () => (
  <Frame label="سلك شاحن رفيع وكابل تكييف تخين">
    <path d="M30 60 C 90 20, 150 100, 290 55" stroke="#c97a3a" strokeWidth={4} fill="none" />
    <text x={30} y={40} fontSize={13} fontWeight={700} fill="var(--ink)">سلك شاحن</text>
    <path d="M30 130 C 110 100, 180 170, 290 125" stroke="#c97a3a" strokeWidth={16} fill="none" strokeLinecap="round" />
    <path d="M30 130 C 110 100, 180 170, 290 125" stroke="#e7a86b" strokeWidth={5} fill="none" opacity={0.6} />
    <text x={30} y={165} fontSize={13} fontWeight={700} fill="var(--ink)">كابل تكييف</text>
  </Frame>
);

const LightsSeries = () => (
  <Frame label="زينة لمبات على التوالي ولمبة بايظة">
    <path d="M20 60 Q 160 120 300 60" stroke="var(--ink)" strokeWidth={2} fill="none" />
    {Array.from({ length: 8 }, (_, i) => {
      const t = (i + 0.5) / 8;
      const x = 20 + t * 280;
      const y = 60 + 120 * t * (1 - t);
      const broken = i === 4;
      const colors = ['var(--amber)', 'var(--teal)', 'var(--warm)', 'var(--violet)'];
      return (
        <g key={i}>
          <line x1={x} y1={y} x2={x} y2={y + 10} stroke="var(--ink)" strokeWidth={2} />
          <ellipse cx={x} cy={y + 20} rx={8} ry={11} fill={broken ? 'var(--surface)' : 'var(--line)'} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray={broken ? '3 2' : undefined} />
          {broken && <path d={`M${x - 5} ${y + 15} l10 10 M${x + 5} ${y + 15} l-10 10`} stroke="var(--warm)" strokeWidth={2} />}
          {!broken && <circle cx={x} cy={y + 20} r={3} fill={colors[i % 4]} opacity={0.35} />}
        </g>
      );
    })}
    <text x={160} y={160} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">لمبة واحدة اتحرقت، والكل طفى</text>
  </Frame>
);

const HomeSockets = () => (
  <Frame label="أجهزة البيت كل واحد في فرع لوحده">
    <line x1={30} y1={40} x2={290} y2={40} stroke="var(--warm)" strokeWidth={4} />
    <line x1={30} y1={150} x2={290} y2={150} stroke="var(--teal)" strokeWidth={4} />
    <text x={30} y={30} fontSize={12} fontWeight={700} fill="var(--ink)">220 فولت</text>
    {['تلاجة', 'تلفزيون', 'غسالة', 'لمبة'].map((name, i) => {
      const x = 70 + i * 60;
      const on = i !== 1;
      return (
        <g key={name}>
          <line x1={x} y1={40} x2={x} y2={150} stroke="var(--ink)" strokeWidth={2} />
          <rect x={x - 22} y={75} width={44} height={40} rx={8} fill={on ? 'var(--amber-soft)' : 'var(--surface)'} stroke="var(--ink)" strokeWidth={2} />
          <text x={x} y={100} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink)">{name}</text>
          {!on && <text x={x} y={130} textAnchor="middle" fontSize={10} fill="var(--muted)">مطفي</text>}
          <circle cx={x} cy={40} r={3.5} fill="var(--ink)" />
          <circle cx={x} cy={150} r={3.5} fill="var(--ink)" />
        </g>
      );
    })}
  </Frame>
);

const CarBattery = () => (
  <Frame label="عربية ونورها بيضعف وقت التشغيل">
    <path d="M40 120 L60 80 Q70 65 90 65 L190 65 Q210 65 225 80 L260 100 L285 105 Q295 108 295 120 L295 132 L40 132 Z" fill="var(--teal)" opacity={0.85} />
    <rect x={95} y={72} width={45} height={24} rx={4} fill="var(--surface)" opacity={0.8} />
    <rect x={150} y={72} width={45} height={24} rx={4} fill="var(--surface)" opacity={0.8} />
    <circle cx={90} cy={134} r={16} fill="var(--ink)" />
    <circle cx={245} cy={134} r={16} fill="var(--ink)" />
    <circle cx={290} cy={112} r={6} fill="var(--spark)" />
    <path d="M296 108 L320 96 L320 128 L296 116 Z" fill="var(--spark)" opacity={0.3} />
    <rect x={120} y={20} width={60} height={34} rx={4} fill="var(--ink)" />
    <rect x={128} y={14} width={10} height={8} fill="var(--warm)" />
    <rect x={162} y={14} width={10} height={8} fill="var(--ink-2)" />
    <text x={150} y={42} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--spark)">12 V</text>
  </Frame>
);

const Roundabout = () => (
  <Frame label="ميدان بتدخله وتخرج منه عربيات">
    <circle cx={160} cy={90} r={52} fill="none" stroke="var(--ink-2)" strokeWidth={22} opacity={0.35} />
    <circle cx={160} cy={90} r={28} fill="var(--good)" opacity={0.5} />
    {[[0, 90, 108, 90], [160, 0, 160, 38], [320, 90, 212, 90], [160, 180, 160, 142]].map(([x1, y1, x2, y2], i) => (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink-2)" strokeWidth={22} opacity={0.35} />
    ))}
    <Flow path={[[10, 90], [108, 90]]} speed={40} spacing={26} r={4.5} />
    <Flow path={[[160, 10], [160, 38]]} speed={40} spacing={26} r={4.5} />
    <Flow path={[[212, 90], [310, 90]]} speed={40} spacing={26} r={4.5} color="var(--teal)" />
    <Flow path={[[160, 142], [160, 172]]} speed={40} spacing={26} r={4.5} color="var(--teal)" />
    <text x={20} y={75} fontSize={12} fontWeight={700} fill="var(--amber)">داخل</text>
    <text x={300} y={75} textAnchor="end" fontSize={12} fontWeight={700} fill="var(--teal)">خارج</text>
  </Frame>
);

export const ART: Record<ArtId, () => ReactElement> = {
  'art-charger': Charger,
  'art-pump': Pump,
  'art-dimmer': Dimmer,
  'art-wires': Wires,
  'art-lights-series': LightsSeries,
  'art-home-sockets': HomeSockets,
  'art-car-battery': CarBattery,
  'art-roundabout': Roundabout,
};

export function Art({ id }: { id: string }) {
  const C = ART[id as ArtId];
  return C ? <C /> : null;
}
