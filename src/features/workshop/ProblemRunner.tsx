// يشغّل مسألة: يسجّل المحاولة، ويفرض "المسألة التوأم" بعد كشف الحل (لا يمكن تخطيها)
import { useEffect, useState } from 'react';
import type { ProblemTemplate } from '../../content/schemas';
import { instantiate, type Instance } from '../../engine/template';
import { supportFor, type Outcome } from '../../engine/mastery';
import { db, type AttemptMode } from '../../db/schema';
import { freshInstance, recordAttempt } from '../../services/progress';
import { Workshop, type WorkshopMode, type WorkshopResult } from './Workshop';

export interface RunnerProps {
  t: ProblemTemplate;
  mode: WorkshopMode | 'auto';
  context: AttemptMode;
  seed?: number;
  errorEntryId?: number;
  skipMastery?: boolean;
  record?: boolean;
  /** يُستدعى عند حل مسألة (أصلية أو توأم) دون كشف الحل، أو بعد أي سؤال في الجلسة المختلطة */
  onComplete: (first: Outcome, final: WorkshopResult) => void;
  canOpenWorkshop?: boolean;
  /** معرّف المهارة للتسجيل (افتراضياً معرّف القالب) */
  skillId?: string;
}

export function ProblemRunner({ t, mode, context, seed, errorEntryId, skipMastery, record = true, onComplete, canOpenWorkshop, skillId }: RunnerProps) {
  const [inst, setInst] = useState<Instance | null>(null);
  const [resolved, setResolved] = useState<WorkshopMode | null>(null);
  const [twin, setTwin] = useState(0);
  const [first, setFirst] = useState<Outcome | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const i = seed !== undefined ? instantiate(t, seed) : await freshInstance(t);
      let m: WorkshopMode = mode === 'auto' ? 'full' : mode;
      if (mode === 'auto') {
        const s = await db.skills.get(skillId ?? t.id);
        m = supportFor(s?.level ?? 0) === 'full' ? 'full' : supportFor(s?.level ?? 0) === 'partial' ? 'partial' : 'exam';
      }
      if (!alive) return;
      if (!i) setFailed(true);
      setInst(i);
      setResolved(m);
    })();
    return () => {
      alive = false;
    };
  }, [t, mode, seed]);

  if (failed) return <p className="card p-4 text-center">المسألة دي بتتجهز. جرّب واحدة تانية.</p>;
  if (!inst || !resolved) return <div className="card h-48 animate-pulse" />;

  const finish = async (r: WorkshopResult) => {
    const outcome = r.outcome;
    if (record) {
      await recordAttempt({
        skillId: skillId ?? t.id,
        seed: inst.seed,
        mode: context,
        affectsMastery: skipMastery ? false : undefined,
        outcome,
        hintsUsed: r.hintsUsed,
        attemptsCount: r.wrongCount + 1,
        secondsSpent: r.seconds,
        errorType: r.errorType,
        misconceptionId: r.misconceptionId,
        askedExternal: r.askedExternal,
        errorEntryId: twin === 0 ? errorEntryId : undefined,
      });
    }
    const firstOutcome = first ?? outcome;
    if (first === null) setFirst(outcome);
    if (outcome === 'revealed' && resolved !== 'mixed') {
      // مسألة توأم إلزامية: نفس القالب بأرقام جديدة
      const next = await freshInstance(t, [inst.seed]);
      if (next) {
        setInst(next);
        setTwin((n) => n + 1);
        return;
      }
    }
    onComplete(firstOutcome, r);
  };

  return (
    <div>
      {twin > 0 && (
        <div className="pop mb-3 rounded-2xl bg-violet-soft p-3" data-testid="twin-banner">
          <p className="font-bold">مسألة توأم</p>
          <p className="text-sm">نفس الفكرة بالظبط بأرقام جديدة. دلوقتي دورك.</p>
        </div>
      )}
      <Workshop key={`${inst.seed}-${twin}`} t={t} inst={inst} mode={resolved} onFinish={finish} canOpenWorkshop={canOpenWorkshop} />
    </div>
  );
}
