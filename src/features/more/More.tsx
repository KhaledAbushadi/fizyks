// المزيد: النسخة الاحتياطية، الإعدادات، الخصوصية، والتراخيص
import { useRef, useState } from 'react';
import type { AppData } from '../../services/appData';
import { backupFileName, checkBackup, exportAll, importAll, type BackupFile } from '../../db/backup';
import { updateSettings } from '../../services/settings';
import { navigate } from '../../router';
import { Nudge, Page, TopBar } from '../../ui/bits';
import { IconDownload, IconUpload } from '../../ui/Icons';
import { content, PREVIEW_BUILD } from '../../content/loader';
import { allChapterSkills } from '../../content/loader';
import { isMastered } from '../../engine/mastery';

export function More({ data }: { data: AppData }) {
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ tone: 'good' | 'warm'; text: string } | null>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const s = data.settings;
  const postUnlocked = !!data.diagnosticPre && allChapterSkills(1).every((t) => { const k = data.skills.get(t.id); return k && isMastered(k); });

  const doExport = async () => {
    const backup = await exportAll();
    const blob = new Blob([JSON.stringify(backup, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = backupFileName();
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    await updateSettings({ lastBackupAt: Date.now() });
    setMsg({ tone: 'good', text: 'اتعملت النسخة. احفظ الملف في مكان أمين (درايف أو واتساب لنفسك).' });
  };
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const r = checkBackup(await f.text());
    if (!r.ok) setMsg({ tone: 'warm', text: r.message });
    else setPending(r.data);
    if (file.current) file.current.value = '';
  };
  const Toggle = ({ label, on, onChange, sub }: { label: string; on: boolean; onChange: (v: boolean) => void; sub?: string }) => (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-3">
      <span>
        <span className="block font-semibold">{label}</span>
        {sub && <span className="block text-sm text-muted">{sub}</span>}
      </span>
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="h-6 w-6 accent-[var(--amber)]" />
    </label>
  );
  return (
    <Page>
      <TopBar title="المزيد" onBack={() => navigate('/')} />
      <section className="card p-4">
        <h2 className="mb-1 font-bold">النسخة الاحتياطية</h2>
        <p className="text-sm text-muted">كل تقدمك على الموبايل ده بس. لو اتمسحت بيانات المتصفح، التقدم يضيع. اعمل نسخة كل أسبوع.</p>
        <p className="mt-1 text-xs text-muted">آخر نسخة: {s.lastBackupAt ? new Date(s.lastBackupAt).toLocaleDateString('ar-EG') : 'لسه'}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-primary" onClick={doExport} data-testid="backup-export">
            <IconDownload size={18} /> تصدير
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => file.current?.click()} data-testid="backup-import">
            <IconUpload size={18} /> استيراد
          </button>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} data-testid="backup-file" />
        </div>
        {pending && (
          <Nudge tone="warm" testid="import-confirm">
            <p className="font-bold">متأكد؟</p>
            <p className="text-sm">النسخة دي من {new Date(pending.exportedAt).toLocaleDateString('ar-EG')}. هتستبدل كل التقدم الحالي.</p>
            <div className="mt-2 flex gap-2">
              <button type="button" className="btn btn-primary h-10 min-h-0 flex-1" onClick={async () => { await importAll(pending); setPending(null); setMsg({ tone: 'good', text: 'اتستوردت النسخة.' }); }} data-testid="import-yes">
                أيوه، استبدل
              </button>
              <button type="button" className="btn btn-ghost h-10 min-h-0" onClick={() => setPending(null)}>
                لأ
              </button>
            </div>
          </Nudge>
        )}
        {msg && <Nudge tone={msg.tone} testid="backup-msg">{msg.text}</Nudge>}
      </section>

      <section className="card mt-3 divide-y divide-line px-4">
        <label className="block py-3">
          <span className="font-semibold">اسمك (اختياري)</span>
          <input defaultValue={s.name ?? ''} onBlur={(e) => updateSettings({ name: e.target.value.trim() || undefined })} className="mt-1 h-11 w-full rounded-xl border border-line bg-surface px-3" maxLength={30} />
        </label>
        <div className="py-3">
          <span className="font-semibold">المظهر</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(['auto', 'light', 'dark'] as const).map((th) => (
              <button key={th} type="button" className={`tap rounded-xl border-2 ${s.theme === th ? 'border-ink bg-surface-2 font-bold' : 'border-line'}`} onClick={() => updateSettings({ theme: th })}>
                {th === 'auto' ? 'زي الموبايل' : th === 'light' ? 'فاتح' : 'غامق'}
              </button>
            ))}
          </div>
        </div>
        <Toggle label="أرقام هندية (١٢٣)" sub="خارج المعادلات بس. المعادلات والحاسبة بالأرقام العادية." on={s.hindiDigits} onChange={(v) => updateSettings({ hindiDigits: v })} />
      </section>

      <section className="card mt-3 space-y-2 p-4">
        <button type="button" className="btn btn-soft w-full" onClick={() => navigate('/review')}>بطاقات المراجعة ({data.cardsTotal})</button>
        <button type="button" className="btn btn-soft w-full" onClick={() => navigate('/errors')}>بنك الأخطاء ({data.errors.length})</button>
        <button type="button" className="btn btn-soft w-full" onClick={() => navigate('/mixed')}>الجلسة المختلطة {data.mixedUnlocked ? '' : '(مقفولة)'}</button>
        <button type="button" className="btn btn-soft w-full" disabled={!postUnlocked} onClick={() => navigate('/diagnostic/post')}>
          الاختبار البعدي {postUnlocked ? '' : '(بعد إتقان كل مهارات الفصل)'}
        </button>
        {(import.meta.env.DEV || PREVIEW_BUILD || s.showDrafts) && (
          <button type="button" className="btn btn-ghost w-full" onClick={() => navigate('/dev/content-preview')} data-testid="open-preview">
            معاينة المحتوى للمراجِع
          </button>
        )}
      </section>

      <section className="mt-3 space-y-2 p-2 text-sm leading-7 text-muted">
        <p>
          <b>الخصوصية:</b> التطبيق مش بيبعت أي حاجة لأي مكان. مفيش حسابات ولا تحليلات ولا تتبّع. زر "اسأل مساعد مجاني" بينسخ نص المسألة بس، وانت اللي بتلصقه.
        </p>
        <p>
          <b>المحتوى:</b> {content.lessons.length} دروس و{content.templates.size} قالب مسألة، {content.lessons.every((l) => l.status === 'reviewed') ? 'متراجعة' : 'مسودات تحت مراجعة مدرس فيزياء'}.
        </p>
        <p dir="ltr" className="text-xs">
          Simulations: PhET Interactive Simulations, University of Colorado Boulder, CC BY 4.0 (https://phet.colorado.edu). Font: IBM Plex Sans Arabic, SIL Open Font License 1.1. Math: KaTeX (MIT), mathjs (Apache-2.0).
        </p>
      </section>
    </Page>
  );
}
