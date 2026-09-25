// بيانات الشاشة الرئيسية: خطة اليوم، العدّاد، خريطة الدرجات (كلها محسوبة من IndexedDB المحلي)
import { useLiveQuery } from 'dexie-react-hooks';
import { db, persistent } from '../db/schema';
import { content, isVisible, lessonTemplates } from '../content/loader';
import { dueToday, type StoredCard } from '../engine/scheduler';
import { isDue, type ErrorEntry } from '../engine/errorBank';
import { computeStreak, dayKey } from '../engine/streak';
import { todaysPlan, type Task } from '../engine/plan';
import { computeScoreMap } from '../engine/scoreMap';
import { isMastered, type SkillState } from '../engine/mastery';
import type { LessonProgress } from '../db/schema';
import { useSettings, type Settings } from './settings';
import { lessonMastered } from './progress';

export interface DiagnosticResult {
  at: number;
  items: { skill: string; correct: boolean }[];
  bySkill: Record<string, { correct: number; total: number }>;
}

export interface AppData {
  ready: boolean;
  settings: Settings;
  skills: Map<string, SkillState>;
  progress: Map<string, LessonProgress>;
  errors: ErrorEntry[];
  errorsDue: ErrorEntry[];
  cardsDue: StoredCard[];
  cardsTotal: number;
  diagnosticPre?: DiagnosticResult;
  diagnosticPost?: DiagnosticResult;
  weakGym: { skillId: string; title: string }[];
  streak: { days: number; restUsed: boolean };
  plan: Task[];
  score: ReturnType<typeof computeScoreMap>;
  masteredLessons: string[];
  mixedUnlocked: boolean;
  visibleLessons: typeof content.lessons;
  persistent: boolean;
  lastMixedAt?: number;
  hasProgress: boolean;
}

export function gymLevel(groupId: string, skills: Map<string, SkillState>): number {
  const g = content.gym.find((x) => x.id === groupId);
  if (!g) return 0;
  const ids = [...(g.templates ?? []).map((t) => t.id), ...(g.rearrange ?? []).map((r) => r.id)];
  if (!ids.length) return 0;
  return ids.reduce((s, id) => s + (skills.get(id)?.level ?? 0), 0) / ids.length;
}

export function useAppData(now = Date.now()): AppData {
  const settings = useSettings();
  const raw = useLiveQuery(async () => {
    const [skills, progress, errors, cards, metaRows] = await Promise.all([
      db.skills.toArray(),
      db.lessonProgress.toArray(),
      db.errorBank.toArray(),
      db.cards.toArray(),
      db.meta.bulkGet(['diagnosticPre', 'diagnosticPost', 'activeDays', 'cardsReviewed', 'lastMixedAt']),
    ]);
    return { skills, progress, errors, cards, meta: metaRows.map((r) => r?.value) };
  }, []);
  const showDrafts = settings.showDrafts;
  const visibleLessons = content.lessons.filter((l) => isVisible(l, showDrafts));
  const skills = new Map((raw?.skills ?? []).map((s) => [s.skillId, s]));
  const progress = new Map((raw?.progress ?? []).map((p) => [p.lessonId, p]));
  const [diagnosticPre, diagnosticPost, activeDays, cardsReviewed, lastMixedAt] = (raw?.meta ?? []) as [
    DiagnosticResult | undefined, DiagnosticResult | undefined, string[] | undefined, { day: string; count: number } | undefined, number | undefined,
  ];
  const errors = raw?.errors ?? [];
  const errorsDue = errors.filter((e) => isDue(e, now) && (content.templates.has(e.skillId)));
  const reviewedToday = cardsReviewed?.day === dayKey(now) ? cardsReviewed.count : 0;
  const cardsDue = dueToday(raw?.cards ?? [], now, reviewedToday);

  const weakGym = content.gym
    .filter((g) => isVisible(g, showDrafts))
    .filter((g) => {
      const r = diagnosticPre?.bySkill[g.id];
      return r && r.total > 0 && r.correct / r.total < 2 / 3 && gymLevel(g.id, skills) < 2;
    })
    .map((g) => ({ skillId: g.id, title: g.title }));

  const masteredLessons = visibleLessons.filter((l) => lessonMastered(l.id, skills)).map((l) => l.id);
  const mixedUnlocked = masteredLessons.length >= 2;
  const nextLessonObj = visibleLessons.find((l) => !progress.get(l.id)?.completedAt);
  const completed = visibleLessons.filter((l) => progress.get(l.id)?.completedAt);
  // مهارة للتدريب: أقل مستوى في الدروس المكتملة وغير المتقنة
  const practiceT = completed
    .flatMap((l) => lessonTemplates(l.id))
    .filter((t) => isVisible(t, showDrafts) && !isMastered(skills.get(t.id) ?? { skillId: t.id, level: 0, streakUnassisted: 0, spacedCorrect: false }))
    .sort((a, b) => (skills.get(a.id)?.level ?? 0) - (skills.get(b.id)?.level ?? 0) || (skills.get(a.id)?.lastAttemptAt ?? 0) - (skills.get(b.id)?.lastAttemptAt ?? 0))[0];

  const plan = todaysPlan({
    diagnosticDone: !!diagnosticPre,
    weakGym,
    errorsDue: errorsDue.length,
    cardsDue: cardsDue.length,
    nextLesson: nextLessonObj ? { lessonId: nextLessonObj.id, title: nextLessonObj.title, resume: (progress.get(nextLessonObj.id)?.stationReached ?? 1) > 1 } : undefined,
    mixedUnlocked,
    lastMixedAt,
    practice: practiceT ? { skillId: practiceT.id, title: practiceT.title } : undefined,
    now,
  });

  const exam = content.exam!;
  const score = computeScoreMap(
    exam.chapters.map((c) => ({ id: c.id, marks: c.marks, title: c.title, lessons: content.chapters.find((ch) => ch.id === c.id)?.lessons.filter((id) => visibleLessons.some((l) => l.id === id)) ?? [] })),
    (id) => masteredLessons.includes(id),
  );

  return {
    ready: raw !== undefined,
    settings,
    skills,
    progress,
    errors,
    errorsDue,
    cardsDue,
    cardsTotal: raw?.cards.length ?? 0,
    diagnosticPre,
    diagnosticPost,
    weakGym,
    streak: computeStreak(new Set(activeDays ?? []), now),
    plan,
    score,
    masteredLessons,
    mixedUnlocked,
    visibleLessons,
    persistent,
    lastMixedAt,
    hasProgress: (raw?.skills.length ?? 0) > 0 || (raw?.progress.length ?? 0) > 0,
  };
}
