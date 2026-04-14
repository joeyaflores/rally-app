"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, type ReactNode } from "react";

type Tab = "pulse" | "growth";

const TABS: { id: Tab; label: string }[] = [
  { id: "pulse", label: "now" },
  { id: "growth", label: "numbers" },
];

export function DashboardTabs({
  pulseContent,
  growthContent,
}: {
  pulseContent: ReactNode;
  growthContent: ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = (searchParams.get("tab") as Tab) || "pulse";

  const setTab = useCallback(
    (tab: Tab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "pulse") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return (
    <>
      {/* Tab switcher */}
      <div className="flex items-center gap-1 rounded-full bg-secondary/70 p-1 backdrop-blur-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`relative rounded-full px-4 py-1.5 font-display text-xs font-medium uppercase tracking-wide transition-[color,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 ${
              activeTab === tab.id
                ? "bg-navy text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        key={activeTab}
        className="animate-fade-up motion-reduce:animate-none space-y-8"
        style={{ animationDuration: "0.3s" }}
      >
        {activeTab === "pulse" ? pulseContent : growthContent}
      </div>
    </>
  );
}
