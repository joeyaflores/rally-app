"use client";

import { useState, useTransition, useMemo } from "react";
import { Search, Download, Mail, Phone } from "lucide-react";
import type { Runner } from "@/lib/runners";
import { getRunnersCSV, deleteRunner } from "@/lib/runners";
import { formatDate, displayName, formatPhone } from "@/lib/format";
import { getMilestone } from "@/lib/milestones";
import config from "@rally";

type SortKey = "checkins" | "recent" | "name";

export function RunnersList({ initial }: { initial: Runner[] }) {
  const [runners, setRunners] = useState(initial);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("checkins");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    let list = runners;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.name?.toLowerCase().includes(q) ?? false) ||
          (r.first_name?.toLowerCase().includes(q) ?? false) ||
          (r.last_name?.toLowerCase().includes(q) ?? false) ||
          r.email.toLowerCase().includes(q) ||
          (r.phone?.includes(q) ?? false)
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "checkins") return b.total_checkins - a.total_checkins;
      if (sort === "recent") {
        const aDate = a.last_checkin ?? a.created_at;
        const bDate = b.last_checkin ?? b.created_at;
        return bDate.localeCompare(aDate);
      }
      const aName = a.last_name || a.first_name || a.name || a.email;
      const bName = b.last_name || b.first_name || b.name || b.email;
      return aName.localeCompare(bName);
    });
  }, [runners, search, sort]);

  // Stats — single pass
  const stats = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    let checkedIn = 0;
    let regulars = 0;
    let newThisMonth = 0;
    for (const r of runners) {
      if (r.source === "checkin") {
        checkedIn++;
        if (r.total_checkins >= 5) regulars++;
      }
      const joinDate = r.first_checkin ?? r.created_at;
      const d = new Date(joinDate.includes("T") ? joinDate : joinDate + "T00:00:00");
      if (d.getMonth() === curMonth && d.getFullYear() === curYear) newThisMonth++;
    }
    return { total: runners.length, checkedIn, regulars, newThisMonth };
  }, [runners]);

  function handleExport() {
    startTransition(async () => {
      try {
        const csv = await getRunnersCSV();
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${config.shortName.toLowerCase()}-${config.terms.member}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        // Non-critical
      }
    });
  }

  function handleDelete(id: string, source: "checkin" | "subscribe") {
    if (source !== "subscribe") return;
    startTransition(async () => {
      await deleteRunner(id, source);
      setRunners((prev) => prev.filter((r) => r.id !== id));
    });
  }

  return (
    <div>
      {/* Quick stats */}
      {stats.total > 0 && (
        <div className="mb-5 grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-border/50 bg-white px-3 py-3 text-center shadow-sm">
            <p className="font-stat text-2xl tabular-nums tracking-wide text-navy">{stats.total}</p>
            <p className="font-display text-[10px] uppercase text-muted-foreground/50">total</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-white px-3 py-3 text-center shadow-sm">
            <p className="font-stat text-2xl tabular-nums tracking-wide text-navy">{stats.checkedIn}</p>
            <p className="font-display text-[10px] uppercase text-muted-foreground/50">showed up</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-white px-3 py-3 text-center shadow-sm">
            <p className="font-stat text-2xl tabular-nums tracking-wide text-navy">{stats.regulars}</p>
            <p className="font-display text-[10px] uppercase text-muted-foreground/50">regulars</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-white px-3 py-3 text-center shadow-sm">
            <p className="font-stat text-2xl tabular-nums tracking-wide text-navy">{stats.newThisMonth}</p>
            <p className="font-display text-[10px] uppercase text-muted-foreground/50">new this mo</p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm">
        {/* Toolbar */}
        {stats.total > 0 && (
          <div className="flex items-center gap-2 border-b border-border/30 px-5 py-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" aria-hidden="true" />
              <input
                type="text"
                name="search-runners"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`search ${config.terms.member}…`}
                aria-label={`Search ${config.terms.member}`}
                className="w-full rounded-lg border border-border/50 bg-secondary/20 py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus-visible:border-navy/30 focus-visible:ring-1 focus-visible:ring-navy/10"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort order"
              className="rounded-lg border border-border/50 bg-secondary/20 px-2 py-2 text-xs text-muted-foreground outline-none focus-visible:border-navy/30 focus-visible:ring-1 focus-visible:ring-navy/10"
            >
              <option value="checkins">most runs</option>
              <option value="recent">most recent</option>
              <option value="name">name</option>
            </select>
            <button
              onClick={handleExport}
              disabled={isPending}
              aria-label="Export CSV"
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border/50 bg-secondary/20 px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:border-navy/20 hover:text-navy disabled:opacity-50"
            >
              <Download className="h-3 w-3" aria-hidden="true" />
              <span className="hidden sm:inline">csv</span>
            </button>
          </div>
        )}

        {/* List */}
        {filtered.length > 0 ? (
          <div className="divide-y divide-border/30">
            {filtered.map((r) => {
              const milestone = r.total_checkins > 0 ? getMilestone(r.total_checkins) : null;
              const isSubscriberOnly = r.source === "subscribe";

              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {isSubscriberOnly ? (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warm/10">
                        <Mail className="h-3.5 w-3.5 text-warm/60" aria-hidden="true" />
                      </span>
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy/[0.06] font-stat text-sm tabular-nums text-navy">
                        {r.total_checkins}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {(r.first_name || r.name) ? (
                          <span className="truncate text-sm font-medium text-foreground">
                            {displayName(r.first_name, r.last_name, r.name) || r.email}
                          </span>
                        ) : (
                          <span className="truncate text-sm text-foreground">
                            {r.email}
                          </span>
                        )}
                        {milestone && (
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${milestone.color}`}>
                            {milestone.label}
                          </span>
                        )}
                        {isSubscriberOnly && (
                          <span className="shrink-0 rounded-full bg-warm/10 px-2 py-0.5 text-[10px] font-medium text-warm">
                            via /join
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        {(r.first_name || r.name) && (
                          <span className="truncate text-xs text-muted-foreground/40">
                            {r.email}
                          </span>
                        )}
                        {r.phone && (
                          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground/30">
                            <Phone className="h-2.5 w-2.5" aria-hidden="true" />
                            <span className="tabular-nums">{formatPhone(r.phone)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {r.first_checkin ? (
                      <>
                        <p className="text-[10px] text-muted-foreground/40">
                          first {formatDate(r.first_checkin)}
                        </p>
                        <p className="text-[10px] text-muted-foreground/30">
                          last {formatDate(r.last_checkin!)}
                        </p>
                      </>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/30">
                        joined {formatDate(r.created_at, { year: true })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : stats.total > 0 ? (
          <p className="px-5 py-6 text-center font-display text-sm uppercase text-muted-foreground">
            no matches for &ldquo;{search}&rdquo;
          </p>
        ) : (
          <p className="px-5 py-6 text-center font-display text-sm uppercase text-muted-foreground">
            no {config.terms.member} yet &mdash; they&apos;ll appear after check-in or signing up at /join
          </p>
        )}
      </div>
    </div>
  );
}
