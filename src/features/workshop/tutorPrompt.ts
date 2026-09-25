// تعليمة جاهزة يلصقها الطالب بنفسه في أي مساعد ذكي مجاني (التطبيق لا يتصل بأي خدمة)
import type { ProblemTemplate } from '../../content/schemas';
import { fillPlain, type Instance } from '../../engine/template';
import { unit } from '../../engine/units';
import { fmtPlain } from '../../engine/numbers';

const STEP_NAMES: [keyof ProblemTemplate['solutionSteps'], string][] = [
  ['draw', 'ارسم'],
  ['classify', 'صنّف'],
  ['inventory', 'اجرد'],
  ['compute', 'احسب'],
  ['check', 'افحص'],
];

export function buildTutorPrompt(t: ProblemTemplate, inst: Instance, lastAnswer: string): string {
  const steps = STEP_NAMES.map(([k, name]) => (t.solutionSteps[k] ? `- ${name}: ${fillPlain(t.solutionSteps[k], inst)}` : ''))
    .filter(Boolean)
    .join('\n');
  const u = unit(inst.answerUnit);
  return [
    'إنت مدرس فيزياء صبور لطالب ثانوية عامة مصري مستواه ضعيف. اتكلم بالعامية المصرية البسيطة.',
    'القواعد: متديش الحل ولا الرقم النهائي (لا تعطني الحل). اسألني سؤال واحد بس في كل مرة يوصلني للخطوة الجاية.',
    'لو غلطت، قولي فين الغلط من غير ما تحل مكاني. استخدم تشبيه من الحياة لو المفهوم صعب.',
    '',
    `المسألة: ${fillPlain(t.stem, inst)}`,
    `أنا جاوبت: ${lastAnswer || 'لسه مجاوبتش'}`,
    `الحل الصحيح للمراجعة (متقولهوش ليا، استخدمه تتأكد بس):`,
    steps,
    `- الناتج النهائي: ${fmtPlain(inst.answer, inst.sigFigs)} ${u.symbol}`.trim(),
  ].join('\n');
}
