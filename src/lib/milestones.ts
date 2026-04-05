export const CHECKIN_MILESTONES = [
  { threshold: 50, label: "50 runs", color: "bg-amber-400/15 text-amber-600", darkColor: "bg-amber-400/20 text-amber-300" },
  { threshold: 25, label: "25 runs", color: "bg-purple-400/15 text-purple-600", darkColor: "bg-purple-400/20 text-purple-300" },
  { threshold: 10, label: "10 runs", color: "bg-navy/10 text-navy", darkColor: "bg-white/10 text-white/80" },
  { threshold: 5, label: "5 runs", color: "bg-emerald-400/15 text-emerald-700", darkColor: "bg-emerald-400/20 text-emerald-300" },
] as const;

export function getMilestone(totalCheckins: number) {
  return CHECKIN_MILESTONES.find((m) => totalCheckins >= m.threshold) ?? null;
}
