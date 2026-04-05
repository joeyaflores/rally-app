"use client";

import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatNumber } from "@/lib/format";
import type { GrowthPoint } from "@/lib/apify";

const chartConfig = {
  instagram: { label: "Instagram", color: "#E1306C" },
  tiktok: { label: "TikTok", color: "#000000" },
} satisfies ChartConfig;

function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function GrowthChart({ data }: { data: GrowthPoint[] }) {
  return (
    <div
      className="animate-fade-up motion-reduce:animate-none overflow-hidden rounded-2xl border-0 bg-white p-6 shadow-sm sm:p-8"
      style={{ animationDelay: "450ms", animationFillMode: "both" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg tracking-tight text-navy">
            growth
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            followers over time
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: "#E1306C" }}
            />
            instagram
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-black" />
            tiktok
          </span>
        </div>
      </div>

      <div className="mt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-[2/1] w-full sm:aspect-[3/1]"
        >
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          >
            <defs>
              <linearGradient id="igGradA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E1306C" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#E1306C" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ttGradA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#000000" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#000000" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#E2E5EF"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickFormatter={formatChartDate}
              tick={{ fill: "#94a3b8" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickFormatter={(v) => formatNumber(v)}
              tick={{ fill: "#94a3b8" }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <span>
                      {typeof value === "number"
                        ? value.toLocaleString()
                        : value}
                    </span>
                  )}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="instagram"
              stroke="#E1306C"
              strokeWidth={2}
              fill="url(#igGradA)"
              dot={{ r: 3, fill: "#E1306C", strokeWidth: 0 }}
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="tiktok"
              stroke="#000000"
              strokeWidth={2}
              fill="url(#ttGradA)"
              dot={{ r: 3, fill: "#000000", strokeWidth: 0 }}
              connectNulls
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}
