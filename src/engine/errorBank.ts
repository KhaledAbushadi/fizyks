// بنك الأخطاء: يعود الخطأ كنسخة جديدة بعد يوم، ثم 3 أيام، ثم 7
import { DAY } from './mastery';

export const INTERVALS_DAYS = [1, 3, 7];

export interface ErrorEntry {
  id?: number;
  skillId: string;
  seed: number;
  errorType: 'concept' | 'misread' | 'calc' | 'unit';
  misconceptionId?: string;
  stage: number; // 0/1/2
  successCount: number;
  dueAt: number;
  createdAt: number;
  lastReviewAt?: number;
}

export function newError(e: Omit<ErrorEntry, 'stage' | 'successCount' | 'dueAt' | 'createdAt'>, now: number): ErrorEntry {
  return { ...e, stage: 0, successCount: 0, dueAt: now + INTERVALS_DAYS[0] * DAY, createdAt: now };
}

/** بعد مراجعة خطأ: يُحذف (null) بعد حلّه صحيحاً مرتين في موعدين مختلفين */
export function reviewError(e: ErrorEntry, correct: boolean, now: number): ErrorEntry | null {
  const successCount = correct ? e.successCount + 1 : e.successCount;
  if (successCount >= 2) return null;
  const stage = Math.min(2, e.stage + 1);
  return { ...e, successCount, stage, dueAt: now + INTERVALS_DAYS[stage] * DAY, lastReviewAt: now };
}

export function isDue(e: ErrorEntry, now: number): boolean {
  return e.dueAt <= now;
}
