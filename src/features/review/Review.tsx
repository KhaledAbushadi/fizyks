// المراجعة المتباعدة: بطاقة، اقلبها، وقيّم نفسك بـ3 أزرار بس
import { useState } from 'react';
import type { AppData } from '../../services/appData';
import { content } from '../../content/loader';
import { db, getMeta, safeWrite, setMeta } from '../../db/schema';
import { gradeCard, type Answer3 } from '../../engine/scheduler';
import { dayKey } from '../../engine/streak';
import { markActiveDay } from '../../services/progress';
import { navigate } from '../../router';
import { Empty, Page, TopBar } from '../../ui/bits';
import { RichText } from '../../ui/RichText';
import { Tex } from '../../ui/Math';

const KIND: Record<string, string> = { law: 'قانون', definition: 'تعريف', unit: 'وحدة', symbol: 'رمز' };

export function Review({ data }: { data: AppData }) {
  const [queue] = useState(() => data.cardsDue.map((c) => c.cardId));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  if (!data.ready) return <Page><div className="card mt-6 h-40 animate-pulse" /></Page>;
  const id = queue[i];
  const card = content.cards.find((c) => c.id === id);
  const answer = async (a: Answer3) => {
    const stored = await db.cards.get(id);
    if (stored) await safeWrite(() => db.cards.put(gradeCard(stored, a, Date.now())));
    const k = dayKey(Date.now());
    const cur = await getMeta<{ day: string; count: number }>('cardsReviewed', { day: k, count: 0 });
    await setMeta('cardsReviewed', { day: k, count: (cur.day === k ? cur.count : 0) + 1 });
    await markActiveDay();
    setFlipped(false);
    setI(i + 1);
  };
  return (
    <Page>
      <TopBar title="بطاقات المراجعة" sub={queue.length ? `${Math.min(i + 1, queue.length)} من ${queue.length} · الحد اليومي 15` : undefined} onBack={() => navigate('/')} />
      {!card ? (
        <Empty title={queue.length ? 'خلّصت بطاقات النهارده!' : 'مفيش بطاقات مستحقة دلوقتي'}>
          {queue.length ? 'هنرجعلك بيها في الوقت المناسب قبل ما تنساها.' : 'البطاقات بتتضاف لما تخلص تذكرة الخروج في أي درس.'}
        </Empty>
      ) : (
        <div>
          <button type="button" onClick={() => setFlipped(true)} className="card flex min-h-72 w-full flex-col items-center justify-center p-6 text-center" data-testid="flashcard">
            <span className="mb-3 rounded-full bg-surface-2 px-3 py-0.5 text-xs text-muted">{KIND[card.kind]}</span>
            <p className="text-xl leading-9 font-bold">
              <RichText text={card.front} />
            </p>
            {card.frontLatex && (
              <p className="mt-3 text-2xl">
                <Tex tex={card.frontLatex} />
              </p>
            )}
            {flipped ? (
              <div className="fade-in mt-5 w-full border-t border-line pt-4">
                <p className="text-lg leading-9">
                  <RichText text={card.back} />
                </p>
                {card.backLatex && (
                  <p className="mt-3 text-2xl">
                    <Tex tex={card.backLatex} />
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">فكّر في الإجابة، وبعدين المس البطاقة</p>
            )}
          </button>
          {flipped && (
            <div className="fade-in mt-4 grid grid-cols-3 gap-2">
              <button type="button" className="btn border-warm/40 bg-warm-soft" onClick={() => answer('again')} data-testid="card-again">ماعرفتش</button>
              <button type="button" className="btn border-amber/40 bg-amber-soft" onClick={() => answer('hard')}>بصعوبة</button>
              <button type="button" className="btn border-good/40 bg-good-soft" onClick={() => answer('good')} data-testid="card-good">سهل</button>
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
