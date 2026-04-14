"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type Tab = "runners" | "partners";

interface NeighborsTabsProps {
  runnersCount: number;
  partnersCount: number;
  runnersContent: ReactNode;
  partnersContent: ReactNode;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "runners", label: "runners" },
  { key: "partners", label: "partners" },
];

export function NeighborsTabs({
  runnersCount,
  partnersCount,
  runnersContent,
  partnersContent,
}: NeighborsTabsProps) {
  const [active, setActive] = useState<Tab>("runners");

  const counts: Record<Tab, number> = {
    runners: runnersCount,
    partners: partnersCount,
  };

  return (
    <div>
      {/* Segmented control */}
      <div className="mb-8 flex items-center justify-center">
        <div
          role="tablist"
          className="inline-flex items-center gap-1 rounded-xl border border-border/50 bg-white p-1 shadow-sm"
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active === tab.key}
              onClick={() => setActive(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 font-display text-sm uppercase tracking-wide transition-colors ${
                active === tab.key
                  ? "bg-navy text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span
                className={`tabular-nums rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                  active === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-navy/[0.06] text-navy/60"
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels */}
      <div role="tabpanel" aria-label={active === "runners" ? "Runners" : "Partners"}>
        {active === "runners" ? runnersContent : partnersContent}
      </div>
    </div>
  );
}
