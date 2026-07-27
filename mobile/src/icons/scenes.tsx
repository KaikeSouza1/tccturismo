import type { ReactElement } from "react";

interface SceneProps {
  size?: number;
}

export function CulturalScene({ size = 56 }: SceneProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="cul-bg" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#EAF4FC" />
          <stop offset="100%" stopColor="#CFE7F8" />
        </linearGradient>
        <linearGradient id="cul-body" x1="20" y1="30" x2="44" y2="52">
          <stop offset="0%" stopColor="#1876C4" />
          <stop offset="100%" stopColor="#0B5FA5" />
        </linearGradient>
        <linearGradient id="cul-roof" x1="20" y1="18" x2="44" y2="30">
          <stop offset="0%" stopColor="#136099" />
          <stop offset="100%" stopColor="#0D3A63" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="6" fill="url(#cul-bg)" />
      <ellipse cx="32" cy="53" rx="17" ry="2.6" fill="#0D3A63" opacity="0.12" />
      <rect x="20" y="30" width="24" height="22" fill="url(#cul-body)" />
      <path d="M20 30l12-12 12 12z" fill="url(#cul-roof)" />
      <rect x="30.5" y="13" width="3" height="8" fill="#0D3A63" />
      <path d="M29.7 13h4.6l-2.3-4.3z" fill="#0D3A63" />
      <circle cx="32" cy="38" r="4.5" fill="#EAF4FC" stroke="#0D3A63" strokeWidth="1.4" />
      <rect x="24" y="44" width="4" height="8" rx="0.5" fill="#EAF4FC" opacity="0.9" />
      <rect x="36" y="44" width="4" height="8" rx="0.5" fill="#EAF4FC" opacity="0.9" />
    </svg>
  );
}

export function HistoricScene({ size = 56 }: SceneProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="his-bg" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#F3E6CC" />
          <stop offset="100%" stopColor="#E3C793" />
        </linearGradient>
        <linearGradient id="his-body" x1="10" y1="30" x2="54" y2="50">
          <stop offset="0%" stopColor="#A06B37" />
          <stop offset="100%" stopColor="#7C4F28" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="6" fill="url(#his-bg)" />
      <ellipse cx="32" cy="53" rx="19" ry="2.6" fill="#5B3A1C" opacity="0.15" />
      <path d="M12 46c4-6 6-10 6-10h6c0-4 2-6 2-6h12c0 0 2 2 2 6h6s2 4 6 10z" fill="url(#his-body)" />
      <rect x="10" y="46" width="44" height="4" fill="#5B3A1C" />
      <circle cx="22" cy="52" r="3" fill="#1E2A3A" />
      <circle cx="42" cy="52" r="3" fill="#1E2A3A" />
      <rect x="26" y="24" width="4" height="10" fill="#7C4F28" />
      <path d="M22 24c2-6 6-9 10-9s8 3 10 9z" fill="#B5432E" />
      <circle cx="17" cy="19" r="3.4" fill="#FFFDF7" opacity="0.85" />
      <circle cx="12" cy="15" r="2.4" fill="#FFFDF7" opacity="0.6" />
    </svg>
  );
}

export function NatureScene({ size = 56 }: SceneProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="nat-bg" x1="0" y1="0" x2="0" y2="64">
          <stop offset="0%" stopColor="#E4F5EC" />
          <stop offset="100%" stopColor="#CBEBDA" />
        </linearGradient>
        <linearGradient id="nat-hill1" x1="0" y1="30" x2="64" y2="52">
          <stop offset="0%" stopColor="#2FA771" />
          <stop offset="100%" stopColor="#1B7A4D" />
        </linearGradient>
        <linearGradient id="nat-hill2" x1="0" y1="38" x2="64" y2="58">
          <stop offset="0%" stopColor="#1B7A4D" />
          <stop offset="100%" stopColor="#146641" />
        </linearGradient>
        <linearGradient id="nat-river" x1="0" y1="50" x2="64" y2="62">
          <stop offset="0%" stopColor="#2F92DD" />
          <stop offset="100%" stopColor="#0B5FA5" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="6" fill="url(#nat-bg)" />
      <circle cx="48" cy="16" r="6" fill="#F6D77A" opacity="0.9" />
      <path d="M0 40l14-16 10 10 12-18 14 18 14-8v18z" fill="url(#nat-hill1)" />
      <path d="M0 46l16-10 12 8 14-14 14 12 8-6v18h-64z" fill="url(#nat-hill2)" />
      <path d="M0 52c8-4 14-2 20 0s16-2 24 0 14 0 20-2v10h-64z" fill="url(#nat-river)" opacity="0.92" />
    </svg>
  );
}

export function LeisureScene({ size = 56 }: SceneProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="lei-bg" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#FDF1DA" />
          <stop offset="100%" stopColor="#FBE3B8" />
        </linearGradient>
        <linearGradient id="lei-tree" x1="12" y1="18" x2="52" y2="42">
          <stop offset="0%" stopColor="#2FA771" />
          <stop offset="100%" stopColor="#1B7A4D" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="6" fill="url(#lei-bg)" />
      <ellipse cx="32" cy="57" rx="18" ry="2.4" fill="#7C4F28" opacity="0.15" />
      <circle cx="46" cy="16" r="7" fill="#E8951F" />
      <path d="M32 54v-16" stroke="#7C4F28" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="26" r="12" fill="url(#lei-tree)" />
      <circle cx="20" cy="34" r="8" fill="#146641" />
      <circle cx="44" cy="34" r="8" fill="#146641" />
      <rect x="16" y="52" width="32" height="4" rx="1.5" fill="#7C4F28" />
      <rect x="20" y="56" width="4" height="4" fill="#5B3A1C" />
      <rect x="40" y="56" width="4" height="4" fill="#5B3A1C" />
    </svg>
  );
}

export function DefaultScene({ size = 56 }: SceneProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="def-bg" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#EAF4FC" />
          <stop offset="100%" stopColor="#CFE7F8" />
        </linearGradient>
        <linearGradient id="def-star" x1="17" y1="12" x2="47" y2="52">
          <stop offset="0%" stopColor="#1876C4" />
          <stop offset="100%" stopColor="#0D3A63" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="6" fill="url(#def-bg)" />
      <path d="M32 12l6 14 15 2-11 10 3 15-13-8-13 8 3-15-11-10 15-2z" fill="url(#def-star)" />
    </svg>
  );
}

const SCENES: Record<string, (props: SceneProps) => ReactElement> = {
  cultural: CulturalScene,
  historico: HistoricScene,
  natureza: NatureScene,
  lazer: LeisureScene,
};

export function CategoryScene({ category, size }: { category?: string | null; size?: number }) {
  const Scene = (category && SCENES[category]) || DefaultScene;
  return <Scene size={size} />;
}
