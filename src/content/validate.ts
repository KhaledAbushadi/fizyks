// قواعد المحتوى العميقة: كل قالب يولّد 200 نسخة سليمة، كل مفهوم خاطئ موجود، كل معادلة تُرسم
import katex from 'katex';
import type { Bundle, FileError } from './bundle';
import type { ProblemTemplate } from './schemas';
import { ART_IDS, DIAGRAM_IDS, LAB_IDS } from './registry';
import { instantiateOrThrow, placeholdersIn, sanityHolds, setConstants, templateTexts, RESERVED } from '../engine/template';
import { UNITS } from '../engine/units';

export const SEEDS = 200;
export const MIN_DISTINCT = 11;

function latexError(latex: string): string | null {
  try {
    katex.renderToString(latex, { throwOnError: true, strict: 'ignore' });
    return null;
  } catch (e) {
    return (e as Error).message.split('\n')[0];
  }
}

function mathSegments(text: string): string[] {
  return [...text.matchAll(/\$([^$]+)\$/g)].map((m) => m[1]);
}

export function validateTemplate(t: ProblemTemplate, b: Bundle, err: (m: string) => void) {
  const known = new Set([...Object.keys(t.variables), ...Object.keys(t.derived ?? {}), ...RESERVED]);
  for (const text of templateTexts(t)) {
    for (const name of placeholdersIn(text)) {
      if (!known.has(name)) err(`متغير غير معرّف {${name}} في: "${text.slice(0, 50)}…"`);
    }
  }
  for (const d of t.distractors) {
    if (!b.misconceptions.has(d.misconception)) err(`مفهوم خاطئ غير موجود في القاموس: ${d.misconception}`);
  }
  if (!UNITS[t.answer.unit]) err(`وحدة إجابة غير معروفة: ${t.answer.unit}`);
  const w = t.workshop;
  if (w) {
    for (const id of w.diagramChoices) if (!(DIAGRAM_IDS as readonly string[]).includes(id)) err(`رسم غير مسجَّل: ${id}`);
    if (!w.diagramChoices.includes(w.correctDiagram)) err(`correctDiagram ليس ضمن diagramChoices`);
    if (!w.lawChoices.includes(w.correctLaw)) err(`correctLaw ليس ضمن lawChoices`);
    if (new Set(w.lawChoices).size !== w.lawChoices.length) err('قوانين مكررة في lawChoices');
    for (const s of w.inventory) {
      if (!known.has(s.var)) err(`خانة جرد لمتغير غير معرّف: ${s.var}`);
      if (!t.stem.includes(`{${s.var}}`) && !t.stem.includes(`{${s.var}:plain}`)) err(`متغير الجرد {${s.var}} غير موجود في نص المسألة (لازم يكون قابلاً للّمس)`);
      if (!UNITS[s.unit]) err(`وحدة جرد غير معروفة: ${s.unit}`);
    }
    for (const l of [...w.lawChoices, ...w.inventory.map((s) => s.symbol), w.unknown]) {
      const e = latexError(l);
      if (e) err(`معادلة لا تُرسم "${l}": ${e}`);
    }
  }
  // 200 نسخة
  const signatures = new Set<string>();
  let failedAt: number | null = null;
  for (let seed = 1; seed <= SEEDS; seed++) {
    try {
      const inst = instantiateOrThrow(t, seed);
      signatures.add(inst.signature);
      if (w && !sanityHolds(t, inst, inst.answer)) {
        err(`شرط "افحص" يرفض الإجابة الصحيحة نفسها (بذرة ${seed}، الإجابة ${inst.answer})`);
        break;
      }
      if (seed === 1) {
        for (const text of templateTexts(t)) {
          for (const m of mathSegments(text)) {
            const filled = m.replace(/@([A-Za-z_]\w*)(:plain)?/g, (_x, n: string) => String(n === 'answer' ? inst.answer : inst.vars[n] ?? 1));
            const e = latexError(filled);
            if (e) err(`معادلة لا تُرسم "${m}": ${e}`);
          }
        }
      }
    } catch (e) {
      failedAt = seed;
      err(`فشل توليد النسخة ببذرة ${seed}: ${(e as Error).message}`);
      break;
    }
  }
  if (failedAt === null && signatures.size < MIN_DISTINCT) {
    err(`القالب يولّد ${signatures.size} نسخة مختلفة فقط (المطلوب ${MIN_DISTINCT} على الأقل)`);
  }
}

export function validateBundle(b: Bundle): FileError[] {
  const errors: FileError[] = [];
  const at = (file: string) => (message: string) => errors.push({ file, message });
  if (b.constants) setConstants(b.constants);
  else errors.push({ file: 'constants.json', message: 'الملف مفقود أو غير صالح' });

  if (!b.exam) errors.push({ file: 'exam-config.json', message: 'الملف مفقود أو غير صالح' });
  else {
    const sum = b.exam.chapters.reduce((s, c) => s + c.marks, 0);
    if (sum !== b.exam.totalMarks) at('exam-config.json')(`مجموع درجات الفصول ${sum} لا يساوي ${b.exam.totalMarks}`);
    if (b.exam.totalMarks !== 60) at('exam-config.json')(`الدرجة الكلية ${b.exam.totalMarks} وليست 60`);
  }
  for (const m of b.misconceptions.values()) {
    const words = m.explanationAr.trim().split(/\s+/).length;
    if (words > 60) at('misconceptions.json')(`${m.id}: الشرح ${words} كلمة (الحد 60)`);
  }
  for (const t of b.templates.values()) validateTemplate(t, b, at(`قالب ${t.id}`));

  const lessonIds = new Set(b.lessons.map((l) => l.id));
  for (const c of b.chapters) {
    for (const id of c.lessons) if (!lessonIds.has(id)) at(`ch${String(c.id).padStart(2, '0')}/chapter.json`)(`درس غير موجود: ${id}`);
    if (b.exam && !b.exam.chapters.some((x) => x.id === c.id)) at('exam-config.json')(`الفصل ${c.id} بلا وزن`);
  }
  for (const l of b.lessons) {
    const err = at(`درس ${l.id}`);
    const own = [...b.templates.values()].filter((t) => t.lesson === l.id && t.chapter === l.chapter);
    if (own.length < 3) err(`عدد القوالب ${own.length} (المطلوب 3 على الأقل)`);
    if (!(ART_IDS as readonly string[]).includes(l.hook.art)) err(`رسم توضيحي غير مسجَّل: ${l.hook.art}`);
    if (!(LAB_IDS as readonly string[]).includes(l.see.lab)) err(`معمل غير مسجَّل: ${l.see.lab}`);
    if (!(DIAGRAM_IDS as readonly string[]).includes(l.fading.picture.diagram)) err(`رسم غير مسجَّل: ${l.fading.picture.diagram}`);
    if (l.predict.correct >= l.predict.choices.length) err('predict.correct خارج البدائل');
    for (const ref of [l.worked.template, l.faded.template]) {
      const t = b.templates.get(ref);
      if (!t) err(`قالب غير موجود: ${ref}`);
      else if (!t.workshop) err(`القالب ${ref} بلا ورشة، لا يصلح للمثال المحلول`);
    }
    for (const item of l.exit) {
      if (item.kind === 'template') {
        if (!b.templates.has(item.template)) err(`قالب تذكرة خروج غير موجود: ${item.template}`);
      } else {
        if (item.correct >= item.choices.length) err(`سؤال "${item.question.slice(0, 30)}": correct خارج البدائل`);
        if (item.misconceptions) {
          if (item.misconceptions.length !== item.choices.length) err(`سؤال "${item.question.slice(0, 30)}": عدد المفاهيم لا يساوي عدد البدائل`);
          for (const m of item.misconceptions) if (m && !b.misconceptions.has(m)) err(`مفهوم خاطئ غير موجود: ${m}`);
        }
      }
    }
    const latexes = [l.fading.symbol.latex, ...l.symbols.map((s) => s.latex), ...l.book.flatMap((x) => (x.latex ? [x.latex] : []))];
    const texts = [...l.hook.text, ...l.fading.story.text, ...l.fading.picture.text, ...l.fading.symbol.text, ...l.book.map((x) => x.text), ...l.symbols.flatMap((s) => [s.example, s.unit, s.meaning])];
    for (const x of [...latexes, ...texts.flatMap(mathSegments)]) {
      const e = latexError(x);
      if (e) err(`معادلة لا تُرسم "${x}": ${e}`);
    }
  }
  const cardIds = new Set<string>();
  for (const c of b.cards) {
    const err = at(`بطاقة ${c.id}`);
    if (cardIds.has(c.id)) err('معرّف مكرر');
    cardIds.add(c.id);
    if (!lessonIds.has(c.lesson)) err(`درس غير موجود: ${c.lesson}`);
    for (const x of [c.frontLatex, c.backLatex]) if (x && latexError(x)) err(`معادلة لا تُرسم: ${x}`);
  }
  for (const g of b.gym) {
    for (const r of g.rearrange ?? []) {
      const err = at(`نقل حدود ${r.id}`);
      for (const tile of r.answer) if (!r.tiles.includes(tile)) err(`البلاطة ${tile} ليست ضمن tiles`);
      for (const x of [r.law, ...r.tiles]) if (latexError(x)) err(`معادلة لا تُرسم: ${x}`);
    }
    for (const x of g.intro.flatMap(mathSegments)) if (latexError(x)) at(`صالة ${g.id}`)(`معادلة لا تُرسم: ${x}`);
  }
  if (!b.diagnostic) errors.push({ file: 'diagnostic.json', message: 'الملف مفقود أو غير صالح' });
  else {
    b.diagnostic.items.forEach((it, i) => {
      const err = at(`diagnostic.json #${i + 1}`);
      if (it.template && !b.templates.has(it.template)) err(`قالب غير موجود: ${it.template}`);
      if (it.rearrange && !b.rearrange.has(it.rearrange)) err(`سؤال نقل حدود غير موجود: ${it.rearrange}`);
      if (!it.template && !it.rearrange) err('السؤال بلا template ولا rearrange');
    });
    const math = b.diagnostic.items.filter((x) => x.skill.startsWith('gym.')).length;
    if (math !== 6) at('diagnostic.json')(`عدد أسئلة الرياضيات ${math} (المطلوب 6)`);
  }
  return errors;
}
