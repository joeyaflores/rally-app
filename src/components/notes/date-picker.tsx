"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

interface DatePickerProps {
  value: string | null | undefined;
  onChange: (date: string | null) => void;
  children: React.ReactNode;
}

export function DatePicker({ value, onChange, children }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (value) return new Date(value + "T00:00:00").getFullYear();
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return new Date(value + "T00:00:00").getMonth();
    return new Date().getMonth();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Sync view to value when opening
  useEffect(() => {
    if (!open) return;
    const ref = value ? new Date(value + "T00:00:00") : new Date();
    setViewYear(ref.getFullYear());
    setViewMonth(ref.getMonth());
  }, [open, value]);

  const today = new Date();
  const todayStr = toDateStr(today);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function select(dateStr: string) {
    onChange(dateStr);
    setOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const monthLabel = new Date(viewYear, viewMonth)
    .toLocaleDateString("en-US", { month: "long" })
    .toLowerCase();

  const presets = [
    { label: "today", date: todayStr },
    { label: "tomorrow", date: toDateStr(addDays(today, 1)) },
    { label: "next week", date: toDateStr(addDays(today, 7)) },
  ];

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        {children}
      </div>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[256px] origin-top-right rounded-2xl border border-border/60 bg-white p-4 shadow-xl shadow-navy/8 animate-pop-in"
        >
          {/* Quick presets */}
          <div className="flex gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => select(p.date)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  value === p.date
                    ? "bg-navy text-white"
                    : "bg-secondary text-muted-foreground hover:text-navy"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="my-3 h-px bg-border/60" />

          {/* Month navigation */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="font-display text-[13px] tracking-tight text-navy">
              {monthLabel} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="mb-0.5 grid grid-cols-7 text-center">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`e${i}`} className="h-8" />;
              }
              const dateStr = toDateStr(
                new Date(viewYear, viewMonth, day)
              );
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === value;
              const isPast =
                new Date(viewYear, viewMonth, day) <
                new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  today.getDate()
                );

              return (
                <button
                  key={`d${day}`}
                  type="button"
                  onClick={() => select(dateStr)}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-[12px] transition-all ${
                    isSelected
                      ? "bg-navy font-semibold text-white shadow-sm"
                      : isToday
                        ? "font-semibold text-warm ring-1 ring-inset ring-warm/30"
                        : isPast
                          ? "text-muted-foreground/40 hover:bg-secondary hover:text-muted-foreground"
                          : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Clear date */}
          {value && (
            <>
              <div className="mt-3 h-px bg-border/60" />
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="mt-2 w-full rounded-lg py-1.5 text-center text-[11px] text-muted-foreground transition-colors hover:bg-red-50 hover:text-danger"
              >
                clear due date
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
