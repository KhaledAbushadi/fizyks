// خريطة الدرجات: كم درجة من الـ60 "أمّنها" الطالب (تقديرية حسب وزن الفصل في امتحان 2026)
export interface ChapterMarks {
  id: number;
  marks: number;
  title?: string;
  lessons: string[]; // فارغة للفصول التي لم يُبنَ محتواها بعد
}

export interface ChapterScore {
  id: number;
  marks: number;
  secured: number;
  perLesson: number;
  lessons: { id: string; mastered: boolean }[];
  available: boolean;
}

export function computeScoreMap(chapters: ChapterMarks[], isLessonMastered: (id: string) => boolean) {
  const scores: ChapterScore[] = chapters.map((c) => {
    const perLesson = c.lessons.length ? c.marks / c.lessons.length : 0;
    const lessons = c.lessons.map((id) => ({ id, mastered: isLessonMastered(id) }));
    const secured = lessons.filter((l) => l.mastered).length * perLesson;
    return { id: c.id, marks: c.marks, secured, perLesson, lessons, available: c.lessons.length > 0 };
  });
  const total = scores.reduce((s, c) => s + c.marks, 0);
  const secured = scores.reduce((s, c) => s + c.secured, 0);
  return { chapters: scores, total, secured };
}

/** تنسيق الدرجة: 3.5 أو 3 */
export function fmtMarks(x: number): string {
  return Number.isInteger(x) ? String(x) : x.toFixed(1).replace(/\.0$/, '');
}
