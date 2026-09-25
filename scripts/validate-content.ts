// npm run validate-content: يفحص كل ملفات المحتوى ويفشل برسالة واضحة
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { buildBundle } from '../src/content/bundle';
import { validateBundle } from '../src/content/validate';

export function readContentDir(root: string): Record<string, unknown> {
  const files: Record<string, unknown> = {};
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith('.json')) {
        const rel = relative(root, full).split('\\').join('/');
        try {
          files[rel] = JSON.parse(readFileSync(full, 'utf8'));
        } catch (e) {
          files[rel] = { __parseError: (e as Error).message };
        }
      }
    }
  };
  walk(root);
  return files;
}

export function runValidation(roots: string[]) {
  const files: Record<string, unknown> = {};
  for (const root of roots) Object.assign(files, readContentDir(resolve(root)));
  const { bundle, errors } = buildBundle(files);
  const deep = validateBundle(bundle);
  return { bundle, errors: [...errors, ...deep] };
}

const isMain = process.argv[1] && resolve(process.argv[1]).endsWith('validate-content.ts');
if (isMain) {
  const extra = process.argv.slice(2);
  const { bundle, errors } = runValidation(['content', ...extra]);
  const templates = [...bundle.templates.values()];
  const drafts = templates.filter((t) => t.status === 'draft').length + bundle.lessons.filter((l) => l.status === 'draft').length;
  if (errors.length) {
    console.error(`\n✗ فشل التحقق من المحتوى: ${errors.length} خطأ\n`);
    for (const e of errors) console.error(`  • [${e.file}] ${e.message}`);
    process.exit(1);
  }
  console.log('✓ المحتوى سليم');
  console.log(`  دروس: ${bundle.lessons.length} · قوالب: ${templates.length} (كل قالب 200 نسخة) · مفاهيم خاطئة: ${bundle.misconceptions.size} · بطاقات: ${bundle.cards.length} · مهارات صالة: ${bundle.gym.length}`);
  console.log(`  مسودات تنتظر المراجعة: ${drafts}`);
  if (bundle.constants && !bundle.constants.verified) console.log('  ⚠ constants.json غير متحقق منه (verified: false)');
}
