// النسخة الاحتياطية: تصدير كل الجداول إلى JSON، والاستيراد يتحقق بـzod ويرفض الإصدار الأحدث
import { z } from 'zod';
import { db, SCHEMA_VERSION, TABLES } from './schema';

export const BackupFile = z.object({
  app: z.literal('fukkaha'),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  tables: z.object({
    attempts: z.array(z.record(z.string(), z.unknown())),
    skills: z.array(z.record(z.string(), z.unknown())),
    errorBank: z.array(z.record(z.string(), z.unknown())),
    cards: z.array(z.record(z.string(), z.unknown())),
    lessonProgress: z.array(z.record(z.string(), z.unknown())),
    meta: z.array(z.object({ key: z.string(), value: z.unknown() })),
  }),
});
export type BackupFile = z.infer<typeof BackupFile>;

export async function exportAll(now = new Date()): Promise<BackupFile> {
  const tables = {} as BackupFile['tables'];
  for (const name of TABLES) {
    (tables as Record<string, unknown[]>)[name] = await db.table(name).toArray();
  }
  return { app: 'fukkaha', schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), tables };
}

export function backupFileName(now = new Date()): string {
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `fukkaha-backup-${d}.json`;
}

export type ImportCheck = { ok: true; data: BackupFile } | { ok: false; message: string };

/** يفحص الملف دون لمس البيانات الحالية */
export function checkBackup(text: string): ImportCheck {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, message: 'الملف ده مش ملف نسخة احتياطية سليم (مش JSON). البيانات الحالية ما اتلمستش.' };
  }
  const version = (raw as { schemaVersion?: unknown })?.schemaVersion;
  if (typeof version === 'number' && version > SCHEMA_VERSION) {
    return { ok: false, message: `النسخة دي معمولة من إصدار أحدث من التطبيق (${version}). حدّث التطبيق الأول. البيانات الحالية ما اتلمستش.` };
  }
  const r = BackupFile.safeParse(raw);
  if (!r.success) return { ok: false, message: 'الملف ناقص أو تالف، مش هينفع نستورده. البيانات الحالية ما اتلمستش.' };
  return { ok: true, data: r.data };
}

/** يستبدل كل البيانات (بعد تأكيد المستخدم) */
export async function importAll(data: BackupFile) {
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const name of TABLES) {
      const table = db.table(name);
      await table.clear();
      await table.bulkAdd(data.tables[name] as never[]);
    }
  });
}
