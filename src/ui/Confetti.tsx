// احتفال صغير (قصاصات ملونة) عند النجاح. يحترم "تقليل الحركة" ولا يمنع اللمس.
const COLORS = ['#ffb627', '#ff7a59', '#0f9aa6', '#7a5cf0', '#1f9d63', '#e8568f', '#3a8dde'];

export function celebrate(amount = 90) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '60' });
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.remove();
  ctx.scale(dpr, dpr);
  const W = window.innerWidth;
  const parts = Array.from({ length: amount }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 80,
    y: window.innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 11,
    vy: -Math.random() * 11 - 4,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    w: 6 + Math.random() * 6,
    h: 4 + Math.random() * 4,
    c: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
  const start = performance.now();
  const tick = (t: number) => {
    const el = t - start;
    ctx.clearRect(0, 0, W, window.innerHeight);
    for (const p of parts) {
      p.vy += 0.32;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - el / 1800);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (el < 1800) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}
