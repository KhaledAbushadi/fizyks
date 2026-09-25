// ورشة المسألة: ارسم ← صنّف ← اجرد ← احسب ← افحص، بدعم يُسحب تلقائياً وسلّم تلميحات إلزامي
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ProblemTemplate } from '../../content/schemas';
import type { Instance } from '../../engine/template';
import { sanityHolds } from '../../engine/template';
import { checkAnswer } from '../../engine/answer';
import { conversionText, unitChoices, unit } from '../../engine/units';
import { mulberry32, shuffle } from '../../engine/rng';
import { content } from '../../content/loader';
import type { ErrorType } from '../../db/schema';
import type { Outcome } from '../../engine/mastery';
import { RichText } from '../../ui/RichText';
import { Tex } from '../../ui/Math';
import { HindiDigits, Num } from '../../ui/Num';
import { Diagram } from '../../ui/diagrams';
import { EMPTY_PAD, NumberPad, padToString, type PadValue } from '../../ui/NumberPad';
import { Hint, Nudge, StepDots } from '../../ui/bits';
import { Mascot, praise } from '../../ui/Mascot';
import { celebrate } from '../../ui/Confetti';
import { FreeTutor } from './FreeTutor';
import { buildTutorPrompt } from './tutorPrompt';
import { Solution, STEP_LABELS } from './Solution';

export type WorkshopMode = 'full' | 'partial' | 'exam' | 'faded1' | 'faded2' | 'mixed';
type Step = 'draw' | 'classify' | 'inventory' | 'compute' | 'check' | 'answer' | 'mcq';

export interface WorkshopResult {
  outcome: Outcome;
  wrongCount: number;
  hintsUsed: number;
  errorType?: ErrorType;
  misconceptionId?: string;
  askedExternal: boolean;
  seconds: number;
}

function stepsFor(mode: WorkshopMode, hasWorkshop: boolean): Step[] {
  if (!hasWorkshop && (mode === 'full' || mode === 'partial' || mode === 'faded1' || mode === 'faded2')) return ['answer'];
  switch (mode) {
    case 'full':
      return ['draw', 'classify', 'inventory', 'compute', 'check'];
    case 'partial':
      return ['draw', 'classify', 'answer'];
    case 'faded1':
      return ['compute'];
    case 'faded2':
      return ['inventory', 'compute'];
    default:
      return ['mcq'];
  }
}

/** كم محاولة خاطئة قبل كشف الحل: 4 في الإدخال الحر، 3 في الاختيار من متعدد (بعدها يتبقى الصحيح وحده) */
const revealAfter = (step: Step) => (step === 'mcq' ? 3 : 4);

export function Workshop({
  t,
  inst,
  mode: initialMode,
  onFinish,
  canOpenWorkshop = true,
}: {
  t: ProblemTemplate;
  inst: Instance;
  mode: WorkshopMode;
  onFinish: (r: WorkshopResult) => void;
  canOpenWorkshop?: boolean;
}) {
  const [mode, setMode] = useState<WorkshopMode>(initialMode);
  const steps = stepsFor(mode, !!t.workshop);
  const [stepIdx, setStepIdx] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [misNote, setMisNote] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [asked, setAsked] = useState(false);
  const firstError = useRef<{ type?: ErrorType; mis?: string }>({});
  const lastAnswer = useRef('');
  const started = useRef(Date.now());
  const rng = useMemo(() => mulberry32(inst.seed ^ 0x9e3779b9), [inst.seed]);
  const hindi = useContext(HindiDigits);

  const step = steps[stepIdx];
  const hintLevel = Math.min(3, wrong);
  const isMixed = mode === 'mixed';

  const result = (outcome: Outcome): WorkshopResult => ({
    outcome,
    wrongCount: wrong,
    hintsUsed: Math.min(3, wrong),
    errorType: firstError.current.type,
    misconceptionId: firstError.current.mis,
    askedExternal: asked,
    seconds: (Date.now() - started.current) / 1000,
  });

  const fail = (type: ErrorType, misconceptionId?: string, note?: string) => {
    if (!firstError.current.type) firstError.current.type = type;
    if (misconceptionId && !firstError.current.mis) firstError.current.mis = misconceptionId;
    const mis = misconceptionId ? content.misconceptions.get(misconceptionId) : undefined;
    setMisNote(mis ? `${mis.titleAr}|${mis.explanationAr}|${mis.analogyAr}` : null);
    setNotice(note ?? null);
    const n = wrong + 1;
    setWrong(n);
    if (isMixed) {
      setRevealed(true);
      return;
    }
    if (n >= revealAfter(step)) setRevealed(true);
  };

  const advance = () => {
    setMisNote(null);
    setNotice(null);
    if (stepIdx + 1 < steps.length) setStepIdx(stepIdx + 1);
    else setDone(true);
  };

  const outcome: Outcome = revealed ? 'revealed' : wrong === 0 ? 'clean' : 'assisted';

  // ———— شاشة النهاية ————
  if (done && !revealed) {
    return <DoneCard wrong={wrong} inst={inst} onContinue={() => onFinish(result(outcome))} />;
  }

  return (
    <div>
      {steps.length > 1 && <StepDots total={steps.length} current={stepIdx} labels={steps.map((s) => STEP_LABELS[s] ?? 'الإجابة')} />}

      {!(step === 'inventory' && !revealed) && (
        <section className="card mb-3 p-4 text-[17px] leading-9" data-testid="problem-stem">
          <RichText text={t.stem} inst={inst} />
        </section>
      )}

      {!revealed && (
        <div key={`${step}-${stepIdx}`} className="fade-in">
          {step === 'draw' && t.workshop && <DrawStep t={t} rng={rng} onRight={advance} onWrong={() => fail('misread', undefined, 'مش ده. بص على شكل التوصيل في المسألة تاني.')} />}
          {step === 'classify' && t.workshop && <ClassifyStep t={t} rng={rng} onRight={advance} onWrong={() => fail('concept', undefined, 'القانون ده مش هو اللي بيحكم المسألة.')} />}
          {step === 'inventory' && t.workshop && <InventoryStep t={t} inst={inst} rng={rng} onRight={advance} onWrong={(msg) => fail('misread', undefined, msg)} />}
          {(step === 'compute' || step === 'answer') && (
            <ComputeStep
              t={t}
              inst={inst}
              rng={rng}
              hindi={hindi}
              faded={mode === 'faded1' || mode === 'faded2'}
              onRight={advance}
              onAnswer={(s) => (lastAnswer.current = s)}
              onWrong={fail}
            />
          )}
          {step === 'check' && t.workshop && <CheckStep t={t} inst={inst} rng={rng} onRight={advance} onWrong={() => fail('concept', undefined, 'فكّر تاني في الشرط ده.')} />}
          {step === 'mcq' && <McqStep t={t} inst={inst} single={isMixed} onRight={advance} onWrong={(mis) => fail(mis ? (content.misconceptions.get(mis)?.type ?? 'concept') : 'calc', mis)} onAnswer={(s) => (lastAnswer.current = s)} />}
        </div>
      )}

      {notice && !revealed && <Nudge testid="nudge">{notice}</Nudge>}
      {misNote && <MisconceptionNote raw={misNote} />}

      {!revealed && !isMixed && hintLevel >= 1 && (
        <div data-testid="hints">
          {Array.from({ length: hintLevel }, (_, i) => (
            <Hint key={i} level={i + 1} text={t.hints[i]}>
              {i === 1 && t.workshop && (
                <p className="mt-1 text-sm">
                  <b>المعطى الخفي:</b> <RichText text={t.workshop.hiddenGiven} inst={inst} />
                </p>
              )}
            </Hint>
          ))}
        </div>
      )}

      {!revealed && !isMixed && wrong >= 2 && <FreeTutor prompt={buildTutorPrompt(t, inst, lastAnswer.current)} onUsed={() => setAsked(true)} />}

      {step === 'mcq' && !revealed && !isMixed && canOpenWorkshop && t.workshop && (
        <button type="button" className="btn btn-ghost mt-3 w-full" onClick={() => { setMode('full'); setStepIdx(0); }} data-testid="open-workshop">
          افتح الورشة (خطوة خطوة)
        </button>
      )}

      {revealed && (
        <div className="fade-in mt-4" data-testid="revealed">
          <Nudge tone="info">
            <p className="font-bold">{isMixed && wrong > 0 ? 'الإجابة الصح:' : 'خلينا نحلها سوا خطوة خطوة:'}</p>
            <p className="text-sm">
              الإجابة: <Num value={inst.answer} sig={inst.sigFigs} unit={inst.answerUnit} className="font-bold" />
            </p>
          </Nudge>
          <div className="card mt-3 p-4">
            <Solution t={t} inst={inst} />
          </div>
          <button type="button" className="btn btn-amber mt-4 w-full" onClick={() => onFinish(result('revealed'))} data-testid="after-reveal">
            {isMixed ? 'السؤال الجاي' : 'فهمت. هات مسألة توأم'}
          </button>
        </div>
      )}
    </div>
  );
}

function DoneCard({ wrong, inst, onContinue }: { wrong: number; inst: Instance; onContinue: () => void }) {
  useEffect(() => {
    celebrate(wrong === 0 ? 110 : 50);
  }, [wrong]);
  return (
    <div className="pop card overflow-hidden p-0 text-center" data-testid="workshop-done">
      <div className="hero rounded-none px-5 pt-5 pb-3">
        <Mascot mood="cheer" size={92} className="wiggle mx-auto" />
        <p className="mt-1 text-2xl font-bold">{wrong === 0 ? 'فكّيتها من أول مرة!' : 'فكّيتها!'}</p>
        <p className="text-sm font-semibold opacity-80">{praise()}</p>
      </div>
      <div className="p-5">
        <p className="text-muted">
          الإجابة: <Num value={inst.answer} sig={inst.sigFigs} unit={inst.answerUnit} className="font-bold text-ink" />
        </p>
        {wrong > 0 && <p className="mt-1 text-sm text-muted">المرة الجاية حاول من غير تلميحات، وهتلاقي الورشة بتخف تلقائي.</p>}
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={onContinue} data-testid="workshop-continue">
          كمّل
        </button>
      </div>
    </div>
  );
}

function MisconceptionNote({ raw }: { raw: string }) {
  const [title, explanation, analogy] = raw.split('|');
  return (
    <div className="pop mt-3 rounded-2xl border-s-4 border-amber bg-amber-soft p-3" data-testid="misconception">
      <p className="font-bold">{title}</p>
      <p className="mt-1 leading-8">
        <RichText text={explanation} />
      </p>
      <p className="mt-1 text-sm text-ink-2">
        <b>تخيّلها كده:</b> <RichText text={analogy} />
      </p>
    </div>
  );
}

// ———— الخطوات ————

type StepProps = { t: ProblemTemplate; rng: () => number; onRight: () => void; onWrong: () => void };

function DrawStep({ t, rng, onRight, onWrong }: StepProps) {
  const w = t.workshop!;
  const order = useMemo(() => shuffle(rng, w.diagramChoices), [rng, w.diagramChoices]);
  const [wrongSet, setWrongSet] = useState<Set<string>>(new Set());
  const [right, setRight] = useState<string | null>(null);
  return (
    <div>
      <p className="mb-2 font-bold">ارسم: أنهي رسم بيوصف المسألة؟</p>
      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
        {order.map((id) => {
          const state = right === id ? 'right' : wrongSet.has(id) ? 'wrong' : undefined;
          return (
            <button
              key={id}
              type="button"
              className="choice !p-2"
              data-state={state}
              data-correct={id === w.correctDiagram ? '1' : '0'}
              disabled={!!right || wrongSet.has(id)}
              onClick={() => {
                if (id === w.correctDiagram) {
                  setRight(id);
                  setTimeout(onRight, 450);
                } else {
                  setWrongSet(new Set(wrongSet).add(id));
                  onWrong();
                }
              }}
            >
              <Diagram id={id} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClassifyStep({ t, rng, onRight, onWrong }: StepProps) {
  const w = t.workshop!;
  const order = useMemo(() => shuffle(rng, w.lawChoices), [rng, w.lawChoices]);
  const [wrongSet, setWrongSet] = useState<Set<string>>(new Set());
  const [right, setRight] = useState<string | null>(null);
  return (
    <div>
      <p className="mb-2 font-bold">صنّف: أنهي قانون بيحكم المسألة؟</p>
      <div className="space-y-2">
        {order.map((law) => (
          <button
            key={law}
            type="button"
            className="choice text-center text-lg"
            data-state={right === law ? 'right' : wrongSet.has(law) ? 'wrong' : undefined}
            data-correct={law === w.correctLaw ? '1' : '0'}
            disabled={!!right || wrongSet.has(law)}
            onClick={() => {
              if (law === w.correctLaw) {
                setRight(law);
                setTimeout(onRight, 450);
              } else {
                setWrongSet(new Set(wrongSet).add(law));
                onWrong();
              }
            }}
          >
            <Tex tex={law} />
          </button>
        ))}
      </div>
    </div>
  );
}

function InventoryStep({ t, inst, rng, onRight, onWrong }: { t: ProblemTemplate; inst: Instance; rng: () => number; onRight: () => void; onWrong: (msg: string) => void }) {
  const w = t.workshop!;
  const [filled, setFilled] = useState<(string | null)[]>(() => w.inventory.map(() => null));
  const [active, setActive] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [bad, setBad] = useState<Set<number>>(new Set());
  void rng;
  const used = new Set(filled.filter(Boolean) as string[]);
  const tap = (name: string) => {
    if (confirmed) return;
    const next = [...filled];
    const existing = next.indexOf(name);
    if (existing >= 0) next[existing] = null;
    next[active] = name;
    setFilled(next);
    setBad(new Set());
    const nextEmpty = next.findIndex((x, i) => x === null && i !== active);
    if (nextEmpty >= 0) setActive(nextEmpty);
  };
  const confirm = () => {
    const wrongIdx = new Set<number>();
    w.inventory.forEach((s, i) => {
      if (filled[i] !== s.var) wrongIdx.add(i);
    });
    if (wrongIdx.size) {
      setBad(wrongIdx);
      setFilled(filled.map((f, i) => (wrongIdx.has(i) ? null : f)));
      setActive([...wrongIdx][0]);
      onWrong(`${wrongIdx.size === 1 ? 'خانة واحدة' : 'فيه خانات'} محتاجة رقم تاني. اقرا المسألة كلمة كلمة: كل رقم جنبه وحدته.`);
      return;
    }
    setConfirmed(true);
  };
  return (
    <div>
      <p className="mb-2 font-bold">اجرد: المس الخانة، وبعدين المس رقمها في المسألة</p>
      <div className="mb-3 rounded-2xl bg-surface-2 p-3 leading-10" data-testid="inventory-stem">
        <RichText text={t.stem} inst={inst} vars={{ tappable: !confirmed, onTap: tap, used }} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {w.inventory.map((s, i) => (
          <button
            key={s.symbol + i}
            type="button"
            data-slot={i}
            data-slot-var={s.var}
            onClick={() => {
              if (confirmed) return;
              if (filled[i]) {
                const n = [...filled];
                n[i] = null;
                setFilled(n);
              }
              setActive(i);
            }}
            className={`tap flex items-center justify-between gap-2 rounded-2xl border-2 px-3 py-2 ${bad.has(i) ? 'border-warm bg-warm-soft' : active === i && !confirmed ? 'border-amber bg-amber-soft' : 'border-line bg-surface'}`}
          >
            <span className="text-lg">
              <Tex tex={s.symbol} /> =
            </span>
            <span className="font-bold">
              {filled[i] ? <Num value={inst.vars[filled[i]!]} unit={s.unit} plain={s.unit === '1' ? false : undefined} /> : <span className="text-muted">؟</span>}
            </span>
          </button>
        ))}
      </div>
      {!confirmed ? (
        <button type="button" className="btn btn-primary mt-3 w-full" disabled={filled.some((f) => f === null)} onClick={confirm} data-testid="inventory-confirm">
          تأكيد الجرد
        </button>
      ) : (
        <div className="pop mt-3 space-y-2">
          {w.inventory.map((s) => {
            const c = conversionText(inst.vars[s.var], s.unit);
            return c ? (
              <p key={s.var} className="rounded-xl bg-teal-soft px-3 py-2 text-[15px]" data-testid="conversion">
                تحويل تلقائي: <bdi dir="rtl">{c}</bdi>
              </p>
            ) : null;
          })}
          <p className="rounded-xl bg-surface-2 px-3 py-2">
            المطلوب: <Tex tex={w.unknown} />
          </p>
          <button type="button" className="btn btn-primary w-full" onClick={onRight} data-testid="inventory-next">
            كده الجرد تمام، نحسب
          </button>
        </div>
      )}
    </div>
  );
}

function ComputeStep({
  t,
  inst,
  rng,
  hindi,
  faded,
  onRight,
  onWrong,
  onAnswer,
}: {
  t: ProblemTemplate;
  inst: Instance;
  rng: () => number;
  hindi: boolean;
  faded: boolean;
  onRight: () => void;
  onWrong: (type: ErrorType, mis?: string, note?: string) => void;
  onAnswer: (s: string) => void;
}) {
  const units = useMemo(() => (inst.answerUnit === '1' ? [] : shuffle(rng, unitChoices(inst.answerUnit))), [rng, inst.answerUnit]);
  const [pad, setPad] = useState<PadValue>(EMPTY_PAD);
  const [chosen, setChosen] = useState<string | null>(inst.answerUnit === '1' ? '1' : null);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const w = t.workshop;
  const submit = () => {
    const raw = padToString(pad);
    const res = checkAnswer(raw, chosen ?? inst.answerUnit, { answer: inst.answer, answerUnit: inst.answerUnit, distractors: inst.distractors });
    onAnswer(`${raw} ${chosen && chosen !== '1' ? unit(chosen).symbol : ''}`.trim());
    if (res.kind === 'unreadable') {
      setMsg('اكتب الرقم بس، زي 0.25');
      return;
    }
    setMsg(null);
    if (res.kind === 'correct') {
      setOk(true);
      setTimeout(onRight, 500);
    } else if (res.kind === 'unit') onWrong('unit', undefined, res.message);
    else if (res.kind === 'distractor') {
      const mis = inst.distractors[res.index].misconception;
      onWrong(content.misconceptions.get(mis)?.type ?? 'calc', mis, 'قربت. الرقم ده بيطلع من غلطة مشهورة:');
    } else onWrong('calc', undefined, 'قربت. راجع الحسبة تاني.');
    setPad(EMPTY_PAD);
  };
  return (
    <div>
      {faded && w && (
        <div className="card mb-3 p-3 text-[15px]">
          <p className="mb-1 font-bold text-muted">الخطوات اللي فاتت محلولة:</p>
          <p>
            <b>صنّف:</b> <RichText text={t.solutionSteps.classify} inst={inst} />
          </p>
          <p>
            <b>اجرد:</b> <RichText text={t.solutionSteps.inventory} inst={inst} />
          </p>
        </div>
      )}
      <p className="mb-2 font-bold">
        احسب: {w ? <Tex tex={`${w.unknown} = \\,?`} /> : 'الإجابة = ؟'}
      </p>
      <NumberPad value={pad} onChange={setPad} disabled={ok} hindi={hindi} />
      {units.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-sm text-muted">الوحدة:</p>
          <div className="flex flex-wrap gap-2" dir="ltr">
            {units.map((u) => (
              <button
                key={u}
                type="button"
                data-unit={u}
                className={`tap rounded-xl border-2 px-3 font-semibold ${chosen === u ? 'border-ink bg-surface-2' : 'border-line bg-surface'}`}
                onClick={() => setChosen(u)}
              >
                {unit(u).symbol}
              </button>
            ))}
          </div>
        </div>
      )}
      {msg && <Nudge tone="info">{msg}</Nudge>}
      <button type="button" className="btn btn-primary mt-3 w-full" disabled={ok || !pad.mantissa || !chosen} onClick={submit} data-testid="compute-submit">
        {ok ? 'صح!' : 'تحقق'}
      </button>
    </div>
  );
}

function CheckStep({ t, inst, rng, onRight, onWrong }: StepProps & { inst: Instance }) {
  const candidate = useMemo(() => {
    const fails = inst.distractors.filter((d) => !sanityHolds(t, inst, d.value));
    if (fails.length && rng() < 0.5) return { value: fails[Math.floor(rng() * fails.length)].value, friend: true };
    return { value: inst.answer, friend: false };
  }, [t, inst, rng]);
  const truth = sanityHolds(t, inst, candidate.value);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [wrongSet, setWrongSet] = useState<Set<boolean>>(new Set());
  return (
    <div>
      <p className="mb-2 font-bold">افحص: الناتج منطقي؟</p>
      <div className="card mb-3 p-3">
        <p className="text-sm text-muted">القاعدة:</p>
        <p className="leading-8">
          <RichText text={t.workshop!.sanityCheck} inst={inst} />
        </p>
        <p className="mt-2 border-t border-line pt-2">
          {candidate.friend ? 'زميلك حل المسألة وطلعله' : 'إنت طلعلك'} <Num value={candidate.value} sig={inst.sigFigs} unit={inst.answerUnit} className="font-bold" />. منطقي ولا لأ؟
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            className="choice text-center"
            data-state={picked === v ? 'right' : wrongSet.has(v) ? 'wrong' : undefined}
            data-correct={v === truth ? '1' : '0'}
            disabled={picked !== null || wrongSet.has(v)}
            onClick={() => {
              if (v === truth) {
                setPicked(v);
                setTimeout(onRight, 500);
              } else {
                setWrongSet(new Set(wrongSet).add(v));
                onWrong();
              }
            }}
          >
            {v ? 'منطقي' : 'مش منطقي'}
          </button>
        ))}
      </div>
    </div>
  );
}

function McqStep({ inst, single, onRight, onWrong, onAnswer }: { t: ProblemTemplate; inst: Instance; single: boolean; onRight: () => void; onWrong: (mis?: string) => void; onAnswer: (s: string) => void }) {
  const [wrongSet, setWrongSet] = useState<Set<number>>(new Set());
  const [right, setRight] = useState<number | null>(null);
  const letters = ['أ', 'ب', 'ج', 'د'];
  return (
    <div>
      <p className="mb-2 font-bold">اختار الإجابة الصحيحة:</p>
      <div className="space-y-2">
        {inst.choices.map((c, i) => (
          <button
            key={i}
            type="button"
            className="choice flex items-center gap-3"
            data-state={right === i ? 'right' : wrongSet.has(i) ? 'wrong' : undefined}
            data-correct={c.correct ? '1' : '0'}
            data-misconception={c.misconception ?? ''}
            disabled={right !== null || wrongSet.has(i) || (single && wrongSet.size > 0)}
            onClick={() => {
              onAnswer(String(c.value));
              if (c.correct) {
                setRight(i);
                setTimeout(onRight, 450);
              } else {
                setWrongSet(new Set(wrongSet).add(i));
                onWrong(c.misconception);
              }
            }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-sm font-bold">{letters[i]}</span>
            <Num value={c.value} sig={inst.sigFigs} unit={inst.answerUnit} className="text-lg font-semibold" />
          </button>
        ))}
      </div>
    </div>
  );
}
