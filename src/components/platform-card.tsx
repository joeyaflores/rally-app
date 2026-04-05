"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendBadge } from "./trend-badge";
import { formatNumber, pctChange } from "@/lib/format";

interface MetricRow {
  label: string;
  current: number;
  previous: number;
  format?: "number" | "percent";
}

interface PlatformCardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  metrics: MetricRow[];
  handle?: string;
  url?: string;
  engagementRate?: { current: number; previous: number };
  delay?: number;
}

export function PlatformCard({
  title,
  icon,
  color,
  metrics,
  handle,
  url,
  engagementRate,
  delay = 0,
}: PlatformCardProps) {
  const [expanded, setExpanded] = useState(false);

  const primary = metrics[0];
  const primaryChange =
    primary.format === "percent"
      ? Math.round(primary.current - primary.previous)
      : pctChange(primary.current, primary.previous);

  return (
    <Card
      className="animate-fade-up overflow-hidden border-0 shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header — tappable on mobile to expand */}
      <CardHeader
        className="pb-3 max-md:cursor-pointer max-md:select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}12` }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="font-display text-lg tracking-tight">
              {title}
            </CardTitle>
            {handle && url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                @{handle}
              </a>
            ) : null}
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 md:hidden ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>

        {/* Mobile collapsed summary */}
        <div
          className={`mt-3 flex items-center justify-between md:hidden ${
            expanded ? "hidden" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-stat text-xl tracking-wide">
              {formatNumber(primary.current)}
            </span>
            <span className="text-xs text-muted-foreground">
              {primary.label.toLowerCase()}
            </span>
            <TrendBadge value={primaryChange} />
          </div>
          {engagementRate ? (
            <div className="flex items-center gap-1 rounded-lg bg-secondary/60 px-2 py-1">
              <span className="font-stat text-sm tracking-wide">
                {engagementRate.current.toFixed(1)}%
              </span>
              <span className="text-[10px] text-muted-foreground">eng</span>
            </div>
          ) : null}
        </div>
      </CardHeader>

      {/* Detail metrics — collapsible on mobile, always visible on md+ */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          expanded
            ? "grid-rows-[1fr]"
            : "grid-rows-[0fr] md:grid-rows-[1fr]"
        }`}
      >
        <div className="overflow-hidden">
          <CardContent className="space-y-3">
            {metrics.map((metric) => {
              const change =
                metric.format === "percent"
                  ? Math.round(metric.current - metric.previous)
                  : pctChange(metric.current, metric.previous);
              return (
                <div
                  key={metric.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-muted-foreground">
                    {metric.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-stat text-2xl tracking-wide">
                      {metric.format === "percent"
                        ? `${metric.current}%`
                        : formatNumber(metric.current)}
                    </span>
                    <TrendBadge value={change} />
                  </div>
                </div>
              );
            })}
            {engagementRate ? (
              <div className="mt-4 rounded-lg bg-secondary/50 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Engagement Rate
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-stat text-lg tracking-wide">
                      {engagementRate.current.toFixed(1)}%
                    </span>
                    <TrendBadge
                      value={pctChange(
                        Math.round(engagementRate.current * 100),
                        Math.round(engagementRate.previous * 100)
                      )}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
