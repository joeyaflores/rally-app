// Brand progression: sage → cream → gold → forest. Each tier more saturated than the last.
export const CHECKIN_MILESTONES = [
  {
    threshold: 50,
    label: "50 runs",
    color: "bg-navy text-warm-muted",
    darkColor: "bg-navy text-warm-muted",
  },
  {
    threshold: 25,
    label: "25 runs",
    color: "bg-warm/20 text-navy",
    darkColor: "bg-warm/30 text-warm-light",
  },
  {
    threshold: 10,
    label: "10 runs",
    color: "bg-warm-muted text-navy",
    darkColor: "bg-warm-muted/25 text-warm-muted",
  },
  {
    threshold: 5,
    label: "5 runs",
    color: "bg-navy-light/25 text-navy",
    darkColor: "bg-navy-light/30 text-navy-light",
  },
] as const;

export function getMilestone(totalCheckins: number) {
  return CHECKIN_MILESTONES.find((m) => totalCheckins >= m.threshold) ?? null;
}
