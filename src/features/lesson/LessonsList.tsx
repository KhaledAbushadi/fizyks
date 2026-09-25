// الدروس كدائرة كهربية: كل درس نقطة تنوّر لما تتقنه
import type { AppData } from '../../services/appData';
import { content } from '../../content/loader';
import { lessonProgressRatio } from '../../services/progress';
import { navigate } from '../../router';
import { Empty, Page } from '../../ui/bits';
import { IconCheck, IconLock } from '../../ui/Icons';

const TONES = ['var(--amber)', 'var(--sky)', 'var(--pink)', 'var(--teal)', 'var(--violet)', 'var(--warm)', 'var(--good)', 'var(--hero-b)'];

export function LessonsList({ data }: { data: AppData }) {
  const chapter = content.chapters[0];
  const lessons = data.visibleLessons;
  return (
    <Page>
      <header className="pt-4 pb-3">
        <p className="text-sm font-bold text-amber">الفصل الأول · {chapter?.marks} درجات</p>
        <h1 className="text-2xl leading-snug font-bold">{chapter?.title}</h1>
        <p className="mt-1 text-[15px] text-ink-2">{chapter?.analogy}</p>
      </header>
      {lessons.length === 0 && <Empty title="الدروس تحت المراجعة">مدرس الفيزياء بيراجع المحتوى قبل ما يوصلك.</Empty>}
      <ol className="relative space-y-3 ps-7" data-testid="lessons">
        <span className="absolute top-4 bottom-4 start-[13px] w-[3px] rounded-full bg-line" aria-hidden="true" />
        {lessons.map((l, idx) => {
          const tone = TONES[idx % TONES.length];
          const p = data.progress.get(l.id);
          const mastered = data.masteredLessons.includes(l.id);
          const ratio = lessonProgressRatio(l.id, data.skills);
          const started = !!p;
          return (
            <li key={l.id} className="relative">
              <span
                className={`absolute top-5 -start-7 flex h-7 w-7 items-center justify-center rounded-full border-[3px] ${mastered ? 'glow border-spark bg-spark text-[#1b1300]' : p?.completedAt ? 'border-good bg-good-soft text-good' : 'bg-surface'}`}
                style={mastered || p?.completedAt ? undefined : { borderColor: tone }}
                aria-hidden="true"
              >
                {mastered || p?.completedAt ? <IconCheck size={14} /> : <span className="num text-xs font-bold" style={{ color: tone }}>{l.order}</span>}
              </span>
              <button type="button" className="card w-full overflow-hidden p-4 text-start" onClick={() => navigate(`/lesson/${l.id}`)} data-testid={`lesson-${l.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{l.title}</p>
                    <p className="text-sm text-muted">{l.subtitle}</p>
                  </div>
                  {l.status === 'draft' && <span className="rounded-md bg-violet-soft px-2 py-0.5 text-xs text-violet">مسودة</span>}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full" style={{ width: `${Math.round(ratio * 100)}%`, background: tone }} />
                  </div>
                  <span className="text-xs text-muted">{mastered ? 'متقن' : p?.completedAt ? 'بتتدرب' : started ? `محطة ${p!.stationReached}/8` : `${l.minutes} دقيقة`}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
      {data.visibleLessons.length > 0 && (
        <div className="mt-5 card flex items-center gap-3 p-4 opacity-70">
          <IconLock />
          <p className="text-sm">الفصول 2–8 هتتضاف بنفس الطريقة. المحرك جاهز، ناقص المحتوى بس.</p>
        </div>
      )}
    </Page>
  );
}
