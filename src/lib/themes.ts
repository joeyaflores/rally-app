import type { SessionTheme } from "./checkin";

export interface ThemeConfig {
  bg: string;
  hex: string;
  circle1: string;
  circle2: string;
  label: string;
}

export const THEMES: Record<SessionTheme, ThemeConfig> = {
  navy: { bg: "bg-navy", hex: "#132C83", circle1: "bg-white/[0.02]", circle2: "bg-white/[0.015]", label: "navy" },
  green: { bg: "bg-[#1A6B3C]", hex: "#1A6B3C", circle1: "bg-white/[0.04]", circle2: "bg-white/[0.03]", label: "green" },
  orange: { bg: "bg-[#B84A1C]", hex: "#B84A1C", circle1: "bg-white/[0.03]", circle2: "bg-white/[0.025]", label: "orange" },
  black: { bg: "bg-[#111111]", hex: "#111111", circle1: "bg-white/[0.03]", circle2: "bg-white/[0.02]", label: "black" },
  pink: { bg: "bg-[#9B2C5E]", hex: "#9B2C5E", circle1: "bg-white/[0.03]", circle2: "bg-white/[0.025]", label: "pink" },
};

const VALID_THEMES = new Set<string>(Object.keys(THEMES));

/** Validate a theme string from the DB, falling back to navy. */
export function safeTheme(value: string): SessionTheme {
  return VALID_THEMES.has(value) ? (value as SessionTheme) : "navy";
}
