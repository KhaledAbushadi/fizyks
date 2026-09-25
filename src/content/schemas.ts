// مخططات zod لكل ملفات المحتوى: أي ملف ناقص يُرفض قبل أن يصل للطالب
import { z } from 'zod';

export const Status = z.enum(['draft', 'reviewed']);

export const Variable = z.union([
  z.object({ values: z.array(z.number()).min(1) }).strict(),
  z.object({ min: z.number(), max: z.number(), step: z.number().positive() }).strict(),
]);

export const Distractor = z.object({
  expr: z.string().min(1),
  misconception: z.string().min(1),
}).strict();

export const InventorySlot = z.object({
  symbol: z.string().min(1), // LaTeX
  var: z.string().min(1),
  unit: z.string().min(1), // معرّف وحدة من units.ts (وحدة القيمة كما في نص المسألة)
}).strict();

export const Workshop = z.object({
  diagramChoices: z.array(z.string()).min(2).max(4),
  correctDiagram: z.string(),
  lawChoices: z.array(z.string()).min(3).max(4), // LaTeX
  correctLaw: z.string(),
  inventory: z.array(InventorySlot).min(1),
  unknown: z.string().min(1), // LaTeX للمطلوب
  hiddenGiven: z.string().min(1),
  sanityCheck: z.string().min(1),
  /** تعبير منطقي في x (القيمة المقترحة) وبقية المتغيرات: صحيح = منطقي */
  sanityExpr: z.string().min(1),
}).strict();

export const SolutionSteps = z.object({
  draw: z.string(),
  classify: z.string(),
  inventory: z.string(),
  compute: z.string(),
  check: z.string(),
}).strict();

export const ProblemTemplate = z.object({
  id: z.string().regex(/^[a-z0-9]+(\.[a-z0-9-]+)+$/),
  chapter: z.number().int().min(0),
  lesson: z.string(),
  status: Status,
  title: z.string().min(1),
  marks: z.number().positive(),
  cognitiveLevel: z.enum(['easy', 'medium', 'hard']),
  targetSeconds: z.number().int().positive(),
  stem: z.string().min(1),
  variables: z.record(z.string(), Variable),
  derived: z.record(z.string(), z.string()).optional(),
  constraints: z.array(z.string()),
  answer: z.object({ expr: z.string(), unit: z.string(), sigFigs: z.number().int().min(1).max(5) }).strict(),
  distractors: z.array(Distractor),
  workshop: Workshop.optional(),
  hints: z.array(z.string()).length(3),
  solutionSteps: SolutionSteps,
}).strict();
export type ProblemTemplate = z.infer<typeof ProblemTemplate>;

export const ProblemFile = z.union([ProblemTemplate, z.array(ProblemTemplate)]);

export const Misconception = z.object({
  id: z.string().regex(/^M-[A-Z0-9-]+$/),
  type: z.enum(['concept', 'misread', 'calc', 'unit']),
  titleAr: z.string().min(1),
  explanationAr: z.string().min(1),
  analogyAr: z.string().min(1),
}).strict();
export type Misconception = z.infer<typeof Misconception>;
export const MisconceptionsFile = z.array(Misconception);

export const McqItem = z.object({
  kind: z.literal('mcq'),
  question: z.string(),
  choices: z.array(z.string()).min(2).max(4),
  correct: z.number().int().min(0),
  /** مفهوم خاطئ لكل بديل (null للصحيح أو غير المربوط) */
  misconceptions: z.array(z.string().nullable()).optional(),
  explain: z.string().optional(),
}).strict();
export type McqItem = z.infer<typeof McqItem>;

export const TemplateItem = z.object({ kind: z.literal('template'), template: z.string() }).strict();
export const QuizItem = z.discriminatedUnion('kind', [McqItem, TemplateItem]);
export type QuizItem = z.infer<typeof QuizItem>;

export const SymbolInfo = z.object({
  latex: z.string(),
  name: z.string(),
  meaning: z.string(),
  unit: z.string(),
  example: z.string(),
}).strict();
export type SymbolInfo = z.infer<typeof SymbolInfo>;

export const Lesson = z.object({
  id: z.string().regex(/^L\d{2}$/),
  chapter: z.number().int(),
  order: z.number().int(),
  status: Status,
  title: z.string(),
  subtitle: z.string(),
  minutes: z.number().int(),
  hook: z.object({ title: z.string(), text: z.array(z.string()).min(1), art: z.string() }).strict(),
  predict: z.object({ question: z.string(), choices: z.array(z.string()).min(2).max(4), correct: z.number().int() }).strict(),
  see: z.object({
    lab: z.string(),
    instructions: z.array(z.string()).min(1),
    truth: z.string(),
    phet: z.boolean().optional(),
  }).strict(),
  fading: z.object({
    story: z.object({ title: z.string(), text: z.array(z.string()) }).strict(),
    picture: z.object({ diagram: z.string(), text: z.array(z.string()) }).strict(),
    symbol: z.object({ latex: z.string(), text: z.array(z.string()) }).strict(),
  }).strict(),
  book: z.array(z.object({ title: z.string(), text: z.string(), latex: z.string().optional() }).strict()).min(1),
  symbols: z.array(SymbolInfo).min(1),
  worked: z.object({ template: z.string(), seed: z.number().int() }).strict(),
  faded: z.object({ template: z.string() }).strict(),
  exit: z.array(QuizItem).length(3),
}).strict();
export type Lesson = z.infer<typeof Lesson>;

export const Chapter = z.object({
  id: z.number().int(),
  title: z.string(),
  marks: z.number(),
  lessons: z.array(z.string()),
  analogy: z.string(),
}).strict();
export type Chapter = z.infer<typeof Chapter>;

export const Card = z.object({
  id: z.string(),
  lesson: z.string(),
  kind: z.enum(['law', 'definition', 'unit', 'symbol']),
  front: z.string(),
  frontLatex: z.string().optional(),
  back: z.string(),
  backLatex: z.string().optional(),
}).strict();
export type Card = z.infer<typeof Card>;
export const CardsFile = z.array(Card);

export const ExamConfig = z.object({
  source: z.string(),
  totalMarks: z.number(),
  totalMinutes: z.number(),
  minutesPerMark: z.number(),
  chapters: z.array(z.object({ id: z.number(), marks: z.number(), title: z.string().optional(), note: z.string().optional() }).strict()),
}).strict();
export type ExamConfig = z.infer<typeof ExamConfig>;

const Constant = z.object({ value: z.number(), unit: z.string(), alt: z.number().optional(), bookValue: z.number().optional() }).strict();
export const Constants = z.object({
  verified: z.boolean(),
  note: z.string(),
  e: Constant,
  h: Constant,
  c: Constant,
  me: Constant,
}).strict();
export type Constants = z.infer<typeof Constants>;

export const RearrangeItem = z.object({
  id: z.string(),
  status: Status,
  law: z.string(),
  target: z.string(),
  tiles: z.array(z.string()).min(3),
  answer: z.array(z.string()).min(1),
  hint: z.string(),
}).strict();
export type RearrangeItem = z.infer<typeof RearrangeItem>;

export const GymSkill = z.object({
  id: z.string().regex(/^gym\.[a-z-]+$/),
  status: Status,
  title: z.string(),
  subtitle: z.string(),
  intro: z.array(z.string()).min(1),
  templates: z.array(ProblemTemplate).optional(),
  rearrange: z.array(RearrangeItem).optional(),
}).strict();
export type GymSkill = z.infer<typeof GymSkill>;

export const DiagnosticItem = z.object({
  skill: z.string(), // gym.* أو معرّف قالب
  template: z.string().optional(),
  rearrange: z.string().optional(),
}).strict();
export const Diagnostic = z.object({
  intro: z.string(),
  items: z.array(DiagnosticItem).length(15),
}).strict();
export type Diagnostic = z.infer<typeof Diagnostic>;
