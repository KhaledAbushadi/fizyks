// التخزين المحلي في IndexedDB (Dexie): كل بيانات الطالب على جهازه فقط
import Dexie, { type Table } from 'dexie';
import type { SkillState } from '../engine/mastery';
import type { ErrorEntry } from '../engine/errorBank';
import type { StoredCard } from '../engine/scheduler';

export const SCHEMA_VERSION = 1;

export type AttemptMode = 'lesson' | 'workshop' | 'mixed' | 'gym' | 'diagnostic' | 'errors';
export type ErrorType = 'concept' | 'misread' | 'calc' | 'unit';

export interface Attempt {
  id?: number;
  skillId: string;
  seed: number;
  mode: AttemptMode;
  correct: boolean;
  hintsUsed: number;
  attemptsCount: number;
  secondsSpent: number;
  errorType?: ErrorType;
  misconceptionId?: string;
  askedExternal: boolean;
  revealed?: boolean;
  createdAt: number;
}

export interface LessonProgress {
  lessonId: string;
  stationReached: number; // 1..8
  prediction?: number;
  exitScore?: number;
  completedAt?: number;
}

export interface MetaRow {
  key: string;
  value: unknown;
}

export class FukkahaDB extends Dexie {
  attempts!: Table<Attempt, number>;
  skills!: Table<SkillState, string>;
  errorBank!: Table<ErrorEntry, number>;
  cards!: Table<StoredCard, string>;
  lessonProgress!: Table<LessonProgress, string>;
  meta!: Table<MetaRow, string>;

  constructor(name = 'fukkaha', deps?: { indexedDB: IDBFactory; IDBKeyRange: typeof IDBKeyRange }) {
    super(name, deps);
    this.version(SCHEMA_VERSION).stores({
      attempts: '++id, skillId, createdAt',
      skills: 'skillId',
      errorBank: '++id, dueAt',
      cards: 'cardId, due',
      lessonProgress: 'lessonId',
      meta: 'key',
    });
  }
}

export const TABLES = ['attempts', 'skills', 'errorBank', 'cards', 'lessonProgress', 'meta'] as const;
export type TableName = (typeof TABLES)[number];

/** القاعدة الحالية (تُستبدل بذاكرة مؤقتة إن لم يتوفر IndexedDB) */
export let db = new FukkahaDB();
export let persistent = true;

/**
 * يفتح القاعدة. في التصفح الخاص أو عند غياب IndexedDB نستخدم نسخة في الذاكرة
 * (fake-indexeddb) فيعمل التطبيق، ويظهر تنبيه "التقدم مش هيتحفظ".
 */
export async function openDb(): Promise<{ persistent: boolean }> {
  try {
    if (typeof indexedDB === 'undefined') throw new Error('no indexedDB');
    await db.open();
    persistent = true;
  } catch {
    const fake = await import('fake-indexeddb');
    db = new FukkahaDB('fukkaha-memory', { indexedDB: fake.indexedDB, IDBKeyRange: fake.IDBKeyRange });
    await db.open();
    persistent = false;
  }
  return { persistent };
}

export function useTestDb(instance: FukkahaDB) {
  db = instance;
}

// ———— meta ————
export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const row = await db.meta.get(key);
  return row === undefined ? fallback : (row.value as T);
}

export async function setMeta(key: string, value: unknown) {
  await safeWrite(() => db.meta.put({ key, value }));
}

// ———— امتلاء المساحة ————
export const quotaListeners = new Set<() => void>();

export async function safeWrite<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch (e) {
    const name = (e as { name?: string; inner?: { name?: string } }).name;
    const inner = (e as { inner?: { name?: string } }).inner?.name;
    if (name === 'QuotaExceededError' || inner === 'QuotaExceededError') {
      await pruneOldAttempts();
      quotaListeners.forEach((l) => l());
      try {
        return await fn();
      } catch {
        return undefined;
      }
    }
    throw e;
  }
}

/** يحذف المحاولات الأقدم من 180 يوماً (عند امتلاء المساحة) */
export async function pruneOldAttempts(now = Date.now()) {
  const cutoff = now - 180 * 86_400_000;
  return db.attempts.where('createdAt').below(cutoff).delete();
}
