// نص المحتوى: عربي + $معادلات$ + **خط عريض** + متغيرات قابلة للّمس (خطوة "اجرد")
import { Fragment, type ReactNode } from 'react';
import { segments, type Instance } from '../engine/template';
import { Tex } from './Math';
import { Num } from './Num';

/**
 * يعزل أي تعبير لاتيني فيه أكتر من رمز (زي "R + r" أو "V_B − I r") في <bdi dir="ltr">
 * حتى لا ينقلب ترتيبه داخل الجملة العربية.
 */
const LATIN_RUN = /[A-Za-zΩΣρσℓε][A-Za-z0-9_′'ΩΣρσℓε.]*(?:\s*[+\-−×÷=/]\s*[A-Za-z0-9_′'ΩΣρσℓε.()]+|\s+[A-Za-z0-9_′'ΩΣρσℓε()]+(?=[\s.,،:؟)]|$))+/g;

export function isolateLatin(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LATIN_RUN)) {
    const run = m[0].replace(/[.]+$/, '');
    if (m.index! > last) out.push(text.slice(last, m.index));
    out.push(
      <bdi key={keyBase + 'l' + m.index} dir="ltr">
        {run}
      </bdi>,
    );
    last = m.index! + run.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function bold(text: string, keyBase: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={keyBase + i}>{isolateLatin(p.slice(2, -2), keyBase + i)}</strong> : <Fragment key={keyBase + i}>{isolateLatin(p, keyBase + i)}</Fragment>,
  );
}

export interface VarTap {
  onTap?: (name: string) => void;
  used?: Set<string>;
  tappable?: boolean;
  highlight?: boolean;
}

export function RichText({ text, inst = null, vars, className = '' }: { text: string; inst?: Instance | null; vars?: VarTap; className?: string }) {
  const segs = segments(text, inst);
  return (
    <span className={className}>
      {segs.map((s, i) => {
        if (s.type === 'math') return <Tex key={i} tex={s.latex} />;
        if (s.type === 'text') return <Fragment key={i}>{bold(s.text, `t${i}-`)}</Fragment>;
        const chip = vars?.highlight || vars?.tappable;
        if (!chip)
          return (
            <span key={i} data-var={s.name} data-value={s.value}>
              <Num value={s.value} plain={s.plain} className="font-semibold" />
            </span>
          );
        return (
          <button
            key={i}
            type="button"
            className="chip-var tap align-middle"
            data-tappable={vars?.tappable ? 'true' : 'false'}
            data-used={vars?.used?.has(s.name) ? 'true' : 'false'}
            data-var={s.name}
            data-value={s.value}
            onClick={() => vars?.onTap?.(s.name)}
            disabled={!vars?.tappable}
          >
            <Num value={s.value} plain={s.plain} />
          </button>
        );
      })}
    </span>
  );
}
