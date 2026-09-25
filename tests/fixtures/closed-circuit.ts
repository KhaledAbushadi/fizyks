import type { ProblemTemplate } from '../../src/content/schemas';

export const closedCircuit: ProblemTemplate = {
  id: 'ch01.closed-circuit-current',
  chapter: 1,
  lesson: 'L07',
  status: 'draft',
  title: 'التيار في الدائرة المغلقة',
  marks: 1,
  cognitiveLevel: 'medium',
  targetSeconds: 180,
  stem: 'بطارية قوتها الدافعة {emf} فولت ومقاومتها الداخلية {r} أوم، وُصّلت بمقاومة خارجية {R} أوم. احسب شدة التيار المار في الدائرة.',
  variables: {
    emf: { values: [6, 9, 12, 24] },
    r: { min: 0.5, max: 2, step: 0.5 },
    R: { min: 2, max: 20, step: 0.5 },
  },
  constraints: ['emf / (R + r) >= 0.2', 'emf / (R + r) <= 10'],
  answer: { expr: 'emf / (R + r)', unit: 'A', sigFigs: 3 },
  distractors: [
    { expr: 'emf / R', misconception: 'M-IGNORE-INTERNAL-R' },
    { expr: 'emf / r', misconception: 'M-ONLY-INTERNAL-R' },
    { expr: 'emf * (R + r)', misconception: 'M-OHM-INVERTED' },
  ],
  hints: ['h1', 'h2', 'احسب الأول المقاومة الكلية: {R} + {r} = ؟'],
  solutionSteps: { draw: 'd', classify: 'c', inventory: 'i', compute: 'I = {emf} ÷ ({R} + {r}) = {answer} A', check: 'k' },
};

/** قالب اختبار فقط: مثال فاراداي من البحث (الفصل 3 خارج النطاق) */
export const faraday: ProblemTemplate = {
  ...closedCircuit,
  id: 'test.faraday',
  chapter: 3,
  lesson: 'L00',
  variables: { N: { values: [200] }, dB: { values: [0.05] }, A: { values: [0.3] }, dt: { values: [0.03] } },
  constraints: [],
  answer: { expr: 'N * dB * A / dt', unit: 'V', sigFigs: 3 },
  distractors: [
    { expr: 'N * dB * A * dt', misconception: 'M-OHM-INVERTED' },
    { expr: 'dB * A / dt', misconception: 'M-POWER-OF-TEN' },
  ],
  hints: ['a', 'b', 'c'],
};

/** نسخة ثابتة: emf = 12، R = 5.5، r = 0.5 */
export const closedCircuitFixed: ProblemTemplate = {
  ...closedCircuit,
  id: 'test.closed-fixed',
  variables: { emf: { values: [12] }, r: { values: [0.5] }, R: { values: [5.5] } },
};
