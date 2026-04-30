import type { CSSProperties, ReactNode } from "react";

// ─── Stage thresholds — aligned with CHECKIN_MILESTONES ───
type Stage = "sprout" | "sapling" | "young" | "mature" | "branched" | "blooming";

const STAGE_THRESHOLDS: Array<{ min: number; stage: Stage }> = [
  { min: 50, stage: "blooming" },
  { min: 25, stage: "branched" },
  { min: 10, stage: "mature" },
  { min: 5, stage: "young" },
  { min: 2, stage: "sapling" },
  { min: 1, stage: "sprout" },
];

export function pickCactusStage(checkins: number): Stage {
  return STAGE_THRESHOLDS.find((t) => checkins >= t.min)?.stage ?? "sprout";
}

// ─── Hoisted SVG fragments (rendering-hoist-jsx) ───
// viewBox: 0 0 64 96
// layout: cactus y=12-66 · soil rim y=66 · pot rim y=66-70 · pot body y=70-90

// ─── Pot (cream ceramic, classic terracotta-style trapezoid) ───
const POT_BACK = (
  <g key="pot-back">
    {/* Body (trapezoid, drawn first / behind cactus base) */}
    <path
      d="M14 70 L50 70 L47 88 Q47 90 45 90 L19 90 Q17 90 17 88 Z"
      fill="var(--secondary)"
    />
    {/* Subtle inner shadow at top of body where rim meets */}
    <path
      d="M14 70 L50 70 L49.5 71.5 L14.5 71.5 Z"
      fill="rgba(0,0,0,0.08)"
    />
  </g>
);

const POT_RIM = (
  <g key="pot-rim">
    {/* Rim — slightly wider than body, sits in front of cactus base */}
    <rect x="11" y="66" width="42" height="5" rx="1" fill="var(--secondary)" />
    {/* Highlight on top edge */}
    <rect
      x="12"
      y="66.5"
      width="40"
      height="0.6"
      fill="rgba(255,255,255,0.5)"
      rx="0.3"
    />
    {/* Shadow line where rim meets body */}
    <rect x="13" y="70" width="38" height="0.6" fill="rgba(0,0,0,0.08)" />
  </g>
);

// ─── Soil visible on top of pot, in front of cactus base ───
const SOIL = (
  <g key="soil">
    <ellipse cx="32" cy="66" rx="19" ry="1.4" fill="rgba(140,90,30,0.55)" />
    <ellipse cx="32" cy="65.6" rx="19" ry="0.5" fill="rgba(244,205,11,0.4)" />
    <circle cx="20" cy="66" r="0.45" fill="rgba(244,205,11,0.7)" />
    <circle cx="44" cy="65.8" r="0.5" fill="rgba(244,205,11,0.7)" />
    <circle cx="32" cy="65.4" r="0.35" fill="rgba(244,205,11,0.55)" />
  </g>
);

// ─── Cactus body silhouettes (sage green, layered rounded rects, single fill) ───
// All cactus bodies extend down to y=68 so the rim/soil cleanly cover the base.

const SPROUT_BODY = (
  <g key="sprout">
    {/* Tiny stem */}
    <rect x="31" y="58" width="2" height="10" rx="1" fill="var(--color-navy-light)" />
    {/* Two cotyledon leaves */}
    <ellipse
      cx="27"
      cy="56"
      rx="3.5"
      ry="1.8"
      fill="var(--color-navy-light)"
      transform="rotate(-28 27 56)"
    />
    <ellipse
      cx="37"
      cy="56"
      rx="3.5"
      ry="1.8"
      fill="var(--color-navy-light)"
      transform="rotate(28 37 56)"
    />
  </g>
);

const SAPLING_BODY = (
  <rect
    key="sap"
    x="26"
    y="44"
    width="12"
    height="24"
    rx="6"
    fill="var(--color-navy-light)"
  />
);

const YOUNG_BODY = (
  <g key="yng">
    <rect x="26" y="30" width="12" height="38" rx="6" fill="var(--color-navy-light)" />
    {/* arm bud — small bump on right */}
    <rect x="38" y="46" width="6" height="8" rx="3" fill="var(--color-navy-light)" />
  </g>
);

const MATURE_SILHOUETTE = (
  <g key="mat" fill="var(--color-navy-light)">
    {/* main column */}
    <rect x="26" y="14" width="12" height="54" rx="6" />
    {/* left arm: connector + vertical */}
    <rect x="14" y="38" width="14" height="8" rx="4" />
    <rect x="14" y="20" width="8" height="22" rx="4" />
    {/* right arm: connector + vertical */}
    <rect x="36" y="38" width="14" height="8" rx="4" />
    <rect x="42" y="20" width="8" height="22" rx="4" />
  </g>
);

// ─── Subtle gold ridge accents (1 per body section, very faint) ───
const RIDGE_SAPLING = (
  <line
    key="rid-sap"
    x1="32"
    y1="48"
    x2="32"
    y2="64"
    stroke="var(--color-warm-light)"
    strokeWidth="0.5"
    strokeLinecap="round"
    opacity="0.4"
  />
);

const RIDGE_YOUNG = (
  <line
    key="rid-yng"
    x1="32"
    y1="34"
    x2="32"
    y2="64"
    stroke="var(--color-warm-light)"
    strokeWidth="0.5"
    strokeLinecap="round"
    opacity="0.4"
  />
);

const RIDGE_MATURE = (
  <g
    key="rid-mat"
    stroke="var(--color-warm-light)"
    strokeWidth="0.5"
    strokeLinecap="round"
    opacity="0.4"
    fill="none"
  >
    <line x1="32" y1="18" x2="32" y2="64" />
    <line x1="18" y1="24" x2="18" y2="40" />
    <line x1="46" y1="24" x2="46" y2="40" />
  </g>
);

// ─── Flowers ───
const FLOWER_BUD = (
  <g key="bud">
    {/* main bud on top of body */}
    <ellipse cx="32" cy="11" rx="2.6" ry="3.6" fill="var(--color-warm-light)" />
    <ellipse cx="32" cy="10.2" rx="1.2" ry="2" fill="rgba(255,255,255,0.5)" />
    {/* small buds atop arms */}
    <ellipse cx="18" cy="18" rx="1.7" ry="2.3" fill="var(--color-warm-light)" />
    <ellipse cx="46" cy="18" rx="1.7" ry="2.3" fill="var(--color-warm-light)" />
  </g>
);

const FLOWER_OPEN = (
  <g key="bloom">
    {/* main flower (8 petals, large) */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
      <ellipse
        key={angle}
        cx="32"
        cy="9"
        rx="2.4"
        ry="4.2"
        fill="var(--color-warm-light)"
        opacity="0.92"
        transform={`rotate(${angle} 32 13)`}
      />
    ))}
    <circle cx="32" cy="13" r="2" fill="rgba(255,255,255,0.95)" />
    <circle cx="32" cy="13" r="0.9" fill="var(--color-warm)" />

    {/* small flowers atop each arm */}
    <g opacity="0.9">
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <ellipse
          key={`l-${angle}`}
          cx="18"
          cy="16"
          rx="1.4"
          ry="2.3"
          fill="var(--color-warm-light)"
          transform={`rotate(${angle} 18 18.5)`}
        />
      ))}
      <circle cx="18" cy="18.5" r="1" fill="rgba(255,255,255,0.9)" />

      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <ellipse
          key={`r-${angle}`}
          cx="46"
          cy="16"
          rx="1.4"
          ry="2.3"
          fill="var(--color-warm-light)"
          transform={`rotate(${angle} 46 18.5)`}
        />
      ))}
      <circle cx="46" cy="18.5" r="1" fill="rgba(255,255,255,0.9)" />
    </g>
  </g>
);

// ─── Stage compositions ───
// Layer order: pot body → cactus body → pot rim → soil → ridge → flower
// (rim+soil are drawn AFTER cactus to cover its base cleanly)
const STAGE_LAYERS: Record<Stage, ReactNode[]> = {
  sprout: [POT_BACK, SPROUT_BODY, POT_RIM, SOIL],
  sapling: [POT_BACK, SAPLING_BODY, POT_RIM, SOIL, RIDGE_SAPLING],
  young: [POT_BACK, YOUNG_BODY, POT_RIM, SOIL, RIDGE_YOUNG],
  mature: [POT_BACK, MATURE_SILHOUETTE, POT_RIM, SOIL, RIDGE_MATURE],
  branched: [
    POT_BACK,
    MATURE_SILHOUETTE,
    POT_RIM,
    SOIL,
    RIDGE_MATURE,
    FLOWER_BUD,
  ],
  blooming: [
    POT_BACK,
    MATURE_SILHOUETTE,
    POT_RIM,
    SOIL,
    RIDGE_MATURE,
    FLOWER_OPEN,
  ],
};

// ─── Per-stage y-offset to center each composition in the 96-tall viewBox ───
// Content extents (y-range top → 90 = pot bottom):
//   sprout:   54..90  (h=36, center=72)  → offset 48-72 = -24
//   sapling:  44..90  (h=46, center=67)  → offset 48-67 = -19
//   young:    30..90  (h=60, center=60)  → offset 48-60 = -12
//   mature:   14..90  (h=76, center=52)  → offset 48-52 = -4
//   branched:  7..90  (h=83, center=48.5)→ offset ≈ 0
//   blooming:  4..90  (h=86, center=47)  → offset ≈ 1
const STAGE_Y_OFFSET: Record<Stage, number> = {
  sprout: -24,
  sapling: -19,
  young: -12,
  mature: -4,
  branched: 0,
  blooming: 1,
};

interface Props {
  checkins: number;
  className?: string;
  style?: CSSProperties;
}

export function GrowingCactus({ checkins, className, style }: Props) {
  const stage = pickCactusStage(checkins);
  const dy = STAGE_Y_OFFSET[stage];
  return (
    <svg
      viewBox="0 0 64 96"
      className={className}
      style={style}
      aria-hidden
      role="presentation"
    >
      <g transform={dy ? `translate(0 ${dy})` : undefined}>
        {STAGE_LAYERS[stage]}
      </g>
    </svg>
  );
}
