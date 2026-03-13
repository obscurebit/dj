import React from "react";

export interface VinylArtDef {
  id: string;
  name: string;
  unlockAt: number;
}

// Art definitions — rendering is handled in the component via artId
export const VINYL_ART: VinylArtDef[] = [
  { id: "dj", name: "DJ", unlockAt: 0 },
  { id: "cat", name: "Stray Cat", unlockAt: 3000 },
  { id: "fox", name: "Night Fox", unlockAt: 4000 },
  { id: "bear", name: "Honey Bear", unlockAt: 5000 },
  { id: "octopus", name: "Deep Eight", unlockAt: 6000 },
  { id: "eye", name: "Third Eye", unlockAt: 7500 },
  { id: "wave", name: "Sine Wave", unlockAt: 9000 },
];

// Inline SVG art for vinyl center label — small, monochrome, looks good spinning
export function VinylArtSVG({ artId }: { artId: string }) {
  const size = 28;
  const s = { width: size, height: size, display: "block" as const };
  const fill = "rgba(255,255,255,0.85)";

  switch (artId) {
    case "cat":
      return (
        <svg viewBox="0 0 32 32" style={s}>
          <path
            d="M6 28V12l4-8 2 6h8l2-6 4 8v16H6z M11 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M21 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M14 24l2 2 2-2"
            fill={fill}
            stroke="none"
          />
        </svg>
      );
    case "fox":
      return (
        <svg viewBox="0 0 32 32" style={s}>
          <path
            d="M16 28L4 16l4-12 4 6h8l4-6 4 12-12 12z M11 16a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z M21 16a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z M16 21l-2 2h4l-2-2z"
            fill={fill}
            stroke="none"
          />
        </svg>
      );
    case "bear":
      return (
        <svg viewBox="0 0 32 32" style={s}>
          <circle cx="8" cy="8" r="4" fill={fill} />
          <circle cx="24" cy="8" r="4" fill={fill} />
          <ellipse cx="16" cy="18" rx="10" ry="11" fill={fill} />
          <circle cx="12" cy="15" r="1.5" fill="#000" opacity="0.6" />
          <circle cx="20" cy="15" r="1.5" fill="#000" opacity="0.6" />
          <ellipse cx="16" cy="19" rx="3" ry="2" fill="#000" opacity="0.3" />
        </svg>
      );
    case "octopus":
      return (
        <svg viewBox="0 0 32 32" style={s}>
          <ellipse cx="16" cy="12" rx="8" ry="7" fill={fill} />
          <circle cx="13" cy="11" r="1.5" fill="#000" opacity="0.6" />
          <circle cx="19" cy="11" r="1.5" fill="#000" opacity="0.6" />
          <path
            d="M8 18c-2 4 0 8 2 10 M11 18c-1 4 0 7 1 9 M14 19c0 4 0 7 0 9 M18 19c0 4 0 7 0 9 M21 18c1 4 0 7-1 9 M24 18c2 4 0 8-2 10"
            fill="none"
            stroke={fill}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "eye":
      return (
        <svg viewBox="0 0 32 32" style={s}>
          <path
            d="M16 8C8 8 2 16 2 16s6 8 14 8 14-8 14-8-6-8-14-8z"
            fill="none"
            stroke={fill}
            strokeWidth="1.5"
          />
          <circle cx="16" cy="16" r="5" fill={fill} />
          <circle cx="16" cy="16" r="2" fill="#000" opacity="0.6" />
          <line x1="16" y1="2" x2="16" y2="7" stroke={fill} strokeWidth="1" />
          <line x1="16" y1="25" x2="16" y2="30" stroke={fill} strokeWidth="1" />
          <line x1="4" y1="8" x2="7" y2="11" stroke={fill} strokeWidth="1" />
          <line x1="28" y1="8" x2="25" y2="11" stroke={fill} strokeWidth="1" />
        </svg>
      );
    case "wave":
      return (
        <svg viewBox="0 0 32 32" style={s}>
          <path
            d="M2 16c2-6 4-6 6 0s4 6 6 0 4-6 6 0 4 6 6 0 4-6 6 0"
            fill="none"
            stroke={fill}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M2 22c2-4 4-4 6 0s4 4 6 0 4-4 6 0 4 4 6 0 4-4 6 0"
            fill="none"
            stroke={fill}
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d="M2 10c2-4 4-4 6 0s4 4 6 0 4-4 6 0 4 4 6 0 4-4 6 0"
            fill="none"
            stroke={fill}
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      );
    default:
      return null;
  }
}

export default VINYL_ART;
