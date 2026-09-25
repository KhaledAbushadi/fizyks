// كل ما يكتبه التطبيق عن تقدم الطالب يمر من هنا
import { db, getMeta, safeWrite, setMeta, type Attempt, type AttemptMode, type ErrorType } from '../db/schema';
import { applyOutcome, emptySkill, isMastered, type Outcome, type SkillState } from '../engine/mastery';
import { newError, reviewError } from '../engine/errorBank';
import { newCard } from '../engine/scheduler';
import { dayKey } from '../engine/streak';
import { content, lessonTemplates } from '../content/loader';
import { instantiate, type Instance } from '../engine/template';
import { freshSeed } from '../engine/rng';
import type { ProblemTemplate } from '../content/schemas';

export interface AttemptResult {
  skillId: string;
  seed: number;
  mode: AttemptMode;
  outcome: Outcome;
  hintsUsed: number;
  attemptsCount: number;
  secondsSpent: number;
  errorType?: ErrorType;
  misconceptionId?: string;
  askedExternal: boolean;
  /** معرّف عنصر بنك الأخطاء لو المحاولة مراجعة خطأ */
  errorEntryId?: number;
  /** الأمثلة الناقصة داخل الدرس تُسجَّل ولا تغيّر الإتقان */
  affectsMastery?: boolean;
}

const AFFECTS_MASTERY: AttemptMode[] = ['lesson', 'workshop', 'mixed', 'errors', 'gym'];

export async function markActiveDay(now = Date.now()) {
  const days = await getMeta<string[]>('activeDays', []);
  const k = dayKey(now);
  if (!days.includes(k)) await setMeta('activeDays', [...days.slice(-400), k]);
}

export async function recordAttempt(r: AttemptResult, now = Date.now()): Promise<SkillState | undefined> {
  const attempt: Attempt = {
    skillId: r.skillId,
    seed: r.seed,
    mode: r.mode,
    correct: r.outcome !== 'revealed',
    hintsUsed: r.hintsUsed,
    attemptsCount: r.attemptsCount,
    secondsSpent: Math.round(r.secondsSpent),
    errorType: r.errorType,
    misconceptionId: r.misconceptionId,
    askedExternal: r.askedExternal,
    revealed: r.outcome === 'revealed',
    createdAt: now,
  };
  let next: SkillState | undefined;
  await safeWrite(() =>
    db.transaction('rw', db.attempts, db.skills, db.errorBank, async () => {
      await db.attempts.add(attempt);
      if (r.affectsMastery ?? AFFECTS_MASTERY.includes(r.mode)) {
        const prev = (await db.skills.get(r.skillId)) ?? emptySkill(r.skillId);
        next = applyOutcome(prev, r.outcome, r.seed, now);
        await db.skills.put(next);
      }
      if (r.mode === 'errors' && r.errorEntryId !== undefined) {
        const entry = await db.errorBank.get(r.errorEntryId);
        if (entry) {
          const reviewed = reviewError(entry, r.outcome === 'clean', now);
          if (reviewed) await db.errorBank.put(reviewed);
          else await db.errorBank.delete(r.errorEntryId);
        }
      } else if (r.errorType && r.mode !== 'diagnostic') {
        // كل خطأ يدخل بنك الأخطاء ليعود كنسخة جديدة من نفس القالب
        await db.errorBank.add(newError({ skillId: r.skillId, seed: r.seed, errorType: r.errorType, misconceptionId: r.misconceptionId }, now));
      }
    }),
  );
  await markActiveDay(now);
  return next;
}

/** بطاقات الدرس تدخل المراجعة المتباعدة بعد تذكرة الخروج */
export async function unlockCards(lessonId: string, now = Date.now()) {
  const cards = content.cards.filter((c) => c.lesson === lessonId);
  await safeWrite(() =>
    db.transaction('rw', db.cards, async () => {
      for (const c of cards) {
        if (!(await db.cards.get(c.id))) await db.cards.put(newCard(c.id, now));
      }
    }),
  );
}

export function lessonMastered(lessonId: string, skills: Map<string, SkillState>): boolean {
  const ts = lessonTemplates(lessonId);
  return ts.length > 0 && ts.every((t) => {
    const s = skills.get(t.id);
    return !!s && isMastered(s);
  });
}

export function lessonProgressRatio(lessonId: string, skills: Map<string, SkillState>): number {
  const ts = lessonTemplates(lessonId);
  if (!ts.length) return 0;
  const sum = ts.reduce((acc, t) => acc + Math.min(1, (skills.get(t.id)?.level ?? 0) / 4), 0);
  return sum / ts.length;
}

/** نسخة جديدة لا تكرر أرقام آخر 10 محاولات لنفس المهارة */
export async function freshInstance(t: ProblemTemplate, avoidSeeds: number[] = []): Promise<Instance | null> {
  const recent = await db.attempts.where('skillId').equals(t.id).reverse().sortBy('createdAt');
  const recentSigs = new Set<string>();
  for (const a of recent.slice(0, 10)) {
    const inst = instantiate(t, a.seed);
    if (inst) recentSigs.add(inst.signature);
  }
  for (const s of avoidSeeds) {
    const inst = instantiate(t, s);
    if (inst) recentSigs.add(inst.signature);
  }
  let fallback: Instance | null = null;
  for (let i = 0; i < 30; i++) {
    const inst = instantiate(t, freshSeed());
    if (!inst) return null;
    fallback = fallback ?? inst;
    if (!recentSigs.has(inst.signature)) return inst;
  }
  return fallback;
}

export async function skillsMap(): Promise<Map<string, SkillState>> {
  const all = await db.skills.toArray();
  return new Map(all.map((s) => [s.skillId, s]));
}
