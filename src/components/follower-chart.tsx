"use client";

import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
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
import { formatNumber } from "@/lib/format";

interface FollowerDataPoint {
  month: string;
  instagram: number;
  tiktok: number;
  strava: number;
  total: number;
}

const chartConfig = {
  instagram: {
    label: "Instagram",
    color: "#E1306C",
  },
  tiktok: {
    label: "TikTok",
    color: "#000000",
  },
  strava: {
    label: "Strava",
    color: "#FC4C02",
  },
} satisfies ChartConfig;

export function FollowerChart({ data }: { data: FollowerDataPoint[] }) {
  const latest = data[data.length - 1];

  return (
    <Card
      className="animate-fade-up border-0 shadow-sm"
      style={{ animationDelay: "650ms" }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-lg tracking-tight">
              community growth
            </CardTitle>
            <CardDescription>
              total followers across all platforms
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="font-stat text-4xl tracking-wide text-navy">
              {formatNumber(latest.total)}
            </p>
            <p className="text-xs text-muted-foreground">total neighbors</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-[2/1] w-full sm:aspect-[3/1]">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          >
            <defs>
              <linearGradient id="igGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E1306C" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#E1306C" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ttGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#000000" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#000000" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="stravaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FC4C02" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#FC4C02" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tickFormatter={(v) => formatNumber(v)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <span>
                      {typeof value === "number" ? value.toLocaleString() : value}
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
              fill="url(#igGrad)"
              dot={{ r: 4, fill: "#E1306C", strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="tiktok"
              stroke="#000000"
              strokeWidth={2}
              fill="url(#ttGrad)"
              dot={{ r: 4, fill: "#000000", strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="strava"
              stroke="#FC4C02"
              strokeWidth={2}
              fill="url(#stravaGrad)"
              dot={{ r: 4, fill: "#FC4C02", strokeWidth: 0 }}
            />
          </AreaChart>
        </ChartContainer>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#E1306C" }} />
            instagram
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-black" />
            tiktok
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#FC4C02" }} />
            strava
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
