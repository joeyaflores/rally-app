import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/data";
import { TrendingUp } from "lucide-react";

interface GrowthProjectionProps {
  currentFollowers: number;
  previousFollowers: number;
  currentMonth: string;
}

const MILESTONES = [5000, 10000, 25000, 50000];

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function GrowthProjection({
  currentFollowers,
  previousFollowers,
  currentMonth,
}: GrowthProjectionProps) {
  const monthlyGrowth = currentFollowers - previousFollowers;
  if (monthlyGrowth <= 0) return null;

  const now = new Date();
  const upcomingMilestones = MILESTONES.filter((m) => m > currentFollowers);
  if (upcomingMilestones.length === 0) return null;

  const projections = upcomingMilestones.slice(0, 3).map((milestone) => {
    const monthsNeeded = Math.ceil(
      (milestone - currentFollowers) / monthlyGrowth
    );
    const targetDate = addMonths(now, monthsNeeded);
    const monthName = targetDate.toLocaleDateString("en-US", { month: "short" });
    const year =
      targetDate.getFullYear() !== now.getFullYear()
        ? ` '${targetDate.getFullYear().toString().slice(2)}`
        : "";
    return {
      milestone,
      label: formatNumber(milestone),
      eta: `${monthName}${year}`,
      monthsAway: monthsNeeded,
    };
  });

  return (
    <Card
      className="animate-fade-up border-0 shadow-sm"
      style={{ animationDelay: "850ms" }}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="font-display text-lg tracking-tight">
              where this is headed
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              +{monthlyGrowth.toLocaleString()} neighbors in {currentMonth.toLowerCase()}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {projections.map((p) => {
            const progress = Math.min(
              (currentFollowers / p.milestone) * 100,
              100
            );
            return (
              <div key={p.milestone}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {p.label} neighbors
                  </span>
                  <span className="text-muted-foreground">
                    ~{p.eta}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-navy transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground/60">
          based on current pace across ig, tiktok & strava
        </p>
      </CardContent>
    </Card>
  );
}
