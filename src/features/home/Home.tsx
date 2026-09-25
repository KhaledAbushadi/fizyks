// "خطة النهارده": 3 مهام فقط، بالترتيب، والتطبيق هو اللي بيقرر
import { useRef } from 'react';
import type { AppData } from '../../services/appData';
import type { Task } from '../../engine/plan';
import { navigate } from '../../router';
import { fmtMarks } from '../../engine/scoreMap';
import { updateSettings } from '../../services/settings';
import { LogoMark, Wordmark } from '../../ui/Logo';
import { Page } from '../../ui/bits';
import { IconBolt, IconBook, IconBug, IconCards, IconDumbbell, IconFlame, IconShuffle, IconTarget, IconNext } from '../../ui/Icons';
import { MiniScoreBar } from '../map/ScoreMap';

function taskView(t: Task) {
  switch (t.kind) {
    case 'diagnostic':
      return { title: 'اختبار "نبدأ منين؟"', sub: '15 سؤال سريع من غير درجات', Icon: IconTarget, tone: 'bg-violet-soft text-violet', go: '/diagnostic' };
    case 'gym':
      return { title: `صالة الرياضيات: ${t.title}`, sub: 'دي اللي بتوقعك قبل الفيزيا. 10 دقايق تفرق.', Icon: IconDumbbell, tone: 'bg-teal-soft text-teal', go: `/gym/${t.skillId}` };
    case 'errors':
      return { title: `راجع أخطاءك (${t.count})`, sub: 'نفس الغلطة بأرقام جديدة، عشان ماتتكررش', Icon: IconBug, tone: 'bg-warm-soft text-warm', go: '/errors' };
    case 'cards':
      return { title: `بطاقات المراجعة (${t.count})`, sub: 'قوانين وتعريفات: دقيقتين', Icon: IconCards, tone: 'bg-amber-soft text-amber', go: '/review' };
    case 'lesson':
      return { title: t.resume ? `كمّل: ${t.title}` : `الدرس الجاي: ${t.title}`, sub: t.resume ? 'هترجع لنفس المحطة' : '15–20 دقيقة', Icon: IconBook, tone: 'bg-good-soft text-good', go: `/lesson/${t.lessonId}` };
    case 'mixed':
      return { title: 'الجلسة المختلطة', sub: 'أسئلة بشكل الامتحان من كل اللي خلصته', Icon: IconShuffle, tone: 'bg-violet-soft text-violet', go: '/mixed' };
    case 'practice':
      return { title: `ورشة: ${t.title}`, sub: 'مسألة جديدة لحد ما تتقنها', Icon: IconBolt, tone: 'bg-amber-soft text-amber', go: `/practice/${t.skillId}` };
  }
}

export function Home({ data }: { data: AppData }) {
  const taps = useRef<number[]>([]);
  const onLogo = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2500), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      void updateSettings({ showDrafts: !data.settings.showDrafts });
    }
  };
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'صباح الخير' : 'مساء الخير';
  const name = data.settings.name ? `يا ${data.settings.name}` : '';
  const backupDue = data.hasProgress && (!data.settings.lastBackupAt || Date.now() - data.settings.lastBackupAt > 7 * 86_400_000) && (!data.settings.backupReminderDismissedAt || Date.now() - data.settings.backupReminderDismissedAt > 3 * 86_400_000);

  return (
    <Page>
      <header className="flex items-center gap-3 pt-3 pb-4">
        <button type="button" onClick={onLogo} aria-label="فُكّها" data-testid="logo" className="rounded-2xl">
          <LogoMark size={44} />
        </button>
        <div className="flex-1">
          <Wordmark />
          <p className="text-sm text-muted">
            {greet} {name}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 shadow-sm" title="أيام متتالية" data-testid="streak">
          <IconFlame size={20} className={data.streak.days ? 'text-warm' : 'text-muted'} />
          <b className="num">{data.streak.days}</b>
          <span className="text-xs text-muted">يوم</span>
        </div>
      </header>

      {data.settings.showDrafts && (
        <p className="mb-3 rounded-xl bg-violet-soft px-3 py-2 text-sm" data-testid="drafts-on">
          وضع التجربة: المسودات ظاهرة (المس الشعار 5 مرات للإخفاء)
        </p>
      )}

      <button type="button" className="card mb-5 w-full p-4 text-start" onClick={() => navigate('/map')}>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="font-bold">
            أمّنت <span className="num text-2xl text-amber">{fmtMarks(data.score.secured)}</span> من 60 درجة
          </p>
          <span className="text-xs text-muted">تقديري</span>
        </div>
        <MiniScoreBar score={data.score} />
      </button>

      <h2 className="mb-2 text-lg font-bold">خطة النهارده</h2>
      {data.plan.length === 0 && (
        <div className="card p-5 text-center" data-testid="plan-empty">
          {data.visibleLessons.length === 0 ? (
            <>
              <p className="font-bold">الدروس لسه تحت المراجعة</p>
              <p className="mt-1 text-sm text-muted">مدرس الفيزياء بيراجع المحتوى قبل ما يوصلك. قريب جداً.</p>
            </>
          ) : (
            <>
              <p className="font-bold">خلّصت خطة النهارده!</p>
              <p className="mt-1 text-sm text-muted">ارتاح، أو ادخل الصالة لو عندك وقت.</p>
            </>
          )}
        </div>
      )}
      <ol className="space-y-3" data-testid="plan">
        {data.plan.map((t, i) => {
          const v = taskView(t);
          return (
            <li key={i}>
              <button type="button" onClick={() => navigate(v.go)} className="card flex w-full items-center gap-3 p-4 text-start transition active:scale-[0.99]" data-testid={`todo-${t.kind}`}>
                <span className="num flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm font-bold text-bg">{i + 1}</span>
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${v.tone}`}>
                  <v.Icon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{v.title}</span>
                  <span className="block text-sm text-muted">{v.sub}</span>
                </span>
                <IconNext size={18} className="text-muted" />
              </button>
            </li>
          );
        })}
      </ol>

      {backupDue && (
        <div className="mt-5 rounded-2xl border border-line bg-surface p-3 text-sm" data-testid="backup-reminder">
          <p>
            <b>اعمل نسخة احتياطية.</b> لو بيانات المتصفح اتمسحت، التقدم هيضيع.
          </p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="btn btn-soft h-10 min-h-0 flex-1" onClick={() => navigate('/more')}>
              اعملها دلوقتي
            </button>
            <button type="button" className="btn btn-ghost h-10 min-h-0" onClick={() => updateSettings({ backupReminderDismissedAt: Date.now() })}>
              بعدين
            </button>
          </div>
        </div>
      )}
      <p className="mt-6 text-center text-xs text-muted">الجلسة المثالية 20–30 دقيقة. يوم راحة واحد في الأسبوع مش بيكسر العدّاد.</p>
    </Page>
  );
}
