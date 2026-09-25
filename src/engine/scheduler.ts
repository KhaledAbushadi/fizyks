// المراجعة المتباعدة بخوارزمية FSRS (ts-fsrs): ثلاثة أزرار فقط وحد 15 بطاقة يومياً
import { createEmptyCard, fsrs, generatorParameters, Rating, type Card as FsrsCard, type Grade } from 'ts-fsrs';

export const DAILY_CARD_LIMIT = 15;

const scheduler = fsrs(generatorParameters({ enable_fuzz: false, maximum_interval: 180 }));

export type Answer3 = 'again' | 'hard' | 'good';
const MAP: Record<Answer3, Grade> = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good };

export interface StoredCard {
  cardId: string;
  due: number;
  state: FsrsCard;
}

export function newCard(cardId: string, now: number): StoredCard {
  const state = createEmptyCard(new Date(now));
  return { cardId, due: state.due.getTime(), state };
}

function revive(c: FsrsCard): FsrsCard {
  return { ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined };
}

export function gradeCard(card: StoredCard, answer: Answer3, now: number): StoredCard {
  const { card: next } = scheduler.next(revive(card.state), new Date(now), MAP[answer]);
  return { cardId: card.cardId, due: next.due.getTime(), state: next };
}

/** البطاقات المستحقة اليوم، بحد أقصى 15؛ المتأخرة تتوزع على الأيام التالية تلقائياً */
export function dueToday(cards: StoredCard[], now: number, reviewedToday: number): StoredCard[] {
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const remaining = Math.max(0, DAILY_CARD_LIMIT - reviewedToday);
  return cards
    .filter((c) => c.due <= endOfDay.getTime())
    .sort((a, b) => a.due - b.due)
    .slice(0, remaining);
}
