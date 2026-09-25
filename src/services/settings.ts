import { useLiveQuery } from 'dexie-react-hooks';
import { db, setMeta } from '../db/schema';

export interface Settings {
  name?: string;
  showDrafts: boolean;
  hindiDigits: boolean;
  theme: 'auto' | 'light' | 'dark';
  lastBackupAt?: number;
  backupReminderDismissedAt?: number;
}

export const DEFAULT_SETTINGS: Settings = { showDrafts: false, hindiDigits: false, theme: 'auto' };

export function useSettings(): Settings {
  const row = useLiveQuery(() => db.meta.get('settings'), []);
  return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) };
}

export async function updateSettings(patch: Partial<Settings>) {
  const row = await db.meta.get('settings');
  await setMeta('settings', { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}), ...patch });
}
