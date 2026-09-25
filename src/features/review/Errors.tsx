// بنك الأخطاء: الأخطاء مصنفة بأنواعها الأربعة، وكل خطأ يرجع كنسخة جديدة من نفس القالب
import { useState } from 'react';
import type { AppData } from '../../services/appData';
import { content, templateById } from '../../content/loader';
import { navigate } from '../../router';
import { Empty, Page, TopBar } from '../../ui/bits';
import { ProblemRunner } from '../workshop/ProblemRunner';

export const ERROR_TYPES = {
  concept: { name: 'فهم', desc: 'فكرة فيزيائية متلخبطة', cls: 'bg-violet-soft text-violet' },
  misread: { name: 'قراءة', desc: 'قريت المسألة أو الرسم غلط', cls: 'bg-teal-soft text-teal' },
  calc: { name: 'حساب', desc: 'القانون صح والحسبة لأ', cls: 'bg-amber-soft text-amber' },
  unit: { name: 'وحدات', desc: 'نسيت تحوّل بادئة أو وحدة', cls: 'bg-warm-soft text-warm' },
} as const;

export function Errors({ data }: { data: AppData }) {
  const [queue] = useState(() => data.errorsDue.map((e) => e.id!));
  const [running, setRunning] = useState(false);
  const [i, setI] = useState(0);
  const counts = { concept: 0, misread: 0, calc: 0, unit: 0 };
  for (const e of data.errors) counts[e.errorType]++;
  const topMis = Object.entries(
    data.errors.reduce<Record<string, number>>((acc, e) => {
      if (e.misconceptionId) acc[e.misconceptionId] = (acc[e.misconceptionId] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1])[0];

  if (running) {
    const entry = data.errors.find((e) => e.id === queue[i]);
    const t = entry ? templateById(entry.skillId) : undefined;
    return (
      <Page>
        <TopBar title="مراجعة الأخطاء" sub={`${Math.min(i + 1, queue.length)} من ${queue.length}`} onBack={() => setRunning(false)} />
        {!entry || !t ? (
          <Empty title="خلّصت مراجعة أخطاء النهارده!">كل خطأ اتحل صح مرتين في موعدين مختلفين بيطلع من البنك.</Empty>
        ) : (
          <>
            <p className={`mb-2 inline-block rounded-full px-3 py-1 text-sm ${ERROR_TYPES[entry.errorType].cls}`}>
              غلطة {ERROR_TYPES[entry.errorType].name}
              {entry.misconceptionId && `: ${content.misconceptions.get(entry.misconceptionId)?.titleAr}`}
            </p>
            <ProblemRunner key={queue[i]} t={t} mode="auto" context="errors" errorEntryId={entry.id} onComplete={() => setI(i + 1)} />
          </>
        )}
      </Page>
    );
  }
  return (
    <Page>
      <TopBar title="بنك الأخطاء" sub="كل غلطة فرصة، بس لو رجعنالها" onBack={() => navigate('/')} />
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(ERROR_TYPES) as (keyof typeof ERROR_TYPES)[]).map((k) => (
          <div key={k} className="card p-3">
            <p className={`inline-block rounded-md px-2 text-sm font-bold ${ERROR_TYPES[k].cls}`}>{ERROR_TYPES[k].name}</p>
            <p className="num mt-1 text-2xl font-bold">{counts[k]}</p>
            <p className="text-xs text-muted">{ERROR_TYPES[k].desc}</p>
          </div>
        ))}
      </div>
      {topMis && (
        <div className="card mt-3 p-4">
          <p className="text-sm text-muted">أكتر غلطة بتتكرر معاك:</p>
          <p className="font-bold">{content.misconceptions.get(topMis[0])?.titleAr}</p>
          <p className="mt-1 text-[15px]">{content.misconceptions.get(topMis[0])?.analogyAr}</p>
        </div>
      )}
      {queue.length > 0 ? (
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => setRunning(true)} data-testid="errors-start">
          راجع {queue.length} {queue.length === 1 ? 'غلطة' : 'غلطات'} مستحقة النهارده
        </button>
      ) : (
        <Empty title={data.errors.length ? 'مفيش أخطاء مستحقة النهارده' : 'البنك فاضي'}>
          {data.errors.length ? 'كل غلطة بترجعلك بعد يوم، وبعدين 3 أيام، وبعدين أسبوع.' : 'أي غلطة في الورشة هتتسجل هنا تلقائي.'}
        </Empty>
      )}
    </Page>
  );
}
