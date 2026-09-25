// يولّد أيقونات PNG (192 و512) من icon.svg بمتصفح Chromium المحلي (يُشغَّل مرة واحدة)
import { chromium } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';

const svg = readFileSync('public/icons/icon.svg', 'utf8');
const executablePath = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const browser = await chromium.launch({ executablePath });
for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  // أيقونة maskable: خلفية كاملة والشعار في المنطقة الآمنة (80%)
  await page.setContent(`<html><body style="margin:0;background:#1b2a4a;display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${Math.round(size * 0.8)}" height="${Math.round(size * 0.8)}" `)}</body></html>`);
  await page.screenshot({ path: `public/icons/icon-${size}.png` });
  await page.close();
}
await browser.close();
console.log('icons ok');
