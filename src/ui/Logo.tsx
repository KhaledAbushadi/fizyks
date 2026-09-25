// شعار "فُكّها": عقدة سلك بتتفك وتتحول لخط مستقيم فيه شرارة
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="#1b2a4a" />
      <path d="M8 30 C 10 14, 22 14, 20 24 S 12 34, 18 34 S 26 24, 30 24 L 40 24" fill="none" stroke="#ffc23d" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="24" r="3.2" fill="#ffc23d" />
      <path d="M40 15 v4 M40 29 v4 M46 24 h-2" stroke="#ffc23d" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

export function Wordmark() {
  return <span className="text-2xl leading-none font-bold tracking-tight">فيزكس</span>;
}
