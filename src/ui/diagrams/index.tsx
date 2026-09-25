// الرسومات التخطيطية: كل معرّف في diagramChoices يرسم هنا (مسجّل في content/registry.ts)
import type { ReactElement } from 'react';
import type { DiagramId } from '../../content/registry';
import { Arrow, Battery, Flow, Lbl, Meter, Node, Resistor, Svg, Switch, Wire, type Pt } from '../circuit/kit';

type D = (p: { animated?: boolean }) => ReactElement;
const loop = (x1: number, y1: number, x2: number, y2: number): Pt[] => [[x1, y1], [x2, y1], [x2, y2], [x1, y2]];

const ChargeFlow: D = ({ animated }) => (
  <Svg label="سلك بتعدّي فيه شحنات من مقطع">
    <rect x={20} y={55} width={200} height={40} rx={20} fill="var(--surface-2)" stroke="var(--ink)" strokeWidth={2} />
    <ellipse cx={120} cy={75} rx={9} ry={20} fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth={2.5} />
    {animated ? <Flow path={[[28, 68], [212, 68]]} speed={45} spacing={22} /> : [40, 70, 100, 140, 170, 200].map((x) => <circle key={x} cx={x} cy={68} r={3} fill="var(--amber)" />)}
    {animated ? <Flow path={[[28, 82], [212, 82]]} speed={45} spacing={22} /> : [55, 85, 125, 155, 185].map((x) => <circle key={x} cx={x} cy={82} r={3} fill="var(--amber)" />)}
    <Arrow from={[80, 30]} to={[160, 30]} label="I" labelOffset={[0, -6]} />
    <Lbl x={120} y={122} t="Q في زمن t" size={11} />
  </Svg>
);

const EnergyLift: D = ({ animated }) => (
  <Svg label="بطارية بترفع الشحنات لجهد أعلى">
    <Wire d={loop(50, 25, 190, 125)} />
    <rect x={30} y={40} width={40} height={70} rx={8} fill="var(--amber-soft)" stroke="var(--ink)" strokeWidth={2} />
    <Arrow from={[50, 100]} to={[50, 50]} color="var(--warm)" />
    <Lbl x={80} y={80} t="W" anchor="start" color="var(--warm)" />
    <Resistor x={190} y={75} orient="v" label="R" labelSide={1} />
    {animated && <Flow path={[[50, 125], [50, 25], [190, 25], [190, 125]]} speed={40} spacing={20} />}
    <Lbl x={120} y={18} t="V = W / Q" size={11} />
  </Svg>
);

const SingleResistor: D = ({ animated }) => (
  <Svg label="بطارية ومقاومة وأميتر">
    <Wire d={[...loop(40, 30, 200, 120), [40, 30]]} />
    {animated && <Flow path={[[40, 120], [40, 30], [200, 30], [200, 120], [40, 120]]} speed={40} />}
    <Battery x={40} y={75} pos="up" label="V" labelSide={-1} />
    <Resistor x={120} y={30} label="R" />
    <Meter x={120} y={120} letter="A" />
  </Svg>
);

const OpenCircuit: D = () => (
  <Svg label="دائرة فيها مفتاح مفتوح">
    <Wire d={[...loop(40, 30, 200, 120), [40, 30]]} />
    <Battery x={40} y={75} pos="up" label="V" sub="B" />
    <Resistor x={120} y={30} label="R" />
    <Switch x={120} y={120} open />
  </Svg>
);

const InternalR = ({ voltmeter, animated }: { voltmeter?: boolean; animated?: boolean }) => (
  <Svg label="بطارية ليها مقاومة داخلية موصلة بمقاومة خارجية">
    <Wire d={[...loop(60, 30, 205, 120), [60, 30]]} />
    {animated && <Flow path={[[60, 120], [60, 30], [205, 30], [205, 120], [60, 120]]} speed={36} />}
    <rect x={42} y={45} width={36} height={60} rx={6} fill="none" stroke="var(--muted)" strokeDasharray="4 3" />
    <Battery x={60} y={88} pos="up" label="V" sub="B" labelSide={voltmeter ? 1 : -1} />
    <Resistor x={60} y={60} orient="v" len={22} label="r" labelSide={voltmeter ? 1 : -1} />
    <Resistor x={135} y={30} label="R" />
    {voltmeter && (
      <>
        <Wire d={[[60, 40], [14, 40], [14, 110], [60, 110]]} color="var(--teal)" width={1.8} />
        <Meter x={14} y={75} letter="V" />
      </>
    )}
  </Svg>
);

const SeriesN = (n: 2 | 3) => {
  const C: D = ({ animated }) => {
    const xs = n === 2 ? [100, 160] : [85, 125, 165];
    return (
      <Svg label={`${n} مقاومات على التوالي`}>
        <Wire d={[...loop(40, 30, 205, 120), [40, 30]]} />
        {animated && <Flow path={[[40, 120], [40, 30], [205, 30], [205, 120], [40, 120]]} speed={36} />}
        <Battery x={40} y={75} pos="up" label="V" sub="B" />
        {xs.map((x, i) => (
          <Resistor key={x} x={x} y={30} len={28} label="R" sub={String(i + 1)} />
        ))}
      </Svg>
    );
  };
  return C;
};

const ParallelN = (n: 2 | 3) => {
  const C: D = ({ animated }) => {
    const ys = n === 2 ? [30, 72] : [22, 55, 88];
    const bottom = n === 2 ? 122 : 130;
    return (
      <Svg label={`${n} مقاومات على التوازي`} h={n === 2 ? 145 : 150}>
        <Wire d={[[40, bottom], [40, ys[0]], [100, ys[0]]]} />
        <Wire d={[[100, ys[0]], [100, ys[ys.length - 1]]]} />
        <Wire d={[[205, ys[0]], [205, bottom], [40, bottom]]} />
        {ys.map((y, i) => (
          <g key={y}>
            <Wire d={[[100, y], [205, y]]} />
            {animated && <Flow path={[[100, y], [205, y]]} speed={30} />}
            <Resistor x={152} y={y} len={30} label="R" sub={String(i + 1)} labelSide={-1} />
          </g>
        ))}
        {animated && <Flow path={[[205, bottom], [40, bottom], [40, ys[0]], [100, ys[0]]]} speed={30 * n} />}
        <Node x={100} y={ys[0]} />
        <Node x={205} y={ys[0]} />
        <Battery x={40} y={(ys[0] + bottom) / 2 + 8} pos="up" label="V" sub="B" />
      </Svg>
    );
  };
  return C;
};

const Mixed: D = ({ animated }) => (
  <Svg label="مقاومتان على التوازي مع مقاومة ثالثة على التوالي">
    <Wire d={[[40, 125], [40, 30], [100, 30]]} />
    <Wire d={[[100, 30], [100, 72]]} />
    <Wire d={[[205, 30], [205, 125], [40, 125]]} />
    {[30, 72].map((y, i) => (
      <g key={y}>
        <Wire d={[[100, y], [205, y]]} />
        {animated && <Flow path={[[100, y], [205, y]]} speed={28} />}
        <Resistor x={152} y={y} len={30} label={i ? 'R' : 'R'} sub={i ? 'b' : 'a'} />
      </g>
    ))}
    {animated && <Flow path={[[205, 125], [40, 125], [40, 30], [100, 30]]} speed={56} />}
    <Node x={100} y={30} />
    <Node x={205} y={30} />
    <Resistor x={125} y={125} len={30} label="R" sub="c" labelSide={1} />
    <Battery x={40} y={85} pos="up" label="V" sub="B" />
  </Svg>
);

const WireSegment: D = () => (
  <Svg label="سلك له طول ومساحة مقطع">
    <defs>
      <linearGradient id="wire-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e7a86b" />
        <stop offset="0.5" stopColor="#c97a3a" />
        <stop offset="1" stopColor="#8f4f22" />
      </linearGradient>
    </defs>
    <rect x={40} y={55} width={160} height={36} fill="url(#wire-g)" />
    <ellipse cx={40} cy={73} rx={10} ry={18} fill="#b86a31" stroke="var(--ink)" strokeWidth={1.5} />
    <ellipse cx={200} cy={73} rx={10} ry={18} fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth={2.5} />
    <line x1={200} y1={73} x2={200} y2={55} stroke="var(--ink)" strokeWidth={1.5} />
    <Lbl x={214} y={66} t="r" anchor="start" />
    <Lbl x={218} y={100} t="A" anchor="start" color="var(--amber)" />
    <Arrow from={[120, 112]} to={[40, 112]} color="var(--ink-2)" />
    <Arrow from={[120, 112]} to={[200, 112]} color="var(--ink-2)" />
    <Lbl x={120} y={130} t="ℓ" size={14} />
    <Lbl x={120} y={40} t="ρ" sub="e" size={13} />
  </Svg>
);

const TwoWires: D = () => (
  <Svg label="سلكان من نفس المادة بأطوال وأقطار مختلفة">
    <rect x={30} y={30} width={70} height={30} rx={4} fill="#c97a3a" stroke="var(--ink)" strokeWidth={1.2} />
    <Lbl x={65} y={20} t="1" />
    <rect x={30} y={95} width={180} height={12} rx={3} fill="#c97a3a" stroke="var(--ink)" strokeWidth={1.2} />
    <Lbl x={120} y={88} t="2" />
    <Lbl x={120} y={128} t="ℓ₂ = k ℓ₁ ,  d₂ = d₁ / m" size={11} />
  </Svg>
);

const Junction: D = () => (
  <Svg label="نقطة تفرع يدخلها ويخرج منها تيارات">
    <Arrow from={[25, 40]} to={[108, 70]} label="I" sub="1" labelOffset={[-10, -8]} />
    <Arrow from={[25, 110]} to={[108, 80]} label="I" sub="2" labelOffset={[-10, 14]} />
    <Arrow from={[120, 145]} to={[120, 90]} label="I" sub="3" labelOffset={[12, 6]} />
    <Arrow from={[132, 70]} to={[215, 35]} color="var(--teal)" label="I" sub="4" labelOffset={[8, -8]} />
    <Arrow from={[132, 80]} to={[215, 112]} color="var(--teal)" label="I = ?" labelOffset={[6, 16]} />
    <circle cx={120} cy={75} r={8} fill="var(--ink)" />
  </Svg>
);

const SingleLoop: D = ({ animated }) => (
  <Svg label="مسار مغلق فيه بطاريتان متعاكستان">
    <Wire d={[...loop(40, 30, 200, 120), [40, 30]]} />
    {animated && <Flow path={[[40, 120], [40, 30], [200, 30], [200, 120], [40, 120]]} speed={30} />}
    <Battery x={40} y={75} pos="up" label="E" sub="1" />
    <Battery x={200} y={75} pos="up" label="E" sub="2" labelSide={1} />
    <Resistor x={120} y={30} label="R" sub="1" />
    <Resistor x={120} y={120} label="R" sub="2" labelSide={1} />
  </Svg>
);

const TwoLoops: D = ({ animated }) => (
  <Svg label="دائرة بتلات فروع: بطاريتان ومقاومة في الوسط" h={148}>
    <Wire d={[[40, 130], [40, 25], [200, 25], [200, 130], [40, 130]]} />
    <Wire d={[[120, 25], [120, 130]]} />
    {animated && (
      <>
        <Flow path={[[40, 130], [40, 25], [120, 25]]} speed={24} />
        <Flow path={[[200, 130], [200, 25], [120, 25]]} speed={14} />
        <Flow path={[[120, 25], [120, 130]]} speed={38} />
        <Flow path={[[120, 130], [40, 130]]} speed={24} />
        <Flow path={[[120, 130], [200, 130]]} speed={14} />
      </>
    )}
    <Battery x={40} y={98} pos="up" label="E" sub="1" />
    <Resistor x={40} y={55} orient="v" len={28} label="R" sub="1" />
    <Battery x={200} y={98} pos="up" label="E" sub="2" labelSide={1} />
    <Resistor x={200} y={55} orient="v" len={28} label="R" sub="2" labelSide={1} />
    <Resistor x={120} y={78} orient="v" len={28} label="R" sub="3" labelSide={1} />
    <Node x={120} y={25} />
    <Node x={120} y={130} />
    <Arrow from={[58, 13]} to={[92, 13]} label="I" sub="1" labelOffset={[0, -3]} />
    <Arrow from={[182, 13]} to={[148, 13]} label="I" sub="2" labelOffset={[0, -3]} />
    <Arrow from={[106, 95]} to={[106, 115]} label="I" sub="3" labelOffset={[-10, 4]} />
  </Svg>
);

export const DIAGRAMS: Record<DiagramId, D> = {
  'charge-flow': ChargeFlow,
  'energy-lift': EnergyLift,
  'single-resistor': SingleResistor,
  'open-circuit': OpenCircuit,
  'closed-circuit-internal-r': ({ animated }) => <InternalR animated={animated} />,
  'terminal-voltmeter': ({ animated }) => <InternalR voltmeter animated={animated} />,
  'series-two-resistors': SeriesN(2),
  'series-three-resistors': SeriesN(3),
  'parallel-two-resistors': ParallelN(2),
  'parallel-three-resistors': ParallelN(3),
  'mixed-parallel-series': Mixed,
  'wire-segment': WireSegment,
  'two-wires': TwoWires,
  'kirchhoff-junction': Junction,
  'kirchhoff-single-loop': SingleLoop,
  'kirchhoff-two-loops': TwoLoops,
};

export function Diagram({ id, animated = false }: { id: string; animated?: boolean }) {
  const C = DIAGRAMS[id as DiagramId];
  if (!C) return <p className="text-muted">رسم غير متاح</p>;
  return <C animated={animated} />;
}
