"use client";

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell, ReferenceLine } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface Event {
  date: string;
  day: string;
  attendance: number;
  month: string;
  note: string;
}

const chartConfig = {
  attendance: {
    label: "Attendance",
    color: "var(--color-navy)",
  },
} satisfies ChartConfig;

export function AttendanceChart({ events }: { events: Event[] }) {
  const chartData = events.map((e) => ({
    label: e.date,
    day: e.day,
    month: e.month,
    attendance: e.attendance,
    note: e.note,
    fill:
      e.attendance >= 200
        ? "var(--color-warm)"
        : e.day === "Mon"
          ? "var(--color-navy)"
          : "#7B93DB",
  }));

  const totalRuns = events.length;
  const totalAttendance = events.reduce((s, e) => s + e.attendance, 0);
  const avg = totalRuns ? Math.round(totalAttendance / totalRuns) : 0;

  const mondays = events.filter((e) => e.day === "Mon" && e.attendance < 200);
  const saturdays = events.filter((e) => e.day === "Sat" && e.attendance < 200);
  const monAvg = mondays.length
    ? Math.round(mondays.reduce((s, e) => s + e.attendance, 0) / mondays.length)
    : 0;
  const satAvg = saturdays.length
    ? Math.round(saturdays.reduce((s, e) => s + e.attendance, 0) / saturdays.length)
    : 0;

  const hasPopUp = events.some((e) => e.attendance >= 200);

  // Detect month boundaries for visual grouping
  const monthBreaks: number[] = [];
  for (let i = 1; i < chartData.length; i++) {
    if (chartData[i].month !== chartData[i - 1].month) {
      monthBreaks.push(i);
    }
  }

  return (
    <Card
      className="animate-fade-up border-0 shadow-sm"
      style={{ animationDelay: "600ms" }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-lg tracking-tight">
              who showed up
            </CardTitle>
            <CardDescription>
              {totalRuns} runs tracked · {avg} avg
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="font-stat text-4xl tracking-wide text-navy">
              {totalAttendance.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">total neighbors</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <>
            <ChartContainer config={chartConfig} className="aspect-[1.8/1] w-full sm:aspect-[2.5/1]">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={(v: string) => {
                    const parts = v.split(" ");
                    return parts.length === 2 ? parts[1] : v;
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={(v) => v.toString()}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        const d = payload?.[0]?.payload;
                        if (!d) return "";
                        return d.note
                          ? `${d.day} ${d.label} — ${d.note}`
                          : `${d.day} ${d.label}`;
                      }}
                    />
                  }
                />
                {/* Month boundary lines */}
                {monthBreaks.map((idx) => (
                  <ReferenceLine
                    key={idx}
                    x={chartData[idx].label}
                    stroke="var(--color-border)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                  />
                ))}
                {/* Average line */}
                <ReferenceLine
                  y={avg}
                  stroke="var(--color-navy)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.2}
                />
                <Bar
                  dataKey="attendance"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-navy" />
                monday social run
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "#7B93DB" }} />
                saturday long run
              </span>
              {hasPopUp && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-warm" />
                  special event
                </span>
              )}
            </div>
            {(mondays.length > 0 || saturdays.length > 0) && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {mondays.length > 0 && (
                  <div className="rounded-lg bg-secondary/50 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">monday avg</p>
                    <p className="font-stat text-2xl tracking-wide text-navy">{monAvg}</p>
                  </div>
                )}
                {saturdays.length > 0 && (
                  <div className="rounded-lg bg-secondary/50 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">saturday avg</p>
                    <p className="font-stat text-2xl tracking-wide" style={{ color: "#7B93DB" }}>{satAvg}</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            no attendance logged yet — add runs on the admin page
          </p>
        )}
      </CardContent>
    </Card>
  );
}
