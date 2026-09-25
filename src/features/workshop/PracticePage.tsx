// صفحة الورشة لمهارة واحدة: مسألة ورا مسألة، والدعم يتسحب تلقائياً
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { templateById } from '../../content/loader';
import { db } from '../../db/schema';
import { supportFor } from '../../engine/mastery';
import { Empty, Page, TopBar } from '../../ui/bits';
import { ProblemRunner } from './ProblemRunner';
import type { WorkshopMode } from './Workshop';

const SUPPORT_NAME = { full: 'ورشة كاملة: 5 خطوات', partial: 'ورشة مختصرة', exam: 'شكل الامتحان' };

export function PracticePage({ id, query }: { id: string; query: URLSearchParams }) {
  const t = templateById(id);
  const skill = useLiveQuery(() => db.skills.get(id), [id]);
  const [round, setRound] = useState(0);
  const [last, setLast] = useState<string | null>(null);
  if (!t) return <Page><TopBar title="الورشة" /><Empty title="المسألة مش موجودة" /></Page>;
  const forced = query.get('mode') as WorkshopMode | null;
  const seed = query.get('seed');
  const level = skill?.level ?? 0;
  return (
    <Page>
      <TopBar title={t.title} sub={`${SUPPORT_NAME[supportFor(level)]} · المستوى ${level} من 5`} right={<LevelDots level={level} />} />
      {last && <p className="pop mb-3 rounded-xl bg-good-soft px-3 py-2 text-sm">{last}</p>}
      <ProblemRunner
        key={round}
        t={t}
        mode={forced ?? 'auto'}
        seed={seed && round === 0 ? Number(seed) : undefined}
        context="workshop"
        onComplete={(first) => {
          setLast(first === 'clean' ? 'من أول مرة! المستوى زاد.' : first === 'assisted' ? 'اتحلت بمساعدة. المرة الجاية من غير تلميح.' : 'عديت التوأم. كمّل كده.');
          setRound((r) => r + 1);
          window.scrollTo({ top: 0 });
        }}
      />
    </Page>
  );
}

function LevelDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1" aria-label={`المستوى ${level}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-2.5 w-2.5 rounded-full ${i <= level ? 'bg-amber' : 'bg-line'}`} />
      ))}
    </div>
  );
}
