// تحميل المحتوى في التطبيق: كل ملفات content/ تُضمَّن في البناء (تعمل من غير نت)
import { buildBundle, type Bundle } from './bundle';
import { setConstants } from '../engine/template';
import type { Lesson, ProblemTemplate } from './schemas';

const raw = import.meta.glob('../../content/**/*.json', { eager: true, import: 'default' });
const files: Record<string, unknown> = {};
for (const [path, data] of Object.entries(raw)) files[path.replace(/^.*?content\//, '')] = data;

const built = buildBundle(files);
if (built.errors.length) {
  // البناء يفشل قبل كده عبر validate-content؛ هنا نتخطى الملف المعطوب بس
  for (const e of built.errors) console.error(`[فُكّها] ملف محتوى اتخطّى: ${e.file}: ${e.message}`);
}
export const content: Bundle = built.bundle;
if (content.constants) setConstants(content.constants);

/** في الإنتاج لا يظهر للطالب إلا المحتوى "reviewed"، إلا لو الأسرة فعّلت إظهار المسودات */
export const PREVIEW_BUILD = import.meta.env.VITE_PREVIEW === '1';

export function isVisible(item: { status: 'draft' | 'reviewed' }, showDrafts: boolean) {
  return item.status === 'reviewed' || showDrafts || import.meta.env.DEV || PREVIEW_BUILD;
}

export function lessonTemplates(lessonId: string, chapter = 1): ProblemTemplate[] {
  return [...content.templates.values()].filter((t) => t.lesson === lessonId && t.chapter === chapter);
}

export function templateById(id: string): ProblemTemplate | undefined {
  return content.templates.get(id);
}

export function lessonById(id: string): Lesson | undefined {
  return content.lessons.find((l) => l.id === id);
}

export function allChapterSkills(chapter = 1): ProblemTemplate[] {
  return [...content.templates.values()].filter((t) => t.chapter === chapter);
}
