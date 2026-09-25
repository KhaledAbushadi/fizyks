// "شرارة": شخصية صغيرة ترافق الطالب (برق مبتسم). المزاج يتغير حسب الموقف.
export type Mood = 'happy' | 'cheer' | 'think' | 'wave';

export function Mascot({ mood = 'happy', size = 72, className = '' }: { mood?: Mood; size?: number; className?: string }) {
  // الذراعان: [كتف، يد] لكل جهة
  const arms: Record<Mood, [number, number, number, number][]> = {
    happy: [[18, 46, 11, 52], [54, 46, 61, 52]],
    cheer: [[19, 38, 10, 25], [53, 38, 62, 25]],
    wave: [[18, 46, 11, 52], [53, 38, 63, 27]],
    think: [[18, 46, 11, 52], [52, 47, 44, 52]],
  };
  const mouth = mood === 'think' ? 'M32 50 h8' : mood === 'cheer' ? 'M29 47 q7 9 14 0 z' : 'M30 47 q6 6 12 0';
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" aria-hidden="true" className={className} style={{ direction: 'ltr', overflow: 'visible' }}>
      <ellipse cx="36" cy="68" rx="15" ry="2.6" fill="#000" opacity="0.1" />
      {arms[mood].map(([x1, y1, x2, y2], i) => (
        <g key={i}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2a1300" strokeWidth="3" strokeLinecap="round" />
          <circle cx={x2} cy={y2} r="3.4" fill="#ffc23d" stroke="#2a1300" strokeWidth="2" />
        </g>
      ))}
      <path d="M38 4 L28 18 H35 L31 28 L44 13 H37 Z" fill="#ff7a59" stroke="#2a1300" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="36" cy="44" r="19" fill="#ffc23d" stroke="#2a1300" strokeWidth="3" />
      <ellipse cx="29" cy="36" rx="5" ry="3" fill="#fff" opacity="0.45" />
      <circle cx="30" cy="42" r="2.8" fill="#2a1300" />
      <circle cx="42" cy="42" r="2.8" fill="#2a1300" />
      <circle cx="31" cy="41" r="0.9" fill="#fff" />
      <circle cx="43" cy="41" r="0.9" fill="#fff" />
      <circle cx="25" cy="48" r="2.6" fill="#ff7a59" opacity="0.55" />
      <circle cx="47" cy="48" r="2.6" fill="#ff7a59" opacity="0.55" />
      <path d={mouth} stroke="#2a1300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill={mood === 'cheer' ? '#2a1300' : 'none'} />
      {mood === 'think' && <text x="54" y="22" fontSize="15" fontWeight="700" fill="#7a5cf0">?</text>}
      {mood === 'cheer' && (
        <g stroke="#ff7a59" strokeWidth="2.2" strokeLinecap="round">
          <path d="M4 16 l4 3 M68 16 l-4 3 M2 30 h4 M70 30 h-4" />
        </g>
      )}
    </svg>
  );
}

const PRAISE = ['عاش!', 'بطل!', 'كده الشغل!', 'فكّيتها!', 'إيه الحلاوة دي!', 'مخك شغال!'];
export function praise(seed = Date.now()) {
  return PRAISE[seed % PRAISE.length];
}
