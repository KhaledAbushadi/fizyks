// رحلة الدرس: 8 محطات (الخطّاف ← تنبّأ ← شوف ← الحكاية/الصورة/الرمز ← الرموز ← مثال محلول ← أمثلة ناقصة ← تذكرة الخروج)
import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Lesson, McqItem } from '../../content/schemas';
import { content, templateById } from '../../content/loader';
import { db, safeWrite } from '../../db/schema';
import { instantiate } from '../../engine/template';
import { markActiveDay, recordAttempt, unlockCards } from '../../services/progress';
import { navigate } from '../../router';
import { Art } from '../../ui/art';
import { Lab } from '../../labs/labs';
import { Diagram } from '../../ui/diagrams';
import { RichText } from '../../ui/RichText';
import { Tex } from '../../ui/Math';
import { BookBox, Nudge, Page, SymbolCard, TopBar } from '../../ui/bits';
import { IconCheck, IconNext } from '../../ui/Icons';
import { ProblemRunner } from '../workshop/ProblemRunner';
import { Solution, SolutionStep, STEP_ORDER } from '../workshop/Solution';
import { PhetEmbed } from './PhetEmbed';

const STATIONS = ['الخطّاف', 'تنبّأ', 'شوف', 'من الحكاية للرمز', 'الرموز', 'مثال محلول', 'كمّل الناقص', 'تذكرة الخروج'];

export function LessonJourney({ lesson }: { lesson: Lesson }) {
  const progress = useLiveQuery(() => db.lessonProgress.get(lesson.id), [lesson.id]);
  const [station, setStation] = useState<number | null>(null);
  useEffect(() => {
    if (station === null && progress !== undefined) setStation(Math.max(1, progress?.stationReached ?? 1));
  }, [progress, station]);
  // أول تحميل: لو مفيش سجل، نبدأ من 1
  useEffect(() => {
    const id = setTimeout(() => setStation((s) => s ?? 1), 300);
    return () => clearTimeout(id);
  }, []);

  const goto = async (n: number) => {
    setStation(n);
    window.scrollTo({ top: 0 });
    const prev = await db.lessonProgress.get(lesson.id);
    await safeWrite(() => db.lessonProgress.put({ lessonId: lesson.id, ...prev, stationReached: Math.max(n, prev?.stationReached ?? 1) }));
  };

  if (station === null) return <Page><div className="card mt-6 h-40 animate-pulse" /></Page>;

  return (
    <Page>
      <TopBar title={lesson.title} sub={`المحطة ${station} من 8: ${STATIONS[station - 1]}`} onBack={() => navigate('/lessons')} />
      <div className="mb-4 flex gap-1" aria-hidden="true">
        {STATIONS.map((_, i) => (
          <button key={i} type="button" tabIndex={-1} className={`h-2 flex-1 rounded-full ${i + 1 < station ? 'bg-good' : i + 1 === station ? 'bg-amber' : 'bg-line'}`} onClick={() => i + 1 <= (progress?.stationReached ?? 1) && goto(i + 1)} />
        ))}
      </div>
      <div key={station} className="fade-in" data-testid={`station-${station}`}>
        {station === 1 && <Hook lesson={lesson} next={() => goto(2)} />}
        {station === 2 && <Predict lesson={lesson} saved={progress?.prediction} next={async (choice) => { await safeWrite(() => db.lessonProgress.update(lesson.id, { prediction: choice })); goto(3); }} />}
        {station === 3 && <See lesson={lesson} prediction={progress?.prediction} next={() => goto(4)} />}
        {station === 4 && <Fading lesson={lesson} next={() => goto(5)} />}
        {station === 5 && <Symbols lesson={lesson} next={() => goto(6)} />}
        {station === 6 && <Worked lesson={lesson} next={() => goto(7)} />}
        {station === 7 && <Faded lesson={lesson} next={() => goto(8)} />}
        {station === 8 && <ExitTicket lesson={lesson} />}
      </div>
    </Page>
  );
}

function Next({ onClick, label = 'التالي', disabled, testid = 'next' }: { onClick: () => void; label?: string; disabled?: boolean; testid?: string }) {
  return (
    <button type="button" className="btn btn-primary mt-5 w-full" onClick={onClick} disabled={disabled} data-testid={testid}>
      {label} <IconNext size={18} />
    </button>
  );
}

function Hook({ lesson, next }: { lesson: Lesson; next: () => void }) {
  return (
    <div>
      <div className="card overflow-hidden p-2">
        <Art id={lesson.hook.art} />
      </div>
      <h2 className="mt-4 text-2xl leading-snug font-bold">{lesson.hook.title}</h2>
      <div className="mt-2 space-y-2 text-lg leading-9">
        {lesson.hook.text.map((p) => (
          <p key={p}>
            <RichText text={p} />
          </p>
        ))}
      </div>
      <Next onClick={next} label="يلا نفكّها" />
    </div>
  );
}

function Predict({ lesson, saved, next }: { lesson: Lesson; saved?: number; next: (c: number) => void }) {
  const [choice, setChoice] = useState<number | null>(saved ?? null);
  return (
    <div>
      <p className="mb-1 text-sm font-bold text-amber">قبل ما تشوف: توقّع</p>
      <h2 className="text-xl leading-9 font-bold">{lesson.predict.question}</h2>
      <p className="mt-1 text-sm text-muted">مش هنصحح هنا. المهم تختار اللي حاسه، وبعدين نشوف مع بعض.</p>
      <div className="mt-4 space-y-2">
        {lesson.predict.choices.map((c, i) => (
          <button key={c} type="button" className="choice" data-state={choice === i ? 'selected' : undefined} onClick={() => setChoice(i)} data-testid={`predict-${i}`}>
            {c}
          </button>
        ))}
      </div>
      <Next onClick={() => choice !== null && next(choice)} disabled={choice === null} label="يلا نشوف" />
    </div>
  );
}

function See({ lesson, prediction, next }: { lesson: Lesson; prediction?: number; next: () => void }) {
  const [shown, setShown] = useState(false);
  const right = prediction === lesson.predict.correct;
  return (
    <div>
      <Lab id={lesson.see.lab} />
      <div className="card mt-3 p-4">
        <p className="mb-1 font-bold">جرّب كده:</p>
        <ol className="list-inside list-decimal space-y-1">
          {lesson.see.instructions.map((s) => (
            <li key={s}>
              <RichText text={s} />
            </li>
          ))}
        </ol>
      </div>
      {lesson.see.phet && <PhetEmbed />}
      {!shown ? (
        <Next onClick={() => setShown(true)} label="جرّبت. قارن بتوقعي" testid="see-compare" />
      ) : (
        <div>
          <Nudge tone={right ? 'good' : 'info'} testid="prediction-compare">
            <p>
              <b>توقعت:</b> {prediction !== undefined ? lesson.predict.choices[prediction] : 'ماتوقعتش'}
            </p>
            <p>
              <b>والحقيقة:</b> <RichText text={lesson.see.truth} />
            </p>
            <p className="mt-1 text-sm">{right ? 'توقعك مظبوط. عقلك الفيزيائي شغال.' : 'توقعك كان مختلف، وده أحسن حاجة: دلوقتي المعلومة هتثبت أكتر.'}</p>
          </Nudge>
          <Next onClick={next} />
        </div>
      )}
    </div>
  );
}

function Fading({ lesson, next }: { lesson: Lesson; next: () => void }) {
  const [sub, setSub] = useState(0);
  const f = lesson.fading;
  const labels = ['الحكاية', 'الصورة', 'الرمز'];
  return (
    <div>
      <div className="mb-3 flex gap-2">
        {labels.map((l, i) => (
          <span key={l} className={`rounded-full px-3 py-1 text-sm font-bold ${i === sub ? 'bg-ink text-bg' : i < sub ? 'bg-good-soft text-good' : 'bg-surface-2 text-muted'}`}>
            {l}
          </span>
        ))}
      </div>
      <div key={sub} className="fade-in card p-4 text-lg leading-9">
        {sub === 0 && (
          <>
            <h3 className="mb-2 text-xl font-bold">{f.story.title}</h3>
            {f.story.text.map((p) => (
              <p key={p}>
                <RichText text={p} />
              </p>
            ))}
          </>
        )}
        {sub === 1 && (
          <>
            <div className="mb-3 rounded-xl border border-line bg-surface p-2">
              <Diagram id={f.picture.diagram} animated />
            </div>
            {f.picture.text.map((p) => (
              <p key={p}>
                <RichText text={p} />
              </p>
            ))}
          </>
        )}
        {sub === 2 && (
          <>
            <div className="my-3 text-center text-3xl">
              <Tex tex={f.symbol.latex} display />
            </div>
            {f.symbol.text.map((p) => (
              <p key={p}>
                <RichText text={p} />
              </p>
            ))}
          </>
        )}
      </div>
      <Next onClick={() => (sub < 2 ? setSub(sub + 1) : next())} />
    </div>
  );
}

function Symbols({ lesson, next }: { lesson: Lesson; next: () => void }) {
  return (
    <div>
      <p className="mb-3 text-muted">المس أي رمز عشان تعرف معناه ووحدته ومثال حقيقي.</p>
      <div className="space-y-2">
        {lesson.symbols.map((s) => (
          <SymbolCard key={s.latex} s={s} />
        ))}
      </div>
      <div className="mt-4">
        <BookBox items={lesson.book} />
      </div>
      <Next onClick={next} />
    </div>
  );
}

function Worked({ lesson, next }: { lesson: Lesson; next: () => void }) {
  const t = templateById(lesson.worked.template)!;
  const inst = useMemo(() => instantiate(t, lesson.worked.seed), [t, lesson.worked.seed]);
  const [shown, setShown] = useState(1);
  if (!inst) return <p>المثال بيتجهز.</p>;
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-amber">مثال محلول بالكامل: بص على الخطوات واحدة واحدة</p>
      <section className="card mb-3 p-4 leading-9">
        <RichText text={t.stem} inst={inst} vars={{ highlight: true }} />
      </section>
      <div className="card p-4">
        <ol className="space-y-3" data-testid="worked-steps">
          {STEP_ORDER.slice(0, shown).map((s, i) => (
            <SolutionStep key={s} t={t} inst={inst} step={s} index={i} />
          ))}
        </ol>
      </div>
      {shown < 5 ? <Next onClick={() => setShown(shown + 1)} label="الخطوة الجاية" testid="worked-next" /> : <Next onClick={next} label="فهمت، دوري أنا" />}
    </div>
  );
}

function Faded({ lesson, next }: { lesson: Lesson; next: () => void }) {
  const t = templateById(lesson.faded.template)!;
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-amber">{phase === 0 ? 'ناقص خطوة واحدة: "احسب" عليك' : phase === 1 ? 'ناقص خطوتين: "اجرد" و"احسب" عليك' : 'تمام!'}</p>
      {phase < 2 ? (
        <ProblemRunner key={phase} t={t} mode={phase === 0 ? 'faded1' : 'faded2'} context="lesson" skipMastery onComplete={() => setPhase((p) => (p + 1) as 0 | 1 | 2)} />
      ) : (
        <div className="pop card p-5 text-center">
          <p className="text-lg font-bold">عديت الأمثلة الناقصة. فاضل تذكرة الخروج.</p>
          <Next onClick={next} label="تذكرة الخروج" />
        </div>
      )}
    </div>
  );
}

function ExitTicket({ lesson }: { lesson: Lesson }) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const item = lesson.exit[i];
  const done = async (correctFirst: boolean) => {
    const s = score + (correctFirst ? 1 : 0);
    setScore(s);
    if (i + 1 < lesson.exit.length) setI(i + 1);
    else {
      await unlockCards(lesson.id);
      const prev = await db.lessonProgress.get(lesson.id);
      await safeWrite(() => db.lessonProgress.put({ lessonId: lesson.id, ...prev, stationReached: 8, exitScore: s, completedAt: prev?.completedAt ?? Date.now() }));
      await markActiveDay();
      setFinished(true);
    }
  };
  if (finished) {
    const next = content.lessons.find((l) => l.order === lesson.order + 1);
    return (
      <div className="pop card p-6 text-center" data-testid="lesson-done">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-good-soft text-good">
          <IconCheck size={34} />
        </div>
        <p className="text-2xl font-bold">خلّصت الدرس!</p>
        <p className="mt-1 text-muted">
          تذكرة الخروج: <b className="num text-ink">{score} / 3</b> من أول محاولة
        </p>
        <p className="mt-3 text-[15px]">بطاقات الدرس اتضافت للمراجعة، ومسائله هتظهرلك في الورشة لحد ما تتقنها.</p>
        <div className="mt-5 grid gap-2">
          <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
            خطة النهارده
          </button>
          {next && (
            <button type="button" className="btn btn-ghost" onClick={() => navigate(`/lesson/${next.id}`)}>
              الدرس الجاي: {next.title}
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-amber">
        تذكرة الخروج: سؤال {i + 1} من {lesson.exit.length}
      </p>
      {item.kind === 'mcq' ? (
        <ExitMcq key={i} item={item} lessonId={lesson.id} index={i} onDone={done} />
      ) : (
        <ProblemRunner key={i} t={templateById(item.template)!} mode="exam" context="lesson" canOpenWorkshop={false} onComplete={(first) => done(first === 'clean')} />
      )}
    </div>
  );
}

function ExitMcq({ item, lessonId, index, onDone }: { item: McqItem; lessonId: string; index: number; onDone: (clean: boolean) => void }) {
  const [wrongs, setWrongs] = useState<number[]>([]);
  const [right, setRight] = useState(false);
  const last = wrongs[wrongs.length - 1];
  const mis = last !== undefined ? item.misconceptions?.[last] : null;
  const m = mis ? content.misconceptions.get(mis) : undefined;
  const pick = async (c: number) => {
    if (c === item.correct) {
      setRight(true);
      await recordAttempt({ skillId: `${lessonId}.exit${index + 1}`, seed: 0, mode: 'lesson', affectsMastery: false, outcome: wrongs.length ? 'assisted' : 'clean', hintsUsed: 0, attemptsCount: wrongs.length + 1, secondsSpent: 0, askedExternal: false });
    } else setWrongs([...wrongs, c]);
  };
  return (
    <div>
      <section className="card mb-3 p-4 text-lg leading-9">{item.question}</section>
      <div className="space-y-2">
        {item.choices.map((c, i) => (
          <button key={c} type="button" className="choice" data-state={right && i === item.correct ? 'right' : wrongs.includes(i) ? 'wrong' : undefined} data-correct={i === item.correct ? '1' : '0'} disabled={right || wrongs.includes(i)} onClick={() => pick(i)}>
            {c}
          </button>
        ))}
      </div>
      {m && !right && (
        <Nudge tone="warm" testid="misconception">
          <p className="font-bold">{m.titleAr}</p>
          <p>
            <RichText text={m.explanationAr} />
          </p>
        </Nudge>
      )}
      {!m && last !== undefined && !right && <Nudge>قربت. فكّر تاني.</Nudge>}
      {right && (
        <>
          {item.explain && <Nudge tone="good">{item.explain}</Nudge>}
          <Next onClick={() => onDone(wrongs.length === 0)} />
        </>
      )}
    </div>
  );
}

export { Solution };
