// خريطة الدرجات: 60 خانة ملوّنة بالفصول، كل خانة درجة، تمتلئ بإتقان دروس الفصل
import type { AppData } from '../../services/appData';
import { computeScoreMap, fmtMarks } from '../../engine/scoreMap';
import { content, lessonTemplates } from '../../content/loader';
import { lessonProgressRatio } from '../../services/progress';
import { Page, TopBar } from '../../ui/bits';
import { navigate } from '../../router';

const CH_COLOR: Record<number, string> = { 1: 'var(--ch1)', 2: 'var(--ch2)', 3: 'var(--ch3)', 4: 'var(--ch4)', 5: 'var(--ch5)', 6: 'var(--ch6)', 78: 'var(--ch78)' };

type Score = ReturnType<typeof computeScoreMap>;

/** يحوّل الخريطة إلى 60 خانة: لكل خانة لون فصلها ونسبة امتلائها */
function cells(score: Score) {
  const out: { ch: number; fill: number }[] = [];
  for (const c of score.chapters) {
    for (let k = 0; k < c.marks; k++) out.push({ ch: c.id, fill: Math.max(0, Math.min(1, c.secured - k)) });
  }
  return out;
}

export function MiniScoreBar({ score }: { score: Score }) {
  return (
    <div className="flex h-4 gap-[2px]" dir="rtl" aria-hidden="true">
      {cells(score).map((c, i) => (
        <div key={i} className="flex-1 rounded-[2px]" style={{ background: c.fill ? CH_COLOR[c.ch] : `color-mix(in srgb, ${CH_COLOR[c.ch]} 18%, transparent)` }} />
      ))}
    </div>
  );
}

export function ScoreMapPage({ data }: { data: AppData }) {
  const { score } = data;
  const ch1 = score.chapters.find((c) => c.id === 1);
  const nextLesson = ch1?.lessons.find((l) => !l.mastered);
  return (
    <Page>
      <TopBar title="خريطة درجاتي" sub="كل خانة = درجة في امتحان آخر السنة" onBack={() => navigate('/')} />
      <section className="card p-4">
        <p className="text-lg">
          أمّنت <b className="num text-3xl text-amber" data-testid="secured">{fmtMarks(score.secured)}</b> درجة من <b className="num">60</b>.
        </p>
        {nextLesson && ch1 && <p className="mt-1 text-[15px] text-ink-2">الدرس الجاي يقرّبك {fmtMarks(ch1.perLesson)} درجة كمان.</p>}
        <div className="mt-4 grid grid-cols-10 gap-1.5" dir="rtl" data-testid="score-grid">
          {cells(score).map((c, i) => (
            <div
              key={i}
              className="aspect-square rounded-md border"
              title={`الفصل ${c.ch === 78 ? '7 و8' : c.ch}`}
              data-filled={c.fill >= 1 ? '1' : c.fill > 0 ? 'partial' : '0'}
              style={{
                borderColor: `color-mix(in srgb, ${CH_COLOR[c.ch]} 55%, transparent)`,
                background: c.fill >= 1 ? CH_COLOR[c.ch] : c.fill > 0 ? `linear-gradient(to left, ${CH_COLOR[c.ch]} ${c.fill * 100}%, color-mix(in srgb, ${CH_COLOR[c.ch]} 14%, transparent) ${c.fill * 100}%)` : `color-mix(in srgb, ${CH_COLOR[c.ch]} 14%, transparent)`,
              }}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">تقريبي، حسب وزن الفصل في امتحان 2026.</p>
      </section>

      <h2 className="mt-5 mb-2 font-bold">الفصول</h2>
      <div className="space-y-2">
        {score.chapters.map((c) => {
          const meta = content.exam?.chapters.find((x) => x.id === c.id);
          return (
            <div key={c.id} className="card flex items-center gap-3 p-3">
              <span className="h-10 w-2 rounded-full" style={{ background: CH_COLOR[c.id] }} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {c.id === 78 ? 'الفصلان 7 و8' : `الفصل ${c.id}`}: {meta?.title}
                </p>
                <p className="text-sm text-muted">{c.available ? `${c.lessons.filter((l) => l.mastered).length} من ${c.lessons.length} دروس متقنة` : 'قريباً'}</p>
              </div>
              <b className="num">
                {fmtMarks(c.secured)}/{c.marks}
              </b>
            </div>
          );
        })}
      </div>

      {ch1 && ch1.available && (
        <>
          <h2 className="mt-5 mb-2 font-bold">مهارات الفصل الأول</h2>
          <div className="card space-y-3 p-4" data-testid="skills-chart">
            {ch1.lessons.map((l) => {
              const lesson = content.lessons.find((x) => x.id === l.id)!;
              const ratio = lessonProgressRatio(l.id, data.skills);
              const n = lessonTemplates(l.id).length;
              return (
                <button key={l.id} type="button" className="block w-full text-start" onClick={() => navigate(`/lesson/${l.id}`)}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold">{lesson.title}</span>
                    <span className="text-muted">{l.mastered ? 'متقن' : `${Math.round(ratio * 100)}% · ${n} مهارات`}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(3, ratio * 100)}%`, background: l.mastered ? 'var(--good)' : 'var(--ch1)' }} />
                  </div>
                </button>
              );
            })}
            <p className="text-xs text-muted">"متقن" = مستوى 4 من 5، وإجابتين نظيفتين متتاليتين، وإجابة صح بعد يومين على الأقل.</p>
          </div>
        </>
      )}
    </Page>
  );
}
