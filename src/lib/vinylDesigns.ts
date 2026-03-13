export interface VinylDesign {
  id: string;
  name: string;
  labelGradient: string;
  grooveColor: string;
  glowColor: string;
  unlockScore: number;
}

const VINYL_DESIGNS: VinylDesign[] = [
  {
    id: "classic",
    name: "Classic",
    labelGradient: "linear-gradient(135deg, #a855f7, #ec4899, #f59e0b)",
    grooveColor: "rgba(168, 85, 247, 0.06)",
    glowColor: "168, 85, 247",
    unlockScore: 0,
  },
  {
    id: "ember",
    name: "Ember",
    labelGradient: "linear-gradient(135deg, #ef4444, #f97316, #eab308)",
    grooveColor: "rgba(239, 68, 68, 0.07)",
    glowColor: "239, 68, 68",
    unlockScore: 0,
  },
  {
    id: "drift",
    name: "Drift",
    labelGradient: "linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)",
    grooveColor: "rgba(59, 130, 246, 0.07)",
    glowColor: "59, 130, 246",
    unlockScore: 0,
  },
  {
    id: "moss",
    name: "Moss",
    labelGradient: "linear-gradient(135deg, #84cc16, #22c55e, #06b6d4)",
    grooveColor: "rgba(34, 197, 94, 0.07)",
    glowColor: "34, 197, 94",
    unlockScore: 0,
  },
  {
    id: "nebula",
    name: "Nebula",
    labelGradient: "linear-gradient(135deg, #7c3aed, #2563eb, #06b6d4)",
    grooveColor: "rgba(124, 58, 237, 0.08)",
    glowColor: "124, 58, 237",
    unlockScore: 50,
  },
  {
    id: "honey",
    name: "Honey",
    labelGradient: "linear-gradient(135deg, #f59e0b, #d97706, #b45309)",
    grooveColor: "rgba(245, 158, 11, 0.08)",
    glowColor: "245, 158, 11",
    unlockScore: 100,
  },
  {
    id: "slate",
    name: "Slate",
    labelGradient: "linear-gradient(135deg, #64748b, #334155, #0f172a)",
    grooveColor: "rgba(100, 116, 139, 0.08)",
    glowColor: "100, 116, 139",
    unlockScore: 200,
  },
  {
    id: "prism",
    name: "Prism",
    labelGradient: "linear-gradient(135deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6)",
    grooveColor: "rgba(168, 85, 247, 0.1)",
    glowColor: "236, 72, 153",
    unlockScore: 500,
  },
];

export default VINYL_DESIGNS;
