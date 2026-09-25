import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { FukkahaDB, useTestDb, db, getMeta, setMeta, pruneOldAttempts } from '../../src/db/schema';
import { exportAll, checkBackup, importAll, backupFileName } from '../../src/db/backup';
import { newCard } from '../../src/engine/scheduler';

let n = 0;
beforeEach(async () => {
  useTestDb(new FukkahaDB('test-' + n++));
  await db.open();
});

describe('التخزين والنسخة الاحتياطية (المرحلة 4)', () => {
  it('يكتب محاولات، يصدّر، يمسح، يستورد، ويطابق', async () => {
    const now = Date.now();
    await db.attempts.bulkAdd([
      { skillId: 'ch01.ohm-current', seed: 1, mode: 'workshop', correct: true, hintsUsed: 0, attemptsCount: 1, secondsSpent: 40, askedExternal: false, createdAt: now },
      { skillId: 'ch01.ohm-current', seed: 2, mode: 'workshop', correct: false, hintsUsed: 3, attemptsCount: 4, secondsSpent: 200, errorType: 'calc', misconceptionId: 'M-OHM-INVERTED', askedExternal: true, createdAt: now },
    ]);
    await db.skills.put({ skillId: 'ch01.ohm-current', level: 2, streakUnassisted: 1, spacedCorrect: false });
    await db.cards.put(newCard('c.L03.ohm-law', now));
    await setMeta('settings', { name: 'أحمد' });
    const before = await exportAll();
    const text = JSON.stringify(before);

    await Promise.all(['attempts', 'skills', 'cards', 'meta'].map((t) => db.table(t).clear()));
    expect(await db.attempts.count()).toBe(0);

    const check = checkBackup(text);
    expect(check.ok).toBe(true);
    if (check.ok) await importAll(check.data);
    const after = await exportAll(new Date(before.exportedAt));
    expect(JSON.parse(JSON.stringify(after))).toEqual(JSON.parse(text));
    expect(await getMeta('settings', {})).toEqual({ name: 'أحمد' });
  });

  it('يرفض ملفاً تالفاً أو بإصدار أحدث دون لمس البيانات', async () => {
    await db.attempts.add({ skillId: 's', seed: 1, mode: 'gym', correct: true, hintsUsed: 0, attemptsCount: 1, secondsSpent: 5, askedExternal: false, createdAt: 1 });
    const bad = checkBackup('{not json');
    expect(bad.ok).toBe(false);
    const newer = checkBackup(JSON.stringify({ app: 'fukkaha', schemaVersion: 99, exportedAt: 'x', tables: {} }));
    expect(newer.ok).toBe(false);
    if (!newer.ok) expect(newer.message).toContain('إصدار أحدث');
    expect(await db.attempts.count()).toBe(1);
  });

  it('حذف المحاولات الأقدم من 180 يوماً', async () => {
    const now = Date.now();
    await db.attempts.bulkAdd([
      { skillId: 's', seed: 1, mode: 'gym', correct: true, hintsUsed: 0, attemptsCount: 1, secondsSpent: 5, askedExternal: false, createdAt: now - 200 * 86_400_000 },
      { skillId: 's', seed: 2, mode: 'gym', correct: true, hintsUsed: 0, attemptsCount: 1, secondsSpent: 5, askedExternal: false, createdAt: now },
    ]);
    await pruneOldAttempts(now);
    expect(await db.attempts.count()).toBe(1);
  });

  it('اسم الملف', () => {
    expect(backupFileName(new Date(2026, 8, 25))).toBe('fukkaha-backup-2026-09-25.json');
  });
});
