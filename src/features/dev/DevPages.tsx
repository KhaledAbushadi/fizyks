// صفحات المراجِع والمطوّر: معاينة كل القوالب بثلاث نسخ، ومعرض المكوّنات
import { useState } from 'react';
import { content } from '../../content/loader';
import { instantiate } from '../../engine/template';
import { Page, TopBar, Hint, SymbolCard, BookBox } from '../../ui/bits';
import { RichText } from '../../ui/RichText';
import { Tex } from '../../ui/Math';
import { Num } from '../../ui/Num';
import { NumberPad, EMPTY_PAD } from '../../ui/NumberPad';
import { Diagram, DIAGRAMS } from '../../ui/diagrams';
import { Solution } from '../workshop/Solution';
import { LABS, Lab } from '../../labs/labs';
import { ART, Art } from '../../ui/art';

export function ContentPreview() {
  const [filter, setFilter] = useState('');
  const templates = [...content.templates.values()].filter((t) => !filter || t.lesson === filter);
  const lessons = [...new Set([...content.templates.values()].map((t) => t.lesson))];
  return (
    <Page>
      <TopBar title="معاينة المحتوى" sub={`${content.templates.size} قالب · كل قالب بـ3 نسخ`} />
      <div className="card mb-3 p-3 text-sm">
        <p>المراجِع: اقرا كل نسخة، وصحّح في ملف JSON مباشرة، وبعدين غيّر <code dir="ltr">"status": "draft"</code> إلى <code dir="ltr">"reviewed"</code>. الثوابت: <code dir="ltr">content/constants.json</code> (verified: {String(content.constants?.verified)}).</p>
      </div>
      <div className="mb-3 flex flex-wrap gap-1">
        {['', ...lessons].map((l) => (
          <button key={l} type="button" className={`rounded-full border px-3 py-1 text-sm ${filter === l ? 'border-ink bg-ink text-bg' : 'border-line'}`} onClick={() => setFilter(l)}>
            {l || 'الكل'}
          </button>
        ))}
      </div>
      <div className="space-y-6">
        {templates.map((t) => (
          <article key={t.id} className="card p-4" data-testid="preview-template">
            <header className="mb-2 flex flex-wrap items-center gap-2">
              <code dir="ltr" className="text-xs text-muted">{t.id}</code>
              <span className={`rounded-md px-2 text-xs ${t.status === 'reviewed' ? 'bg-good-soft text-good' : 'bg-violet-soft text-violet'}`}>{t.status}</span>
              <span className="text-xs text-muted">{t.cognitiveLevel} · {t.targetSeconds}s · {t.marks} درجة</span>
            </header>
            <h3 className="font-bold">{t.title}</h3>
            {[1, 2, 3].map((seed) => {
              const inst = instantiate(t, seed * 7919);
              if (!inst) return <p key={seed} className="text-warm">فشل التوليد</p>;
              return (
                <details key={seed} className="mt-3 rounded-xl border border-line p-3" open={seed === 1}>
                  <summary className="cursor-pointer font-semibold">نسخة {seed} (بذرة {seed * 7919})</summary>
                  <p className="mt-2 leading-9">
                    <RichText text={t.stem} inst={inst} vars={{ highlight: true }} />
                  </p>
                  <p className="mt-2">
                    الإجابة: <Num value={inst.answer} sig={inst.sigFigs} unit={inst.answerUnit} className="font-bold" />
                  </p>
                  <ul className="mt-1 text-sm">
                    {inst.distractors.map((d, k) => (
                      <li key={k}>
                        بديل: <Num value={d.value} sig={inst.sigFigs} unit={inst.answerUnit} /> ← {content.misconceptions.get(d.misconception)?.titleAr} <code dir="ltr" className="text-xs text-muted">{d.misconception}</code>
                      </li>
                    ))}
                  </ul>
                  {t.hints.map((h, k) => (
                    <Hint key={k} level={k + 1} text={h} />
                  ))}
                  {t.hints.length > 0 && <div className="mt-2" />}
                  <div className="mt-2">
                    <Solution t={t} inst={inst} />
                  </div>
                  {t.workshop && (
                    <div className="mt-2 text-sm">
                      <p>القوانين: {t.workshop.lawChoices.map((l) => <span key={l} className={`mx-1 inline-block rounded px-1 ${l === t.workshop!.correctLaw ? 'bg-good-soft' : ''}`}><Tex tex={l} /></span>)}</p>
                      <p>افحص: <RichText text={t.workshop.sanityCheck} inst={inst} /> <code dir="ltr">{t.workshop.sanityExpr}</code></p>
                    </div>
                  )}
                </details>
              );
            })}
          </article>
        ))}
      </div>
    </Page>
  );
}

export function UiGallery() {
  const [pad, setPad] = useState(EMPTY_PAD);
  return (
    <Page>
      <TopBar title="معرض المكوّنات" sub="#/dev/ui" />
      <section className="card p-4" data-testid="rtl-math">
        <p className="leading-9">
          قانون أوم للدائرة المغلقة <Tex tex="I = \frac{\varepsilon}{R + r}" /> بيقول إن التيار بيقل كل ما المقاومة الداخلية تزيد، والقيمة <Num value={1.6e-19} unit="C" /> هي شحنة الإلكترون.
        </p>
        <div className="mt-3 text-center">
          <Tex tex="R = \rho_e \frac{\ell}{A}" display />
        </div>
      </section>
      <h2 className="mt-4 font-bold">لوحة الأرقام</h2>
      <NumberPad value={pad} onChange={setPad} />
      <h2 className="mt-4 font-bold">التلميح وبطاقة الرمز وصندوق الكتاب</h2>
      <Hint level={1} text="القانون $V = I\,R$. الجهد فوق دايماً." />
      <div className="mt-2">
        <SymbolCard s={{ latex: 'V_B', name: 'القوة الدافعة', meaning: 'الجهد الكلي للبطارية', unit: 'فولت (V)', example: '12 فولت' }} />
      </div>
      <div className="mt-2">
        <BookBox items={[{ title: 'قانون أوم', text: 'تتناسب شدة التيار المار في الموصل تناسباً طردياً مع فرق الجهد بين طرفيه عند ثبوت درجة الحرارة.', latex: 'V = I\\,R' }]} />
      </div>
      <h2 className="mt-4 font-bold">الرسومات ({Object.keys(DIAGRAMS).length})</h2>
      <div className="grid grid-cols-2 gap-2">
        {Object.keys(DIAGRAMS).map((id) => (
          <figure key={id} className="card p-1">
            <Diagram id={id} animated />
            <figcaption className="text-center text-xs text-muted" dir="ltr">{id}</figcaption>
          </figure>
        ))}
      </div>
      <h2 className="mt-4 font-bold">الرسوم التوضيحية</h2>
      <div className="grid grid-cols-2 gap-2">
        {Object.keys(ART).map((id) => (
          <div key={id} className="card p-1">
            <Art id={id} />
          </div>
        ))}
      </div>
      <h2 className="mt-4 font-bold">المعامل</h2>
      <div className="space-y-4">
        {Object.keys(LABS).map((id) => (
          <Lab key={id} id={id} />
        ))}
      </div>
    </Page>
  );
}
