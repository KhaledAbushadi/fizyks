// قواعد الإتقان (القسم 5.3): المستوى 0–5 يرفع الدعم تلقائياً
export const DAY = 24 * 60 * 60 * 1000;

export interface SkillState {
  skillId: string;
  level: number; // 0..5
  streakUnassisted: number;
  lastSeed?: number;
  lastAttemptAt?: number;
  lastCorrectAt?: number;
  spacedCorrect: boolean;
  masteredAt?: number;
}

export type Outcome = 'clean' | 'assisted' | 'revealed';

export function emptySkill(skillId: string): SkillState {
  return { skillId, level: 0, streakUnassisted: 0, spacedCorrect: false };
}

/**
 * - صحيحة من أول محاولة دون تلميح: +1
 * - صحيحة بعد تلميح أو أكثر: 0
 * - كشف الحل: −1 (الحد الأدنى 0)
 * - "أتقن" = مستوى ≥ 4 + إجابتان نظيفتان متتاليتان على نسختين مختلفتين + إجابة صحيحة بعد يومين على الأقل من آخر محاولة
 */
export function applyOutcome(prev: SkillState, outcome: Outcome, seed: number, now: number): SkillState {
  const s: SkillState = { ...prev };
  const gapOk = prev.lastAttemptAt !== undefined && now - prev.lastAttemptAt >= 2 * DAY;
  if (outcome === 'clean') {
    s.level = Math.min(5, s.level + 1);
    s.streakUnassisted = prev.lastSeed === seed ? prev.streakUnassisted : prev.streakUnassisted + 1;
    s.lastCorrectAt = now;
    if (gapOk) s.spacedCorrect = true;
  } else if (outcome === 'assisted') {
    s.streakUnassisted = 0;
    s.lastCorrectAt = now;
    if (gapOk) s.spacedCorrect = true;
  } else {
    s.level = Math.max(0, s.level - 1);
    s.streakUnassisted = 0;
  }
  s.lastSeed = seed;
  s.lastAttemptAt = now;
  if (isMastered(s)) {
    s.masteredAt = s.masteredAt ?? now;
  } else if (s.level < 3) {
    s.masteredAt = undefined;
  }
  return s;
}

export function isMastered(s: SkillState): boolean {
  return s.level >= 4 && s.streakUnassisted >= 2 && s.spacedCorrect;
}

export type Support = 'full' | 'partial' | 'exam';

/** شكل الورشة حسب المستوى */
export function supportFor(level: number): Support {
  if (level <= 1) return 'full';
  if (level <= 3) return 'partial';
  return 'exam';
}
