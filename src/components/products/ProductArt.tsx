import type { Product } from '../../types';

/** Clean vector stand-ins for product photography. */
export function ProductArt({ p, className = '' }: { p: Product; className?: string }) {
  const t = p.tint;
  const bg = p.category === 'Frames' ? '#F3F6F9' : p.category === 'Lenses' ? '#EEF4FB' : p.category === 'Contact Lenses' ? '#EEF6F5' : '#F5F4F1';
  return (
    <svg viewBox="0 0 240 150" className={`product-art ${className}`} role="img" aria-label={p.name}>
      <rect width="240" height="150" fill={bg} />
      {p.category === 'Frames' && <Frame shape={p.shape ?? 'rect'} tint={t} />}
      {p.category === 'Lenses' && (
        <g>
          <ellipse cx="120" cy="75" rx="48" ry="48" fill={t} opacity="0.12" />
          <ellipse cx="120" cy="75" rx="40" ry="40" fill="#fff" stroke={t} strokeWidth="2" />
          <path d="M92 60 q20 -18 46 -8" stroke={t} strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
          {p.group === 'Progressive Lens' && <path d="M100 95 q20 10 40 0" stroke={t} strokeWidth="1.5" fill="none" strokeDasharray="3 3" />}
          {p.group === 'Blue Cut Lens' && <circle cx="120" cy="75" r="40" fill="#5aa0e0" opacity="0.12" />}
          {p.group === 'Photochromic Lens' && <path d="M80 75 a40 40 0 0 0 80 0 z" fill={t} opacity="0.35" />}
        </g>
      )}
      {p.category === 'Contact Lenses' && (
        <g>
          <rect x="62" y="38" width="116" height="74" rx="10" fill="#fff" stroke={t} strokeWidth="2" />
          <rect x="62" y="38" width="116" height="18" rx="10" fill={t} opacity="0.9" />
          <circle cx="98" cy="84" r="16" fill={t} opacity="0.15" stroke={t} />
          <circle cx="142" cy="84" r="16" fill={t} opacity="0.15" stroke={t} />
        </g>
      )}
      {p.category === 'Accessories' && (
        <g>
          <rect x="60" y="52" width="120" height="50" rx="25" fill={t} opacity="0.9" />
          <rect x="70" y="60" width="100" height="6" rx="3" fill="#fff" opacity="0.25" />
        </g>
      )}
    </svg>
  );
}

function Frame({ shape, tint }: { shape: NonNullable<Product['shape']>; tint: string }) {
  const sw = shape === 'aviator' || shape === 'round' ? 3 : 6;
  const lens = (cx: number) => {
    switch (shape) {
      case 'round':
        return <circle cx={cx} cy="78" r="26" />;
      case 'aviator':
        return <path d={`M${cx - 30} 64 q0 -6 8 -6 h44 q8 0 8 6 q0 30 -30 34 q-30 -4 -30 -34 z`} />;
      case 'cateye':
        return <path d={`M${cx - 30} 66 q10 -14 58 -8 q2 30 -26 36 q-30 0 -32 -28 z`} />;
      case 'wayfarer':
        return <path d={`M${cx - 30} 60 h60 q2 0 0 8 l-6 22 q-2 6 -8 6 h-32 q-6 0 -8 -6 l-6 -22 q-2 -8 0 -8 z`} />;
      default:
        return <rect x={cx - 29} y="60" width="58" height="36" rx="8" />;
    }
  };
  return (
    <g fill="#fff" fillOpacity="0.55" stroke={tint} strokeWidth={sw} strokeLinejoin="round">
      {lens(84)}
      {lens(156)}
      <path d="M114 70 q6 -6 12 0" fill="none" strokeWidth={Math.min(sw, 4)} />
      <path d="M54 66 l-18 -4" fill="none" strokeLinecap="round" strokeWidth={Math.min(sw, 4)} />
      <path d="M186 66 l18 -4" fill="none" strokeLinecap="round" strokeWidth={Math.min(sw, 4)} />
    </g>
  );
}
