// نقل الحدود: الطالب يبني الطرف التاني من المعادلة بلمس البلاطات
import { useMemo, useState } from 'react';
import type { RearrangeItem } from '../../content/schemas';
import { mulberry32, shuffle } from '../../engine/rng';
import { Tex } from '../../ui/Math';
import { Nudge } from '../../ui/bits';

export function Rearrange({ item, seed, single = false, onDone }: { item: RearrangeItem; seed: number; single?: boolean; onDone: (clean: boolean, wrongs: number) => void }) {
  const tiles = useMemo(() => shuffle(mulberry32(seed), item.tiles.filter((t) => t !== item.target)), [item, seed]);
  const [built, setBuilt] = useState<number[]>([]);
  const [wrongs, setWrongs] = useState(0);
  const [state, setState] = useState<'idle' | 'right' | 'wrong' | 'failed'>('idle');
  const check = () => {
    const expr = built.map((i) => tiles[i]);
    if (expr.join(' ') === item.answer.join(' ')) {
      setState('right');
      return;
    }
    const w = wrongs + 1;
    setWrongs(w);
    if (single || w >= 3) setState('failed');
    else {
      setState('wrong');
      setBuilt([]);
    }
  };
  return (
    <div data-testid="rearrange">
      <section className="card mb-3 p-4 text-center">
        <p className="text-sm text-muted">القانون</p>
        <p className="my-1 text-2xl">
          <Tex tex={item.law} />
        </p>
        <p className="mt-2">
          اسحب <Tex tex={item.target} /> لوحده في ناحية:
        </p>
      </section>
      <div className="card mb-3 flex min-h-16 flex-wrap items-center justify-center gap-2 p-3 text-2xl" dir="ltr" data-testid="rearrange-built">
        <Tex tex={`${item.target} =`} />
        {built.length === 0 && <span className="text-base text-muted">المس البلاطات تحت</span>}
        {built.map((i, k) => (
          <button key={k} type="button" className="tap rounded-xl bg-amber-soft px-3" onClick={() => state === 'idle' || state === 'wrong' ? setBuilt(built.filter((_, j) => j !== k)) : undefined}>
            <Tex tex={tiles[i]} />
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2" dir="ltr">
        {tiles.map((t, i) => (
          <button key={i} type="button" data-tile={t} disabled={built.includes(i) || state === 'right' || state === 'failed'} className="tap min-w-14 rounded-2xl border-2 border-line bg-surface px-3 text-xl disabled:opacity-30" onClick={() => { setBuilt([...built, i]); if (state === 'wrong') setState('idle'); }}>
            <Tex tex={t} />
          </button>
        ))}
      </div>
      {state === 'wrong' && <Nudge>قربت. {item.hint}</Nudge>}
      {state === 'failed' && (
        <Nudge tone="info">
          <p>
            الصح: <Tex tex={`${item.target} = ${item.answer.join(' ')}`} />
          </p>
          <p className="text-sm">{item.hint}</p>
        </Nudge>
      )}
      {state === 'right' && <Nudge tone="good">بالظبط!</Nudge>}
      {state === 'right' || state === 'failed' ? (
        <button type="button" className="btn btn-primary mt-3 w-full" onClick={() => onDone(state === 'right' && wrongs === 0, wrongs)} data-testid="rearrange-next">
          التالي
        </button>
      ) : (
        <button type="button" className="btn btn-primary mt-3 w-full" disabled={!built.length} onClick={check} data-testid="rearrange-check">
          تحقق
        </button>
      )}
    </div>
  );
}
