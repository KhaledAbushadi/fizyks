// الترحيب + الاختبار التشخيصي (15 سؤال: 6 رياضيات + 9 مفاهيم الفصل 1) ونفسه كاختبار بعدي
import { useMemo, useState } from 'react';
import type { AppData, DiagnosticResult } from '../../services/appData';
import { content, isVisible, templateById } from '../../content/loader';
import { setMeta } from '../../db/schema';
import { freshSeed, mulberry32, shuffle } from '../../engine/rng';
import { instantiate } from '../../engine/template';
import { recordAttempt } from '../../services/progress';
import { updateSettings } from '../../services/settings';
import { navigate } from '../../router';
import { LogoMark } from '../../ui/Logo';
import { Mascot } from '../../ui/Mascot';
import { Page, TopBar } from '../../ui/bits';
import { RichText } from '../../ui/RichText';
import { Num } from '../../ui/Num';
import { Tex } from '../../ui/Math';
import type { RearrangeItem } from '../../content/schemas';

export function Welcome() {
  const [name, setName] = useState('');
  return (
    <Page className="flex min-h-[100dvh] flex-col justify-center">
      <div className="fade-in text-center">
        <div className="mx-auto flex w-fit items-end gap-2">
          <LogoMark size={72} />
          <Mascot mood="wave" size={96} className="bob" />
        </div>
        <h1 className="mt-4 text-4xl font-bold">فُكّها</h1>
        <p className="mt-2 text-lg text-ink-2">الفيزيا مش صعبة. هي بس متعقّدة. وإحنا هنفكّها حتة حتة.</p>
      </div>
      <div className="card mt-8 space-y-3 p-5">
        <p>• كل درس بيبدأ بحاجة من حياتك، وبعدين تجربة تشوفها بعينك.</p>
        <p>• كل مسألة ليها ورشة من 5 خطوات، والمساعدة بتقل لوحدها لما تتحسن.</p>
        <p>• مفيش حسابات ولا نت: كل حاجة متسجلة على موبايلك بس.</p>
        <label className="block pt-2">
          <span className="text-sm text-muted">اسمك إيه؟ (اختياري، بيتحفظ على موبايلك بس)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-line bg-surface px-3" maxLength={30} data-testid="name-input" />
        </label>
      </div>
      <button
        type="button"
        className="btn btn-amber mt-5 w-full text-lg"
        data-testid="welcome-start"
        onClick={async () => {
          if (name.trim()) await updateSettings({ name: name.trim() });
          await setMeta('onboarded', true);
          navigate('/diagnostic', true);
        }}
      >
        يلا نبدأ
      </button>
    </Page>
  );
}

function rearrangeChoices(r: RearrangeItem, seed: number): string[] {
  const ans = r.answer;
  const opts = new Set<string>([ans.join(' ')]);
  if (ans.length === 3) {
    opts.add([ans[2], ans[1], ans[0]].join(' '));
    const flip = ans[1] === '\\div' ? '\\times' : '\\div';
    opts.add([ans[0], flip, ans[2]].join(' '));
  } else {
    opts.add([...ans].reverse().join(' '));
  }
  return shuffle(mulberry32(seed), [...opts]);
}

export function Diagnostic({ data, post }: { data: AppData; post: boolean }) {
  const items = content.diagnostic?.items ?? [];
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<{ skill: string; correct: boolean }[]>([]);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const seeds = useMemo(() => items.map(() => freshSeed()), [items]);

  const answer = async (correct: boolean, templateId?: string) => {
    const it = items[i];
    const next = [...answers, { skill: it.skill, correct }];
    setAnswers(next);
    if (templateId) {
      await recordAttempt({ skillId: templateId, seed: seeds[i], mode: 'diagnostic', outcome: correct ? 'clean' : 'revealed', hintsUsed: 0, attemptsCount: 1, secondsSpent: 0, askedExternal: false });
    }
    if (i + 1 < items.length) setI(i + 1);
    else {
      const bySkill: DiagnosticResult['bySkill'] = {};
      for (const a of next) {
        const k = a.skill;
        bySkill[k] = bySkill[k] ?? { correct: 0, total: 0 };
        bySkill[k].total++;
        if (a.correct) bySkill[k].correct++;
      }
      const r = { at: Date.now(), items: next, bySkill };
      await setMeta(post ? 'diagnosticPost' : 'diagnosticPre', r);
      setResult(r);
    }
  };

  if (result) return <DiagnosticResultView result={result} pre={post ? data.diagnosticPre : undefined} />;

  const allVisible = items.every((it) => {
    const tt = it.template ? templateById(it.template) : undefined;
    const rr = it.rearrange ? content.rearrange.get(it.rearrange) : undefined;
    return (tt && isVisible(tt, data.settings.showDrafts)) || (rr && isVisible(rr, data.settings.showDrafts));
  });
  if (!allVisible) {
    return (
      <Page>
        <TopBar title="نبدأ منين؟" onBack={() => navigate('/')} />
        <div className="card mt-4 p-6 text-center" data-testid="diagnostic-pending">
          <p className="font-bold">الاختبار تحت المراجعة</p>
          <p className="mt-1 text-sm text-muted">مدرس الفيزياء بيراجع الأسئلة قبل ما توصلك. قريب جداً.</p>
        </div>
      </Page>
    );
  }

  if (!started) {
    return (
      <Page>
        <TopBar title={post ? 'الاختبار البعدي' : 'نبدأ منين؟'} onBack={() => navigate('/')} />
        <div className="card p-5 text-lg leading-9">
          <p>{post ? 'نفس أسئلة أول يوم، بأرقام جديدة. يلا نشوف اتحسنت قد إيه.' : content.diagnostic?.intro}</p>
        </div>
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => setStarted(true)} data-testid="diagnostic-start">
          ابدأ ({items.length} سؤال)
        </button>
      </Page>
    );
  }

  const it = items[i];
  const t = it.template ? templateById(it.template) : undefined;
  const inst = t ? instantiate(t, seeds[i]) : null;
  const r = it.rearrange ? content.rearrange.get(it.rearrange) : undefined;
  return (
    <Page>
      <TopBar title={post ? 'الاختبار البعدي' : 'نبدأ منين؟'} sub={`سؤال ${i + 1} من ${items.length}`} />
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-violet transition-all" style={{ width: `${(i / items.length) * 100}%` }} />
      </div>
      <div key={i} className="fade-in">
        {t && inst && (
          <>
            <section className="card mb-3 p-4 leading-9">
              <RichText text={t.stem} inst={inst} />
            </section>
            <div className="space-y-2">
              {inst.choices.map((c, k) => (
                <button key={k} type="button" className="choice" onClick={() => answer(c.correct, t.id)} data-correct={c.correct ? '1' : '0'} data-misconception={c.misconception ?? ''} data-testid={`diag-choice-${k}`}>
                  <Num value={c.value} sig={inst.sigFigs} unit={inst.answerUnit} className="font-semibold" />
                </button>
              ))}
            </div>
          </>
        )}
        {r && (
          <>
            <section className="card mb-3 p-4 text-center">
              <p className="text-2xl">
                <Tex tex={r.law} />
              </p>
              <p className="mt-2">
                اسحب <Tex tex={r.target} /> لوحده. الصح:
              </p>
            </section>
            <div className="space-y-2">
              {rearrangeChoices(r, seeds[i]).map((c, k) => (
                <button key={c} type="button" className="choice text-center text-xl" onClick={() => answer(c === r.answer.join(' '))} data-correct={c === r.answer.join(' ') ? '1' : '0'} data-testid={`diag-choice-${k}`}>
                  <Tex tex={`${r.target} = ${c}`} />
                </button>
              ))}
            </div>
          </>
        )}
        <button type="button" className="btn btn-ghost mt-3 w-full" onClick={() => answer(false, t?.id)} data-testid="diag-dontknow">
          مش عارف
        </button>
      </div>
    </Page>
  );
}

function DiagnosticResultView({ result, pre }: { result: DiagnosticResult; pre?: DiagnosticResult }) {
  const total = result.items.filter((x) => x.correct).length;
  const gym = content.gym.map((g) => ({ g, r: result.bySkill[g.id] })).filter((x) => x.r);
  const weak = gym.filter((x) => x.r!.correct / x.r!.total < 2 / 3);
  const preTotal = pre?.items.filter((x) => x.correct).length;
  return (
    <Page>
      <TopBar title="النتيجة" onBack={() => navigate('/')} />
      <div className="card p-5 text-center" data-testid="diagnostic-result">
        <p className="num text-4xl font-bold">
          {total}/{result.items.length}
        </p>
        <p className="text-muted">{pre ? 'في الاختبار البعدي' : 'ده مش درجة، ده خريطة'}</p>
        {pre && preTotal !== undefined && (
          <div className="mt-4 space-y-2 text-start" data-testid="pre-post">
            {[{ label: 'أول يوم', v: preTotal, c: 'var(--muted)' }, { label: 'دلوقتي', v: total, c: 'var(--good)' }].map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-sm">
                  <span>{b.label}</span>
                  <b className="num">{b.v}/15</b>
                </div>
                <div className="h-3 rounded-full bg-surface-2">
                  <div className="h-full rounded-full" style={{ width: `${(b.v / 15) * 100}%`, background: b.c }} />
                </div>
              </div>
            ))}
            <p className="pt-1 text-center font-bold">{total - preTotal >= 0 ? `+${total - preTotal} سؤال` : `${total - preTotal} سؤال`}</p>
          </div>
        )}
      </div>
      {!pre && (
        <div className="card mt-3 p-4">
          <p className="mb-2 font-bold">صالة الرياضيات</p>
          {gym.map(({ g, r }) => (
            <div key={g.id} className="flex items-center justify-between border-b border-line py-2 last:border-0">
              <span>{g.title}</span>
              <span className={`text-sm font-bold ${r!.correct / r!.total < 2 / 3 ? 'text-warm' : 'text-good'}`}>{r!.correct / r!.total < 2 / 3 ? 'محتاجة تمرين' : 'تمام'}</span>
            </div>
          ))}
          <p className="mt-3 text-[15px]">{weak.length ? `هنبدأ بـ"${weak[0].g.title}" قبل الدروس، لأنها اللي بتوقع الطلاب قبل الفيزيا نفسها.` : 'الرياضيات عندك كويسة. هنبدأ في الدروس على طول.'}</p>
        </div>
      )}
      <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => navigate('/', true)} data-testid="diagnostic-home">
        خطة النهارده
      </button>
    </Page>
  );
}
