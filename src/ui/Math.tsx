// مكوّن المعادلات الوحيد: دايماً من اليسار لليمين داخل النص العربي، وفشل الرسم يعرض النص الخام
import katex from 'katex';
import { memo, useMemo } from 'react';

export const Tex = memo(function Tex({ tex, display = false, className = '' }: { tex: string; display?: boolean; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode: display, strict: 'ignore', output: 'html' });
    } catch {
      return null;
    }
  }, [tex, display]);
  if (html === null) return <span dir="ltr" className={`math ${className}`}>{tex}</span>;
  return <span dir="ltr" className={`math ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
});

/** اسم بديل حسب الخطة (Math.tsx)؛ نستخدم Tex داخل الكود حتى لا يطغى على Math الخاص بجافاسكربت */
export { Tex as MathTex };
