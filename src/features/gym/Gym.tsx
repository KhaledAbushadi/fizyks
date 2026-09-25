// صالة الرياضيات: الأسس، البادئات، نقل الحدود، الآلة الحاسبة
import { useMemo, useState } from 'react';
import type { AppData } from '../../services/appData';
import { gymLevel } from '../../services/appData';
import { content, isVisible } from '../../content/loader';
import { navigate } from '../../router';
import { freshSeed } from '../../engine/rng';
import { recordAttempt } from '../../services/progress';
import { Empty, Page, TopBar } from '../../ui/bits';
import { RichText } from '../../ui/RichText';
import { IconDumbbell } from '../../ui/Icons';
import { ProblemRunner } from '../workshop/ProblemRunner';
import { Rearrange } from './Rearrange';

export function GymList({ data }: { data: AppData }) {
  const skills = content.gym.filter((g) => isVisible(g, data.settings.showDrafts));
  return (
    <Page>
      <header className="pt-4 pb-3">
        <p className="text-sm font-bold text-teal">صالة الرياضيات</p>
        <h1 className="text-2xl font-bold">العضلات اللي الفيزيا محتاجاها</h1>
        <p className="mt-1 text-[15px] text-ink-2">أغلب الغلط في الفيزيا بيبدأ من هنا: أس، أو مللي، أو نقل حد.</p>
      </header>
      {skills.length === 0 && <Empty title="الصالة تحت المراجعة" />}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        {skills.map((g) => {
          const lvl = gymLevel(g.id, data.skills);
          const weak = data.weakGym.some((w) => w.skillId === g.id);
          return (
            <button key={g.id} type="button" className="card p-4 text-start" onClick={() => navigate(`/gym/${g.id}`)} data-testid={`gym-${g.id}`}>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-soft text-teal">
                  <IconDumbbell />
                </span>
                {weak && <span className="rounded-md bg-warm-soft px-2 py-0.5 text-xs text-warm">محتاجة تمرين</span>}
              </div>
              <p className="mt-2 font-bold">{g.title}</p>
              <p className="text-sm text-muted">{g.subtitle}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full bg-teal" style={{ width: `${Math.min(100, (lvl / 4) * 100)}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </Page>
  );
}

export function GymSkillPage({ id, data }: { id: string; data: AppData }) {
  const g = content.gym.find((x) => x.id === id);
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [clean, setClean] = useState(0);
  const pool = useMemo(() => (g ? [...(g.templates ?? []).map((t) => ({ kind: 't' as const, t })), ...(g.rearrange ?? []).map((r) => ({ kind: 'r' as const, r }))] : []), [g]);
  const pick = useMemo(() => {
    if (!pool.length) return null;
    // الأضعف أولاً
    const scored = pool.map((p) => ({ p, lvl: data.skills.get(p.kind === 't' ? p.t.id : p.r.id)?.level ?? 0, rnd: Math.random() }));
    scored.sort((a, b) => a.lvl - b.lvl || a.rnd - b.rnd);
    return scored[Math.floor(Math.random() * Math.min(2, scored.length))].p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, pool]);
  if (!g) return <Page><TopBar title="الصالة" /><Empty title="المهارة مش موجودة" /></Page>;
  const next = (ok: boolean) => {
    if (ok) setClean((c) => c + 1);
    setRound((r) => r + 1);
    window.scrollTo({ top: 0 });
  };
  return (
    <Page>
      <TopBar title={g.title} sub={started ? `صح من أول مرة: ${clean}` : g.subtitle} onBack={() => navigate('/gym')} />
      {!started ? (
        <div className="fade-in">
          <div className="card space-y-3 p-4 text-lg leading-9">
            {g.intro.map((p) => (
              <p key={p}>
                <RichText text={p} />
              </p>
            ))}
          </div>
          <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => setStarted(true)} data-testid="gym-start">
            يلا نتمرّن
          </button>
        </div>
      ) : pick?.kind === 't' ? (
        <ProblemRunner key={round} t={pick.t} mode={(data.skills.get(pick.t.id)?.level ?? 0) >= 4 ? 'exam' : 'full'} context="gym" onComplete={(first) => next(first === 'clean')} />
      ) : pick?.kind === 'r' ? (
        <Rearrange
          key={round}
          item={pick.r}
          seed={freshSeed()}
          onDone={async (ok, wrongs) => {
            await recordAttempt({ skillId: pick.r.id, seed: 0, mode: 'gym', outcome: ok ? 'clean' : wrongs >= 3 ? 'revealed' : 'assisted', hintsUsed: Math.min(wrongs, 3), attemptsCount: wrongs + 1, secondsSpent: 0, askedExternal: false });
            next(ok);
          }}
        />
      ) : null}
    </Page>
  );
}
