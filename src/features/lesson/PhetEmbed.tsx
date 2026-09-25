// محاكاة PhET: لا تُحمَّل إلا بلمسة من الطالب (محتاجة نت)، مع سطر النسب الإلزامي حرفياً
import { useState } from 'react';

// نسخة محلية لو اتضافت في public/sims (راجع README)، وإلا الرابط المباشر
const LOCAL = 'sims/circuit-construction-kit-dc_ar.html';
const REMOTE = 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_ar.html';

export function PhetEmbed() {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const start = async () => {
    setOpen(true);
    try {
      const r = await fetch(LOCAL, { method: 'HEAD' });
      const type = r.headers.get('content-type') ?? '';
      if (r.ok && type.includes('html') && Number(r.headers.get('content-length') ?? '200000') > 100_000) {
        setSrc(LOCAL);
        return;
      }
    } catch {
      /* لا نسخة محلية */
    }
    setSrc(navigator.onLine ? REMOTE : null);
  };
  return (
    <div className="mt-3 rounded-2xl border border-line bg-surface p-3">
      {!open ? (
        <button type="button" className="btn btn-ghost w-full" onClick={start}>
          عاوز تبني دايرتك بنفسك؟ افتح معمل PhET (محتاج نت)
        </button>
      ) : src ? (
        <iframe src={src} title="محاكاة بناء الدوائر: تيار مستمر" className="h-[70vh] w-full rounded-xl border border-line" allowFullScreen />
      ) : (
        <p className="text-center text-muted">المحاكاة محتاجة نت. المعمل اللي فوق شغال من غير نت وبيوريك نفس الفكرة.</p>
      )}
      <p className="mt-2 text-xs leading-5 text-muted" dir="ltr" lang="en">
        Simulation by PhET Interactive Simulations, University of Colorado Boulder, licensed under CC BY 4.0 (https://phet.colorado.edu)
      </p>
    </div>
  );
}
