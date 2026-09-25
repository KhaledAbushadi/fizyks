// زر "اسأل مساعد مجاني": ينسخ تعليمة جاهزة فقط، بلا أي طلب شبكة
import { useRef, useState } from 'react';
import { IconChat, IconCopy } from '../../ui/Icons';

export function FreeTutor({ prompt, onUsed }: { prompt: string; onUsed: () => void }) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const area = useRef<HTMLTextAreaElement>(null);
  const copy = async () => {
    onUsed();
    try {
      if (!navigator.clipboard?.writeText) throw new Error('no clipboard');
      await navigator.clipboard.writeText(prompt);
      setState('copied');
    } catch {
      setState('manual');
    }
  };
  return (
    <div className="mt-3 rounded-2xl border border-violet/40 bg-violet-soft p-3" data-testid="free-tutor">
      <button type="button" className="btn btn-soft w-full border border-violet/40" onClick={copy} data-testid="free-tutor-btn">
        <IconChat /> اسأل مساعد مجاني
      </button>
      {state === 'idle' && <p className="mt-2 text-sm text-ink-2">هننسخلك رسالة جاهزة فيها المسألة، والمساعد هيوجّهك خطوة خطوة من غير ما يحل مكانك.</p>}
      {state === 'copied' && (
        <p className="pop mt-2 text-sm font-semibold" data-testid="free-tutor-copied">
          اتنسخت. افتح أي مساعد ذكي مجاني عندك والصق.
        </p>
      )}
      {state === 'manual' && (
        <div className="mt-2">
          <p className="mb-1 text-sm">النسخ التلقائي ما اشتغلش. حدد النص وانسخه بإيدك:</p>
          <textarea ref={area} readOnly value={prompt} className="h-40 w-full rounded-xl border border-line bg-surface p-2 text-sm" dir="rtl" />
          <button type="button" className="btn btn-ghost mt-1" onClick={() => area.current?.select()}>
            <IconCopy size={18} /> حدد الكل
          </button>
        </div>
      )}
    </div>
  );
}
