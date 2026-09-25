// عرض الحل بالخطوات الخمس
import type { ProblemTemplate } from '../../content/schemas';
import type { Instance } from '../../engine/template';
import { RichText } from '../../ui/RichText';
import { Diagram } from '../../ui/diagrams';

export const STEP_LABELS: Record<string, string> = { draw: 'ارسم', classify: 'صنّف', inventory: 'اجرد', compute: 'احسب', check: 'افحص' };
const ORDER = ['draw', 'classify', 'inventory', 'compute', 'check'] as const;
const TONES = ['bg-teal-soft text-teal', 'bg-violet-soft text-violet', 'bg-amber-soft text-amber', 'bg-warm-soft text-warm', 'bg-good-soft text-good'];

export function SolutionStep({ t, inst, step, index }: { t: ProblemTemplate; inst: Instance; step: (typeof ORDER)[number]; index: number }) {
  const text = t.solutionSteps[step];
  if (!text) return null;
  return (
    <li className="fade-in flex gap-3">
      <span className={`mt-0.5 flex h-8 min-w-14 items-center justify-center rounded-lg px-2 text-sm font-bold ${TONES[index]}`}>{STEP_LABELS[step]}</span>
      <div className="min-w-0 flex-1 leading-8">
        <RichText text={text} inst={inst} />
        {step === 'draw' && t.workshop && (
          <div className="mt-2 max-w-64 rounded-xl border border-line bg-surface p-1">
            <Diagram id={t.workshop.correctDiagram} />
          </div>
        )}
      </div>
    </li>
  );
}

export function Solution({ t, inst, upTo = 5 }: { t: ProblemTemplate; inst: Instance; upTo?: number }) {
  return (
    <ol className="space-y-3" data-testid="solution">
      {ORDER.slice(0, upTo).map((s, i) => (
        <SolutionStep key={s} t={t} inst={inst} step={s} index={i} />
      ))}
    </ol>
  );
}

export { ORDER as STEP_ORDER };
