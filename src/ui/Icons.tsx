// أيقونات خطية بسيطة (SVG داخلي، بلا مكتبات)
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 22) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true });

export const IconHome = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5v-5h4v5" /></svg>;
export const IconBook = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" /></svg>;
export const IconDumbbell = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M6 7v10M18 7v10M3 9.5v5M21 9.5v5M6 12h12" /></svg>;
export const IconMap = ({ size, ...p }: P) => <svg {...base(size)} {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16M15 4v16" /></svg>;
export const IconMore = ({ size, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></svg>;
export const IconBack = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M9 5l7 7-7 7" /></svg>;
export const IconNext = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M15 5l-7 7 7 7" /></svg>;
export const IconCheck = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M4.5 12.5l5 5L19.5 7" /></svg>;
export const IconBulb = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></svg>;
export const IconBolt = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>;
export const IconCards = ({ size, ...p }: P) => <svg {...base(size)} {...p}><rect x="7" y="3" width="13" height="16" rx="2" /><path d="M4 7v12a2 2 0 0 0 2 2h10" /></svg>;
export const IconTarget = ({ size, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></svg>;
export const IconShuffle = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M3 7h3.5c2 0 3 1 4.2 3l2.6 4c1.2 2 2.2 3 4.2 3H21M3 17h3.5c1.4 0 2.3-.5 3.1-1.4M21 7h-3.5c-1.4 0-2.3.5-3.1 1.4" /><path d="M18 4l3 3-3 3M18 14l3 3-3 3" /></svg>;
export const IconFlask = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3" /><path d="M7 15h10" /></svg>;
export const IconCopy = ({ size, ...p }: P) => <svg {...base(size)} {...p}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;
export const IconDownload = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>;
export const IconUpload = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 20V9M7 14l5-5 5 5M5 4h14" /></svg>;
export const IconClock = ({ size, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>;
export const IconSpark = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></svg>;
export const IconLock = ({ size, ...p }: P) => <svg {...base(size)} {...p}><rect x="5" y="11" width="14" height="9.5" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
export const IconEye = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></svg>;
export const IconFlame = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.4-5.2 3.6-8.3.2-.5.9-.6 1.2-.1 1 1.6 1.4 3 1.4 4.4 1-.8 1.6-1.8 1.9-3 .1-.5.8-.7 1.1-.2 1.4 2.1 3.8 4.2 3.8 7.3 0 3.5-2.6 6.1-6.5 6.1z" /></svg>;
export const IconBug = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 20c-3 0-5.5-2.5-5.5-6.5V10a5.5 5.5 0 0 1 11 0v3.5c0 4-2.5 6.5-5.5 6.5z" /><path d="M12 10v10M6.5 13H3M21 13h-3.5M7 7.5 4.5 5M17 7.5 19.5 5" /></svg>;
export const IconChat = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M4 5.5h16v10H9l-5 4z" /><path d="M8 10h8" /></svg>;
