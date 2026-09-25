// تجميع ملفات المحتوى الخام والتحقق من مخططاتها (يُستخدم في التطبيق وفي سكربت التحقق)
import { z } from 'zod';
import {
  Card, CardsFile, Chapter, Constants, Diagnostic, ExamConfig, GymSkill, Lesson, Misconception,
  MisconceptionsFile, ProblemFile, ProblemTemplate, RearrangeItem,
} from './schemas';

export interface Bundle {
  constants: Constants | null;
  exam: ExamConfig | null;
  misconceptions: Map<string, Misconception>;
  chapters: Chapter[];
  lessons: Lesson[];
  templates: Map<string, ProblemTemplate>;
  cards: Card[];
  gym: GymSkill[];
  rearrange: Map<string, RearrangeItem>;
  diagnostic: Diagnostic | null;
}

export interface FileError {
  file: string;
  message: string;
}

function fmtZod(err: z.ZodError): string {
  return err.issues
    .slice(0, 6)
    .map((i) => `${i.path.join('.') || '(الجذر)'}: ${i.message}`)
    .join(' | ');
}

/** files: مسار نسبي داخل content/ ← محتوى JSON */
export function buildBundle(files: Record<string, unknown>): { bundle: Bundle; errors: FileError[] } {
  const errors: FileError[] = [];
  const b: Bundle = {
    constants: null, exam: null, misconceptions: new Map(), chapters: [], lessons: [],
    templates: new Map(), cards: [], gym: [], rearrange: new Map(), diagnostic: null,
  };
  const parse = <T>(file: string, schema: z.ZodType<T>, data: unknown): T | null => {
    const r = schema.safeParse(data);
    if (!r.success) {
      errors.push({ file, message: fmtZod(r.error) });
      return null;
    }
    return r.data;
  };
  const addTemplate = (file: string, t: ProblemTemplate) => {
    if (b.templates.has(t.id)) errors.push({ file, message: `معرّف قالب مكرر: ${t.id}` });
    b.templates.set(t.id, t);
  };
  for (const file of Object.keys(files).sort()) {
    const data = files[file];
    if (file === 'constants.json') b.constants = parse(file, Constants, data);
    else if (file === 'exam-config.json') b.exam = parse(file, ExamConfig, data);
    else if (file === 'misconceptions.json') {
      for (const m of parse(file, MisconceptionsFile, data) ?? []) b.misconceptions.set(m.id, m);
    } else if (file === 'diagnostic.json') b.diagnostic = parse(file, Diagnostic, data);
    else if (/^ch\d+\/chapter\.json$/.test(file)) {
      const c = parse(file, Chapter, data);
      if (c) b.chapters.push(c);
    } else if (/^ch\d+\/lessons\/.+\.json$/.test(file)) {
      const l = parse(file, Lesson, data);
      if (l) b.lessons.push(l);
    } else if (/^ch\d+\/problems\/.+\.json$/.test(file) || /^extra-problems\/.+\.json$/.test(file)) {
      const p = parse(file, ProblemFile, data);
      if (p) for (const t of Array.isArray(p) ? p : [p]) addTemplate(file, t);
    } else if (/^ch\d+\/cards\.json$/.test(file)) {
      b.cards.push(...(parse(file, CardsFile, data) ?? []));
    } else if (/^math-gym\/.+\.json$/.test(file)) {
      const g = parse(file, GymSkill, data);
      if (g) {
        b.gym.push(g);
        for (const t of g.templates ?? []) addTemplate(file, t);
        for (const r of g.rearrange ?? []) b.rearrange.set(r.id, r);
      }
    }
  }
  b.lessons.sort((x, y) => x.chapter - y.chapter || x.order - y.order);
  b.chapters.sort((x, y) => x.id - y.id);
  const gymOrder = ['gym.prefixes', 'gym.sci', 'gym.rearrange', 'gym.calculator'];
  b.gym.sort((x, y) => gymOrder.indexOf(x.id) - gymOrder.indexOf(y.id));
  return { bundle: b, errors };
}
