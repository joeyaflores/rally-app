import { formatNumber, pctChange } from "@/lib/format";
import { TrendBadge } from "./trend-badge";
import type { DashboardData } from "@/lib/analytics-types";
import config from "@rally";

export function HeroStats({ data }: { data: DashboardData }) {
  const totalFollowers = data.ig.curr.followers + data.tt.curr.followers + data.strava.members;
  const prevTotalFollowers = data.ig.prev.followers + data.tt.prev.followers + data.strava.members;
  const totalAttendance = data.events.reduce((sum, e) => sum + e.attendance, 0);
  const totalViews = data.ig.curr.totalViews + data.tt.curr.totalViews;
  const prevTotalViews = data.ig.prev.totalViews + data.tt.prev.totalViews;
  const month = data.currentMonth.toLowerCase();
  const platformMonth = data.platformMonth.toLowerCase();
  const partial = data.isPartial;

  const stats = [
    {
      label: config.terms.community,
      value: formatNumber(totalFollowers),
      subtext: `${config.terms.member} as of ${platformMonth}`,
      trend: pctChange(totalFollowers, prevTotalFollowers),
    },
    {
      label: `${config.terms.member} who showed up`,
      value: totalAttendance.toLocaleString(),
      subtext: `${data.events.length} runs in ${month}${partial ? " so far" : ""}`,
      trend: null,
    },
    {
      label: "total views",
      value: formatNumber(totalViews),
      subtext: `ig + tiktok in ${platformMonth}`,
      trend: pctChange(totalViews, prevTotalViews),
    },
    {
      label: "engagement",
      value: formatNumber(data.ig.curr.likes + data.ig.curr.comments + data.ig.curr.shares + data.tt.curr.likes + data.tt.curr.comments + data.tt.curr.shares),
      subtext: `likes, comments & shares in ${platformMonth}`,
      trend: pctChange(
        data.ig.curr.likes + data.ig.curr.comments + data.ig.curr.shares + data.tt.curr.likes + data.tt.curr.comments + data.tt.curr.shares,
        data.ig.prev.likes + data.ig.prev.comments + data.ig.prev.shares + data.tt.prev.likes + data.tt.prev.comments + data.tt.prev.shares
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Context line */}
      <div className="flex items-center gap-2 px-1">
        <h2 className="font-display text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {month}
        </h2>
        <span className="text-[11px] text-muted-foreground/50">
          updated {data.lastUpdatedShort}
        </span>
      </div>

      {/* Mobile — single compact card */}
      <div className="animate-fade-up relative overflow-hidden rounded-2xl bg-navy text-white lg:hidden">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative grid grid-cols-2">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`p-4 ${i >= 2 ? "border-t border-white/[0.08]" : ""} ${i % 2 === 1 ? "border-l border-white/[0.08]" : ""}`}
            >
              <p className="text-[11px] font-medium text-white/50">
                {stat.label}
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-stat text-2xl tracking-wide">
                  {stat.value}
                </span>
                {stat.trend !== null ? (
                  <TrendBadge
                    value={stat.trend}
                    className="bg-white/10 text-[10px] text-white"
                    suffix={partial ? " so far" : undefined}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop — 4 separate cards */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="animate-fade-up relative overflow-hidden rounded-2xl bg-navy p-6 text-white transition-transform duration-200 hover:-translate-y-0.5"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5" />
            <div className="absolute -right-1 -top-1 h-12 w-12 rounded-full bg-white/5" />
            <p className="text-sm font-medium text-white/70">{stat.label}</p>
            <p className="mt-1 font-stat text-5xl tracking-wide text-white xl:text-6xl">
              {stat.value}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-white/50">{stat.subtext}</span>
              {stat.trend !== null ? (
                <TrendBadge
                  value={stat.trend}
                  className="bg-white/10 text-white"
                  suffix={partial ? " so far" : undefined}
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
