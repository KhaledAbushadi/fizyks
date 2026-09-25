import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newError, reviewError, isDue } from '../../src/engine/errorBank';
import { DAY } from '../../src/engine/mastery';
import { newCard, gradeCard, dueToday, DAILY_CARD_LIMIT } from '../../src/engine/scheduler';
import { computeStreak, dayKey } from '../../src/engine/streak';
import { todaysPlan } from '../../src/engine/plan';
import { computeScoreMap } from '../../src/engine/scoreMap';

describe('بنك الأخطاء: 1 ثم 3 ثم 7 أيام', () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date('2026-09-25T10:00:00') }));
  afterEach(() => vi.useRealTimers());

  it('المواعيد وتقديم الساعة', () => {
    let e = newError({ skillId: 's', seed: 1, errorType: 'concept' }, Date.now());
    expect(isDue(e, Date.now())).toBe(false);
    vi.advanceTimersByTime(1 * DAY);
    expect(isDue(e, Date.now())).toBe(true);
    e = reviewError(e, false, Date.now())!;
    expect(e.dueAt - Date.now()).toBe(3 * DAY);
    vi.advanceTimersByTime(3 * DAY);
    expect(isDue(e, Date.now())).toBe(true);
    e = reviewError(e, true, Date.now())!;
    expect(e.dueAt - Date.now()).toBe(7 * DAY);
    vi.advanceTimersByTime(7 * DAY);
    expect(reviewError(e, true, Date.now())).toBeNull(); // صحيح مرتين في موعدين مختلفين ← يُحذف
  });
});

describe('المراجعة المتباعدة', () => {
  it('الحد اليومي 15 بطاقة', () => {
    const now = Date.now();
    const cards = Array.from({ length: 40 }, (_, i) => newCard('c' + i, now));
    expect(dueToday(cards, now, 0)).toHaveLength(DAILY_CARD_LIMIT);
    expect(dueToday(cards, now, 10)).toHaveLength(5);
  });
  it('"سهل" يؤجل البطاقة و"ماعرفتش" تعيدها قريباً', () => {
    const now = Date.now();
    const c = newCard('c', now);
    const good = gradeCard(c, 'good', now);
    const again = gradeCard(c, 'again', now);
    expect(good.due).toBeGreaterThan(again.due);
    // تعيش بعد التسلسل JSON (IndexedDB)
    const revived = JSON.parse(JSON.stringify(good));
    expect(gradeCard(revived, 'good', good.due).due).toBeGreaterThan(good.due);
  });
});

describe('العدّاد وخطة اليوم وخريطة الدرجات', () => {
  it('يوم غياب واحد لا يصفّر العدّاد، ويومان يصفّرانه', () => {
    const now = new Date('2026-09-25T12:00:00').getTime();
    const d = (n: number) => dayKey(now - n * DAY);
    expect(computeStreak(new Set([d(0), d(1), d(3), d(4)]), now).days).toBe(4);
    expect(computeStreak(new Set([d(0), d(1), d(4), d(5)]), now).days).toBe(2);
  });

  it('مهارة الرياضيات الضعيفة أولاً، و3 مهام فقط', () => {
    const plan = todaysPlan({
      diagnosticDone: true,
      weakGym: [{ skillId: 'gym.prefixes', title: 'البادئات' }],
      errorsDue: 2,
      cardsDue: 5,
      nextLesson: { lessonId: 'L01', title: 'x', resume: false },
      mixedUnlocked: false,
      now: Date.now(),
    });
    expect(plan).toHaveLength(3);
    expect(plan[0]).toMatchObject({ kind: 'gym', skillId: 'gym.prefixes' });
  });

  it('خريطة الدرجات: 8 درجات للفصل 1 عند إتقان كل دروسه', () => {
    const lessons = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08'];
    const map = computeScoreMap([{ id: 1, marks: 8, lessons }, { id: 2, marks: 12, lessons: [] }], () => true);
    expect(map.chapters[0].secured).toBe(8);
    expect(map.secured).toBe(8);
    const half = computeScoreMap([{ id: 1, marks: 8, lessons }], (id) => id < 'L04');
    expect(half.secured).toBe(3);
  });
});
