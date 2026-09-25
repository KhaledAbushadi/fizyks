// "خطة النهارده": التطبيق يقرر للطالب من أين يبدأ (3 مهام فقط)
export type Task =
  | { kind: 'gym'; skillId: string; title: string }
  | { kind: 'errors'; count: number }
  | { kind: 'cards'; count: number }
  | { kind: 'lesson'; lessonId: string; title: string; resume: boolean }
  | { kind: 'mixed' }
  | { kind: 'practice'; skillId: string; title: string }
  | { kind: 'diagnostic' };

export interface PlanInput {
  diagnosticDone: boolean;
  weakGym: { skillId: string; title: string }[];
  errorsDue: number;
  cardsDue: number;
  nextLesson?: { lessonId: string; title: string; resume: boolean };
  mixedUnlocked: boolean;
  lastMixedAt?: number;
  practice?: { skillId: string; title: string };
  now: number;
}

const DAY = 86_400_000;

export function todaysPlan(p: PlanInput): Task[] {
  if (!p.diagnosticDone) return [{ kind: 'diagnostic' }];
  const tasks: Task[] = [];
  if (p.weakGym.length) tasks.push({ kind: 'gym', ...p.weakGym[0] });
  if (p.errorsDue > 0) tasks.push({ kind: 'errors', count: p.errorsDue });
  if (p.cardsDue > 0) tasks.push({ kind: 'cards', count: p.cardsDue });
  const mixedStale = p.mixedUnlocked && (p.lastMixedAt === undefined || p.now - p.lastMixedAt >= 3 * DAY);
  if (mixedStale) tasks.push({ kind: 'mixed' });
  if (p.nextLesson) tasks.push({ kind: 'lesson', ...p.nextLesson });
  if (p.practice) tasks.push({ kind: 'practice', ...p.practice });
  return tasks.slice(0, 3);
}
