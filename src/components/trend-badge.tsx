import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export function TrendBadge({
  value,
  className,
  suffix,
}: {
  value: number;
  className?: string;
  suffix?: string;
}) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-display text-xs font-medium uppercase",
        isPositive && "bg-emerald-50 text-emerald-700",
        !isPositive && !isNeutral && "bg-red-50 text-red-700",
        isNeutral && "bg-zinc-100 text-zinc-500",
        className
      )}
    >
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {Math.abs(value)}%{suffix ?? ""}
    </span>
  );
}
