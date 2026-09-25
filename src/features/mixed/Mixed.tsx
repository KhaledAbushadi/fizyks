// الجلسة المختلطة الموقّتة: أسئلة من كل المهارات المفتوحة بشكل الامتحان
import { useMemo, useRef, useState } from 'react';
import type { AppData } from '../../services/appData';
import { content, isVisible, lessonTemplates } from '../../content/loader';
import { getMeta, setMeta } from '../../db/schema';
import { isMastered } from '../../engine/mastery';
import { navigate } from '../../router';
import { Empty, Nudge, Page, TopBar, fmtClock, useTimer } from '../../ui/bits';
import { IconClock, IconLock } from '../../ui/Icons';
import { ProblemRunner } from '../workshop/ProblemRunner';
import type { ProblemTemplate } from '../../content/schemas';
import { useLiveQuery } from 'dexie-react-hooks';

const SIZE = 8;

function buildSession(pool: ProblemTemplate[], chapterMarks: Map<number, number>): ProblemTemplate[] {
  // وزن كل قالب = وزن فصله ÷ عدد قوالب الفصل المفتوحة
  const byCh = new Map<number, ProblemTemplate[]>();
  for (const t of pool) byCh.set(t.chapter, [...(byCh.get(t.chapter) ?? []), t]);
  const weighted = pool.map((t) => ({ t, w: (chapterMarks.get(t.chapter) ?? 1) / byCh.get(t.chapter)!.length }));
  const total = weighted.reduce((s, x) => s + x.w, 0);
  const out: ProblemTemplate[] = [];
  for (let i = 0; i < SIZE; i++) {
    let r = Math.random() * total;
    let chosen = weighted[0].t;
    for (const x of weighted) {
      r -= x.w;
      if (r <= 0) {
        chosen = x.t;
        break;
      }
    }
    // تداخل: لا نكرر نفس القالب مرتين ورا بعض
    if (out.length && out[out.length - 1].id === chosen.id && pool.length > 1) {
      i--;
      continue;
    }
    out.push(chosen);
  }
  return out;
}

export function Mixed({ data }: { data: AppData }) {
  const warned = useLiveQuery(() => getMeta('mixedWarningSeen', false), []);
  const [phase, setPhase] = useState<'intro' | 'run' | 'done'>('intro');
  const [i, setI] = useState(0);
  const results = useRef<{ ok: boolean; seconds: number; marks: number }[]>([]);
  const openSkills = useMemo(
    () => data.visibleLessons.filter((l) => data.progress.get(l.id)?.completedAt).flatMap((l) => lessonTemplates(l.id)).filter((t) => isVisible(t, data.settings.showDrafts)),
    [data.visibleLessons, data.progress, data.settings.showDrafts],
  );
  const session = useMemo(() => (openSkills.length ? buildSession(openSkills, new Map((content.exam?.chapters ?? []).map((c) => [c.id, c.marks]))) : []), [openSkills]);
  const masteredRatio = openSkills.length ? openSkills.filter((t) => { const s = data.skills.get(t.id); return s && isMastered(s); }).length / openSkills.length : 0;
  const timerVisible = masteredRatio >= 0.7;
  const timer = useTimer(phase === 'run');
  const qStart = useRef(Date.now());

  if (!data.mixedUnlocked) {
    return (
      <Page>
        <TopBar title="الجلسة المختلطة" onBack={() => navigate('/')} />
        <div className="card mt-4 p-6 text-center" data-testid="mixed-locked">
          <IconLock size={32} className="mx-auto text-muted" />
          <p className="mt-2 font-bold">بتتفتح بعد ما تتقن درسين</p>
          <p className="mt-1 text-sm text-muted">اتقنت {data.masteredLessons.length} من 2 لحد دلوقتي.</p>
        </div>
      </Page>
    );
  }
  if (phase === 'intro') {
    return (
      <Page>
        <TopBar title="الجلسة المختلطة" sub={`${SIZE} أسئلة بشكل الامتحان`} onBack={() => navigate('/')} />
        {!warned && (
          <Nudge tone="info" testid="mixed-warning">
            <p className="leading-8 font-semibold">هتحس إنها أصعب وإنك بتتعلم أقل. ده بالظبط علامة إنها شغالة. الطلاب اللي اتدربوا كده جابوا نتايج أحسن بكتير في الاختبار المتأخر.</p>
          </Nudge>
        )}
        <div className="card mt-3 p-4 text-[15px] leading-8">
          <p>• أسئلة من كل الدروس اللي خلصتها، متلخبطة عن قصد.</p>
          <p>• محاولة واحدة لكل سؤال، زي الامتحان بالظبط.</p>
          <p>• {timerVisible ? 'المؤقت ظاهر: المعيار 3 دقايق لكل درجة.' : 'المؤقت مخفي، وهتعرف وقتك في الآخر بس.'}</p>
        </div>
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={async () => { await setMeta('mixedWarningSeen', true); qStart.current = Date.now(); setPhase('run'); }} data-testid="mixed-start">
          ابدأ
        </button>
      </Page>
    );
  }
  if (phase === 'done' || i >= session.length) {
    const r = results.current;
    const marks = r.reduce((s, x) => s + x.marks, 0);
    const secs = r.reduce((s, x) => s + x.seconds, 0);
    const perMark = marks ? secs / marks : 0;
    return (
      <Page>
        <TopBar title="نتيجة الجلسة" onBack={() => navigate('/')} />
        <div className="card p-5 text-center" data-testid="mixed-done">
          <p className="num text-4xl font-bold">
            {r.filter((x) => x.ok).length}/{r.length}
          </p>
          <p className="mt-1 text-muted">صح من أول محاولة</p>
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-surface-2 p-3">
            <IconClock />
            <p>
              خدت <b className="num">{fmtClock(perMark)}</b> في المتوسط لكل درجة، والمعيار <b className="num">3:00</b>
            </p>
          </div>
          <p className="mt-3 text-sm text-muted">{perMark <= 180 ? 'في الوقت! كده انت جاهز لسرعة الامتحان.' : 'أبطأ شوية من المعيار، وده طبيعي في الأول. السرعة بتيجي بالتكرار.'}</p>
        </div>
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => navigate('/')}>
          رجوع للخطة
        </button>
      </Page>
    );
  }
  const t = session[i];
  return (
    <Page>
      <TopBar
        title="الجلسة المختلطة"
        sub={`سؤال ${i + 1} من ${session.length}`}
        right={timerVisible ? <span className="num rounded-full bg-surface-2 px-3 py-1 font-bold">{fmtClock(timer.seconds)}</span> : undefined}
      />
      <ProblemRunner
        key={i}
        t={t}
        mode="mixed"
        context="mixed"
        onComplete={async (first) => {
          results.current.push({ ok: first === 'clean', seconds: (Date.now() - qStart.current) / 1000, marks: t.marks });
          qStart.current = Date.now();
          if (i + 1 >= session.length) {
            await setMeta('lastMixedAt', Date.now());
            setPhase('done');
          }
          setI(i + 1);
          window.scrollTo({ top: 0 });
        }}
      />
    </Page>
  );
}

export { Empty };
