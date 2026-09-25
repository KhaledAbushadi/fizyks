// عدّاد الأيام المتتالية: يوم غياب واحد في الأسبوع مسموح ("يوم راحة") حتى لا يُحبَط الطالب
export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function computeStreak(activeDays: Set<string>, now: number): { days: number; restUsed: boolean } {
  const DAY = 86_400_000;
  let cursor = now;
  // اليوم لم ينته بعد: غيابه لا يكسر العدّاد
  if (!activeDays.has(dayKey(cursor))) cursor -= DAY;
  let days = 0;
  let lastForgiven: number | undefined;
  let restUsed = false;
  for (let i = 0; i < 400; i++) {
    if (activeDays.has(dayKey(cursor))) {
      days++;
    } else {
      if (days === 0) break;
      if (lastForgiven === undefined || lastForgiven - cursor >= 7 * DAY) {
        lastForgiven = cursor;
        if (i < 7) restUsed = true;
      } else break;
    }
    cursor -= DAY;
  }
  return { days, restUsed };
}
