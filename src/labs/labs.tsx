// المعامل التفاعلية لمحطة "شوف": كل معمل دائرة حية محسوبة بالقوانين نفسها
import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { LabId } from '../content/registry';
import { Arrow, Battery, Bulb, Flow, Lbl, Meter, Node, Resistor, Svg, Switch, Wire, speedFor, type Pt } from '../ui/circuit/kit';
import { LabCard, MiniChart, Readout, Slider, StackBar, fmt } from './LabKit';

// ———— 1) الشحنة والتيار ————
function LabCharge() {
  const [I, setI] = useState(2);
  const [running, setRunning] = useState(false);
  const [t, setT] = useState(0);
  const [runs, setRuns] = useState<{ I: number; Q: number }[]>([]);
  const startRef = useRef(0);
  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    const id = setInterval(() => {
      const el = Math.min(10, (performance.now() - startRef.current) / 1000);
      setT(el);
      if (el >= 10) {
        setRunning(false);
        setRuns((r) => [...r.slice(-3), { I, Q: I * 10 }]);
      }
    }, 100);
    return () => clearInterval(id);
  }, [running, I]);
  return (
    <LabCard
      readouts={
        <>
          <Readout label="الزمن t" value={fmt(t, 2)} unit="s" tone="ink" />
          <Readout label="الشحنة اللي عدّت Q" value={fmt(I * t, 3)} unit="C" big />
          <Readout label="شدة التيار I = Q/t" value={fmt(I)} unit="A" tone="teal" />
        </>
      }
      controls={
        <>
          <Slider label="شدة التيار" value={I} min={0.5} max={5} step={0.5} unit="A" onChange={(v) => { setI(v); setT(0); }} testid="lab-slider" />
          <button type="button" className="btn btn-amber w-full" disabled={running} onClick={() => { setT(0); setRunning(true); }}>
            {running ? 'بنعدّ…' : 'ابدأ 10 ثواني'}
          </button>
        </>
      }
      note={
        runs.length > 0 && (
          <table className="w-full text-center text-sm">
            <thead><tr className="text-muted"><th>التيار</th><th>الزمن</th><th>الشحنة</th></tr></thead>
            <tbody>{runs.map((r, i) => <tr key={i} className="num"><td>{fmt(r.I)} A</td><td>10 s</td><td className="font-bold">{fmt(r.Q)} C</td></tr>)}</tbody>
          </table>
        )
      }
    >
      <Svg label="سلك وشحنات بتعدّي من مقطع" h={120}>
        <rect x={10} y={35} width={220} height={50} rx={25} fill="var(--surface-2)" stroke="var(--ink)" strokeWidth={2} />
        <Flow path={[[18, 52], [222, 52]]} speed={speedFor(I, 22)} spacing={20} />
        <Flow path={[[18, 68], [222, 68]]} speed={speedFor(I, 22)} spacing={20} />
        <ellipse cx={120} cy={60} rx={10} ry={25} fill="var(--amber)" opacity={0.25} stroke="var(--amber)" strokeWidth={2.5} />
        <Lbl x={120} y={24} t="المقطع" size={11} />
        <Arrow from={[70, 105]} to={[170, 105]} label="I" labelOffset={[0, -5]} />
      </Svg>
    </LabCard>
  );
}

// ———— 2) فرق الجهد = طاقة لكل كولوم ————
function LabEnergy() {
  const [V, setV] = useState(6);
  const [Q, setQ] = useState(10);
  const h = 20 + V * 7.5;
  const top = 125 - h;
  return (
    <LabCard
      readouts={
        <>
          <Readout label="طاقة كل كولوم" value={fmt(V)} unit="J/C" tone="teal" />
          <Readout label="الشحنة" value={fmt(Q)} unit="C" tone="ink" />
          <Readout label="الشغل W = V×Q" value={fmt(V * Q)} unit="J" big />
        </>
      }
      controls={
        <>
          <Slider label="جهد البطارية (ارتفاع الطلمبة)" value={V} min={1.5} max={12} step={1.5} unit="V" onChange={setV} testid="lab-slider" />
          <Slider label="الشحنة المنقولة" value={Q} min={1} max={20} step={1} unit="C" onChange={setQ} />
        </>
      }
      note={<p>ضاعف الجهد وسيب الشحنة زي ما هي: الشغل اتضاعف؟ ده لأن كل كولوم بقى شايل ضعف الطاقة.</p>}
    >
      <Svg label="طلمبة بترفع الشحنات لارتفاع بيمثل الجهد" h={140}>
        <rect x={30} y={top} width={34} height={h} rx={6} fill="var(--amber-soft)" stroke="var(--ink)" strokeWidth={2} />
        <Flow path={[[47, 125], [47, top + 6]]} speed={40} spacing={14} color="var(--amber)" />
        <Wire d={[[47, top], [47, top - 8], [190, top - 8], [190, 125], [47, 125]]} />
        <Flow path={[[64, top - 8], [190, top - 8], [190, 125], [64, 125]]} speed={40} spacing={18} />
        <Resistor x={190} y={(top - 8 + 125) / 2} orient="v" len={30} label="R" labelSide={1} hot={V / 14} />
        <line x1={14} y1={125} x2={14} y2={top} stroke="var(--teal)" strokeWidth={2} />
        <Lbl x={10} y={(125 + top) / 2} t="V" anchor="end" color="var(--teal)" />
        <Lbl x={120} y={top - 14} t={`${fmt(V)} J/C`} size={11} />
      </Svg>
    </LabCard>
  );
}

// ———— 3) قانون أوم ————
function LabOhm() {
  const [V, setV] = useState(6);
  const [R, setR] = useState(4);
  const Rb = 2;
  const I = V / (R + Rb);
  const [pts, setPts] = useState<{ x: number; y: number }[]>([]);
  return (
    <LabCard
      readouts={
        <>
          <Readout label="الأميتر I" value={fmt(I)} unit="A" big />
          <Readout label="المقاومة الكلية" value={fmt(R + Rb)} unit="Ω" tone="ink" />
          <Readout label="V ÷ I" value={fmt(V / I)} unit="Ω" tone="teal" />
        </>
      }
      controls={
        <>
          <Slider label="المقاومة المتغيرة R" value={R} min={1} max={20} step={1} unit="Ω" onChange={setR} testid="lab-slider" />
          <Slider label="جهد البطارية V" value={V} min={0} max={12} step={0.5} unit="V" onChange={setV} />
          <button type="button" className="btn btn-soft w-full" onClick={() => setPts((p) => [...p.slice(-9), { x: V, y: I }])}>
            سجّل القراءة على الرسم
          </button>
        </>
      }
      note={
        <div>
          <MiniChart xMax={12} yMax={4} xLabel="V (فولت)" yLabel="I (أمبير)" lines={[{ slope: 1 / (R + Rb), color: 'var(--teal)', label: 'R' }]} points={[...pts, { x: V, y: I, color: 'var(--warm)' }]} />
          <p className="mt-1 text-sm">الخط المستقيم = قانون أوم: ضعف الجهد يدّي ضعف التيار. وكل ما R تكبر، الخط يميل أقل.</p>
        </div>
      }
    >
      <Svg label="بطارية ومقاومة متغيرة ولمبة وأميتر" h={162}>
        <Wire d={[[40, 125], [40, 30], [200, 30], [200, 125], [40, 125]]} />
        <Flow path={[[40, 125], [40, 30], [200, 30], [200, 125], [40, 125]]} speed={speedFor(I, 40)} />
        <Battery x={40} y={78} pos="up" label={`${fmt(V)} V`} />
        <Resistor x={100} y={30} label={`R = ${R} Ω`} />
        <Bulb x={200} y={78} glow={(I * I * Rb) / 18} />
        <Meter x={120} y={125} letter="A" reading={`${fmt(I)} A`} />
      </Svg>
    </LabCard>
  );
}

// ———— 4) المقاومة النوعية ————
const MATERIALS = [
  { id: 'cu', name: 'نحاس', rho: 1.79e-8, color: '#c97a3a' },
  { id: 'al', name: 'ألومنيوم', rho: 2.8e-8, color: '#a8b3bd' },
  { id: 'ni', name: 'نيكروم', rho: 1.1e-6, color: '#6f7a86' },
];
function LabWire() {
  const [L, setL] = useState(2);
  const [A, setA] = useState(1);
  const [mat, setMat] = useState(MATERIALS[0]);
  const R = (mat.rho * L) / (A * 1e-6);
  const base = useRef({ L: 2, A: 1, rho: MATERIALS[0].rho });
  const R0 = (base.current.rho * base.current.L) / (base.current.A * 1e-6);
  const w = 30 + L * 45;
  const th = 6 + A * 7;
  return (
    <LabCard
      readouts={
        <>
          <Readout label="المقاومة R" value={fmt(R)} unit="Ω" big />
          <Readout label="مقارنة بالبداية" value={`×${fmt(R / R0, 2)}`} tone="teal" />
          <Readout label="ρ للمادة" value={fmt(mat.rho, 3)} unit="Ω m" tone="ink" />
        </>
      }
      controls={
        <>
          <Slider label="الطول ℓ" value={L} min={0.5} max={4} step={0.5} unit="m" onChange={setL} testid="lab-slider" />
          <Slider label="مساحة المقطع A" value={A} min={0.5} max={4} step={0.5} unit="mm²" onChange={setA} />
          <div className="flex gap-2">
            {MATERIALS.map((m) => (
              <button key={m.id} type="button" className={`tap flex-1 rounded-xl border-2 ${mat.id === m.id ? 'border-ink bg-surface-2 font-bold' : 'border-line'}`} onClick={() => setMat(m)}>
                {m.name}
              </button>
            ))}
          </div>
        </>
      }
      note={<p>جرّب: ضاعف الطول بس (المقاومة ×2)، وبعدين ضاعف المساحة بس (المقاومة ÷2). والنيكروم مقاومته النوعية أكبر من النحاس بحوالي 60 مرة، عشان كده بيتعمل منه سلك السخان.</p>}
    >
      <Svg label="سلك طوله ومساحة مقطعه بتتغير" h={110}>
        <rect x={120 - w / 2} y={55 - th / 2} width={w} height={th} rx={th / 2} fill={mat.color} stroke="var(--ink)" strokeWidth={1.2} style={{ transition: 'all .25s' }} />
        <ellipse cx={120 + w / 2} cy={55} rx={Math.max(3, th / 4)} ry={th / 2} fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth={2} />
        <Arrow from={[120, 90]} to={[120 - w / 2, 90]} color="var(--ink-2)" />
        <Arrow from={[120, 90]} to={[120 + w / 2, 90]} color="var(--ink-2)" />
        <Lbl x={120} y={106} t={`ℓ = ${L} m`} size={11} />
        <Lbl x={120} y={22} t={`R = ρ ℓ / A = ${fmt(R)} Ω`} size={11} />
      </Svg>
    </LabCard>
  );
}

// ———— 5) التوالي ————
function LabSeries() {
  const [V, setV] = useState(12);
  const [n, setN] = useState(2);
  const [Rs, setRs] = useState([2, 4, 6]);
  const used = Rs.slice(0, n);
  const Rt = used.reduce((a, b) => a + b, 0);
  const I = V / Rt;
  const xs = n === 2 ? [95, 150] : [85, 125, 165];
  const colors = ['var(--amber)', 'var(--teal)', 'var(--violet)'];
  return (
    <LabCard
      readouts={
        <>
          <Readout label="أميتر قبل المقاومات" value={fmt(I)} unit="A" big />
          <Readout label="أميتر بعد المقاومات" value={fmt(I)} unit="A" big />
          <Readout label="المكافئة = المجموع" value={fmt(Rt)} unit="Ω" tone="ink" />
        </>
      }
      controls={
        <>
          <Slider label="جهد البطارية" value={V} min={3} max={24} step={1.5} unit="V" onChange={setV} testid="lab-slider" />
          <div className="flex gap-2">
            {[2, 3].map((k) => (
              <button key={k} type="button" className={`tap flex-1 rounded-xl border-2 ${n === k ? 'border-ink bg-surface-2 font-bold' : 'border-line'}`} onClick={() => setN(k)}>
                {k} مقاومات
              </button>
            ))}
          </div>
          {used.map((r, i) => (
            <Slider key={i} label={`R${i + 1}`} value={r} min={1} max={20} step={1} unit="Ω" onChange={(v) => setRs(Rs.map((x, j) => (j === i ? v : x)))} />
          ))}
        </>
      }
      note={
        <div>
          <p className="mb-2 font-semibold">الجهد اتقسم كده (الأكبر ياخد أكتر):</p>
          <StackBar total={V} unit="V" parts={used.map((r, i) => ({ label: `V${i + 1}`, value: I * r, color: colors[i] }))} />
        </div>
      }
    >
      <Svg label="مقاومات على التوالي وأميترين" h={162}>
        <Wire d={[[40, 125], [40, 30], [205, 30], [205, 125], [40, 125]]} />
        <Flow path={[[40, 125], [40, 30], [205, 30], [205, 125], [40, 125]]} speed={speedFor(I, 34)} />
        <Battery x={40} y={78} pos="up" label={`${fmt(V)} V`} />
        {xs.map((x, i) => (
          <Resistor key={x} x={x} y={30} len={26} label={`${used[i]}Ω`} hot={(I * I * used[i]) / 40} />
        ))}
        <Meter x={90} y={125} letter="A" reading={`${fmt(I)} A`} />
        <Meter x={165} y={125} letter="A" reading={`${fmt(I)} A`} />
      </Svg>
    </LabCard>
  );
}

// ———— 6) التوازي ————
function LabParallel() {
  const [V, setV] = useState(12);
  const [n, setN] = useState(2);
  const [Rs, setRs] = useState([6, 12, 4]);
  const used = Rs.slice(0, n);
  const Is = used.map((r) => V / r);
  const It = Is.reduce((a, b) => a + b, 0);
  const Req = V / It;
  const ys = n === 1 ? [40] : n === 2 ? [28, 68] : [22, 55, 88];
  const bottom = 128;
  const colors = ['var(--amber)', 'var(--teal)', 'var(--violet)'];
  return (
    <LabCard
      readouts={
        <>
          <Readout label="التيار الكلي" value={fmt(It)} unit="A" big />
          <Readout label="المقاومة المكافئة" value={fmt(Req)} unit="Ω" tone="ink" />
          <Readout label="أصغر مقاومة" value={fmt(Math.min(...used))} unit="Ω" tone="teal" />
        </>
      }
      controls={
        <>
          <Slider label="جهد البطارية" value={V} min={3} max={24} step={1.5} unit="V" onChange={setV} />
          <div className="flex gap-2">
            {[1, 2, 3].map((k) => (
              <button key={k} type="button" className={`tap flex-1 rounded-xl border-2 ${n === k ? 'border-ink bg-surface-2 font-bold' : 'border-line'}`} onClick={() => setN(k)} data-testid={k === 3 ? 'lab-slider' : undefined}>
                {k === 1 ? 'فرع واحد' : `${k} فروع`}
              </button>
            ))}
          </div>
          {used.map((r, i) => (
            <Slider key={i} label={`R${i + 1}`} value={r} min={2} max={24} step={1} unit="Ω" onChange={(v) => setRs(Rs.map((x, j) => (j === i ? v : x)))} />
          ))}
        </>
      }
      note={
        <div>
          <p className="mb-2 font-semibold">التيار الكلي = مجموع تيارات الفروع:</p>
          <StackBar total={It} unit="A" parts={Is.map((x, i) => ({ label: `I${i + 1}`, value: x, color: colors[i] }))} />
        </div>
      }
    >
      <Svg label="مقاومات على التوازي بأميترات" h={164}>
        <Wire d={[[40, bottom], [40, ys[0]], [100, ys[0]]]} />
        {n > 1 && <Wire d={[[100, ys[0]], [100, ys[ys.length - 1]]]} />}
        {n > 1 && <Wire d={[[210, ys[0]], [210, ys[ys.length - 1]]]} />}
        <Wire d={[[210, ys[0]], [210, bottom], [40, bottom]]} />
        {ys.map((y, i) => (
          <g key={y}>
            <Wire d={[[100, y], [210, y]]} />
            <Flow path={[[100, y], [210, y]]} speed={speedFor(Is[i], 30)} />
            <Resistor x={140} y={y} len={26} label={`${used[i]}Ω`} hot={(Is[i] * Is[i] * used[i]) / 40} />
            <Meter x={185} y={y} letter="A" r={9} />
            <Lbl x={185} y={y + 20} t={`${fmt(Is[i])} A`} size={9.5} color="var(--amber)" />
          </g>
        ))}
        <Flow path={[[210, bottom], [40, bottom], [40, ys[0]], [100, ys[0]]]} speed={speedFor(It, 30)} />
        <Node x={100} y={ys[0]} />
        <Node x={210} y={ys[0]} />
        <Battery x={40} y={(ys[0] + bottom) / 2 + 6} pos="up" label={`${fmt(V)} V`} />
        <Meter x={125} y={bottom} letter="A" reading={`${fmt(It)} A`} />
      </Svg>
    </LabCard>
  );
}

// ———— 7) الدائرة المغلقة والمقاومة الداخلية ————
function LabInternal() {
  const [emf, setEmf] = useState(12);
  const [r, setR] = useState(1);
  const [R, setRR] = useState(5);
  const [closed, setClosed] = useState(false);
  const I = closed ? emf / (R + r) : 0;
  const V = emf - I * r;
  return (
    <LabCard
      readouts={
        <>
          <Readout label="الفولتميتر (جهد القطبين)" value={fmt(V)} unit="V" big />
          <Readout label="الأميتر" value={fmt(I)} unit="A" tone="teal" />
          <Readout label="الضايع جوه I r" value={fmt(I * r)} unit="V" tone="warm" />
        </>
      }
      controls={
        <>
          <button type="button" className={`btn w-full ${closed ? 'btn-primary' : 'btn-amber'}`} onClick={() => setClosed((c) => !c)} data-testid="lab-slider">
            {closed ? 'افتح المفتاح' : 'اقفل المفتاح'}
          </button>
          <Slider label="المقاومة الخارجية R" value={R} min={0.5} max={20} step={0.5} unit="Ω" onChange={setRR} />
          <Slider label="المقاومة الداخلية r" value={r} min={0.1} max={3} step={0.1} unit="Ω" onChange={setR} />
          <Slider label="القوة الدافعة" value={emf} min={1.5} max={24} step={1.5} unit="V" onChange={setEmf} />
        </>
      }
      note={
        <div>
          <p className="mb-2 font-semibold">القوة الدافعة = اللي بيوصل للدائرة + اللي بيضيع جوه:</p>
          <StackBar total={emf} unit="V" parts={[{ label: 'V', value: V, color: 'var(--teal)' }, { label: 'I r', value: I * r, color: 'var(--warm)' }]} />
        </div>
      }
    >
      <Svg label="بطارية بمقاومة داخلية ومفتاح وفولتميتر" h={150}>
        <Wire d={[[70, 125], [70, 30], [205, 30], [205, 125], [70, 125]]} />
        {closed && <Flow path={[[70, 125], [70, 30], [205, 30], [205, 125], [70, 125]]} speed={speedFor(I, 30)} />}
        <rect x={52} y={45} width={36} height={62} rx={6} fill="none" stroke="var(--muted)" strokeDasharray="4 3" />
        <Battery x={70} y={90} pos="up" label="V" sub="B" labelSide={1} />
        <Resistor x={70} y={62} orient="v" len={22} label="r" labelSide={1} hot={(I * I * r) / 30} />
        <Resistor x={150} y={30} label={`R = ${R} Ω`} />
        <Switch x={150} y={125} open={!closed} />
        <Wire d={[[70, 38], [22, 38], [22, 115], [70, 115]]} color="var(--teal)" width={1.8} />
        <Meter x={22} y={76} letter="V" />
        <Lbl x={22} y={140} t={`${fmt(V)} V`} size={11} color="var(--teal)" />
      </Svg>
    </LabCard>
  );
}

// ———— 8) كيرشوف الأول ————
function LabJunction() {
  const [I1, setI1] = useState(4);
  const [I2, setI2] = useState(3);
  const [I3, setI3] = useState(5);
  const I4 = I1 + I2 - I3;
  const out = I4 >= 0;
  const c: Pt = [120, 75];
  return (
    <LabCard
      readouts={
        <>
          <Readout label="مجموع الداخل" value={fmt(I1 + I2 + (out ? 0 : -I4))} unit="A" tone="amber" />
          <Readout label="مجموع الخارج" value={fmt(I3 + (out ? I4 : 0))} unit="A" tone="teal" />
          <Readout label="التيار المجهول" value={fmt(Math.abs(I4))} unit="A" big />
        </>
      }
      controls={
        <>
          <Slider label="داخل I1" value={I1} min={0} max={6} step={0.5} unit="A" onChange={setI1} testid="lab-slider" />
          <Slider label="داخل I2" value={I2} min={0} max={6} step={0.5} unit="A" onChange={setI2} />
          <Slider label="خارج I3" value={I3} min={0} max={10} step={0.5} unit="A" onChange={setI3} />
        </>
      }
      note={<p>{out ? `التيار المجهول ${fmt(I4)} أمبير خارج من النقطة.` : `التيار المجهول طلع بالسالب: يعني ${fmt(-I4)} أمبير داخل للنقطة مش خارج منها.`} مهما حرّكت، الداخل = الخارج.</p>}
    >
      <Svg label="نقطة تفرع بتيارات داخلة وخارجة" h={150}>
        <Wire d={[[20, 30], c]} />
        <Wire d={[[20, 120], c]} />
        <Wire d={[c, [220, 30]]} />
        <Wire d={[c, [220, 120]]} />
        <Flow path={[[20, 30], c]} speed={speedFor(I1, 12)} spacing={14} />
        <Flow path={[[20, 120], c]} speed={speedFor(I2, 12)} spacing={14} />
        <Flow path={[c, [220, 30]]} speed={speedFor(I3, 12)} spacing={14} color="var(--teal)" />
        <Flow path={[c, [220, 120]]} speed={speedFor(I4, 12)} spacing={14} color={out ? 'var(--teal)' : 'var(--amber)'} />
        <circle cx={c[0]} cy={c[1]} r={7} fill="var(--ink)" />
        <Lbl x={36} y={24} t={`I₁ = ${fmt(I1)} A`} anchor="start" size={11} color="var(--amber)" />
        <Lbl x={36} y={140} t={`I₂ = ${fmt(I2)} A`} anchor="start" size={11} color="var(--amber)" />
        <Lbl x={204} y={24} t={`I₃ = ${fmt(I3)} A`} anchor="end" size={11} color="var(--teal)" />
        <Lbl x={204} y={140} t={`I = ${fmt(Math.abs(I4))} A ${out ? '→' : '←'}`} anchor="end" size={11} color={out ? 'var(--teal)' : 'var(--amber)'} />
      </Svg>
    </LabCard>
  );
}

export const LABS: Record<LabId, () => ReactElement> = {
  'lab-charge': LabCharge,
  'lab-energy': LabEnergy,
  'lab-ohm': LabOhm,
  'lab-wire': LabWire,
  'lab-series': LabSeries,
  'lab-parallel': LabParallel,
  'lab-internal': LabInternal,
  'lab-junction': LabJunction,
};

export function Lab({ id }: { id: string }) {
  const C = LABS[id as LabId];
  return C ? <C /> : <p className="card p-4">المعمل ده بيتجهز.</p>;
}
