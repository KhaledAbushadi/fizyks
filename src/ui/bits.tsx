// قطع واجهة صغيرة مشتركة
import { useEffect, useState, type ReactNode } from 'react';
import { back } from '../router';
import { IconBack } from './Icons';
import { RichText } from './RichText';
import { Tex } from './Math';
import type { SymbolInfo } from '../content/schemas';

export function TopBar({ title, sub, onBack, right }: { title: string; sub?: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-3 flex items-center gap-2 border-b border-line bg-bg/90 px-3 py-2 backdrop-blur">
      <button type="button" aria-label="رجوع" className="tap flex items-center justify-center rounded-xl" onClick={onBack ?? (() => back())}>
        <IconBack />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg leading-tight font-bold">{title}</h1>
        {sub && <p className="truncate text-sm text-muted">{sub}</p>}
      </div>
      {right}
    </header>
  );
}

export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto w-full max-w-xl px-4 pt-2 safe-bottom ${className}`}>{children}</main>;
}

export function Hint({ level, text, children }: { level: number; text?: string; children?: ReactNode }) {
  const labels = ['', 'تلميح 1: وجّه نفسك', 'تلميح 2: المعطى الخفي', 'تلميح 3: نص الحسبة'];
  return (
    <div className="fade-in mt-3 rounded-2xl border-s-4 border-teal bg-teal-soft p-3" role="status" data-testid={`hint-${level}`}>
      <p className="mb-1 text-sm font-bold text-teal">{labels[level] ?? 'تلميح'}</p>
      {text && <RichText text={text} />}
      {children}
    </div>
  );
}

export function Nudge({ tone = 'warm', children, testid }: { tone?: 'warm' | 'good' | 'info'; children: ReactNode; testid?: string }) {
  const cls = tone === 'good' ? 'bg-good-soft border-good' : tone === 'info' ? 'bg-violet-soft border-violet' : 'bg-warm-soft border-warm';
  return (
    <div className={`pop mt-3 rounded-2xl border-s-4 p-3 ${cls}`} role="status" data-testid={testid}>
      {children}
    </div>
  );
}

export function SymbolCard({ s }: { s: SymbolInfo }) {
  const [open, setOpen] = useState(false);
  return (
    <button type="button" onClick={() => setOpen((o) => !o)} className="card tap w-full p-3 text-start transition" aria-expanded={open}>
      <div className="flex items-center gap-3">
        <span className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-amber-soft px-2 text-xl">
          <Tex tex={s.latex} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{s.name}</p>
          <p className="text-sm text-muted">
            <RichText text={s.unit} />
          </p>
        </div>
        <span className="text-sm text-muted">{open ? 'إخفاء' : 'المس'}</span>
      </div>
      {open && (
        <div className="fade-in mt-2 space-y-1 border-t border-line pt-2 text-[15px]">
          <p>
            <b>معناه:</b> <RichText text={s.meaning} />
          </p>
          <p>
            <b>مثال:</b> <RichText text={s.example} />
          </p>
        </div>
      )}
    </button>
  );
}

export function BookBox({ items }: { items: { title: string; text: string; latex?: string }[] }) {
  return (
    <section className="rounded-2xl border-2 border-dashed border-ink-2/40 bg-surface p-4" data-testid="book-box">
      <p className="mb-2 flex items-center gap-2 text-sm font-bold text-ink-2">
        <span className="rounded-md bg-ink px-2 py-0.5 text-bg">زي ما في الكتاب</span> احفظ النص ده بالحرف
      </p>
      <div className="space-y-3">
        {items.map((b) => (
          <div key={b.title}>
            <p className="font-bold">{b.title}</p>
            <p className="leading-8">
              <RichText text={b.text} />
            </p>
            {b.latex && (
              <div className="mt-1 text-center text-xl">
                <Tex tex={b.latex} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function StepDots({ total, current, labels }: { total: number; current: number; labels?: string[] }) {
  return (
    <div className="mb-3 flex items-center gap-1.5" aria-label={`الخطوة ${current + 1} من ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex-1">
          <div className={`h-1.5 rounded-full transition-all ${i < current ? 'bg-good' : i === current ? 'bg-amber' : 'bg-line'}`} />
          {labels && <p className={`mt-1 text-center text-[11px] ${i === current ? 'font-bold text-ink' : 'text-muted'}`}>{labels[i]}</p>}
        </div>
      ))}
    </div>
  );
}

export function useTimer(running = true) {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);
  return { seconds: (now - start) / 1000, start };
}

export function fmtClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card mt-6 p-6 text-center">
      <p className="text-lg font-bold">{title}</p>
      {children && <div className="mt-2 text-muted">{children}</div>}
    </div>
  );
}
