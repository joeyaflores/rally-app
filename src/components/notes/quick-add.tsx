"use client";

import { useState } from "react";
import { Plus, CalendarDays, X } from "lucide-react";
import { createNote } from "@/lib/notes";
import { DatePicker } from "./date-picker";

function formatChip(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function QuickAdd() {
  const [value, setValue] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || adding) return;
    setAdding(true);
    await createNote(value, dueDate ? { dueDate } : undefined);
    setValue("");
    setDueDate(null);
    setAdding(false);
  }

  const hasText = value.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="rounded-2xl border border-border/50 bg-white shadow-sm transition-colors focus-within:border-navy/30">
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
          <Plus className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="new note..."
            className="min-w-0 flex-1 bg-transparent font-display text-base uppercase outline-none placeholder:text-muted-foreground/50"
            disabled={adding}
          />

          {/* Calendar trigger — always visible, compact */}
          {!dueDate && (
            <DatePicker value={null} onChange={(d) => setDueDate(d)}>
              <span className="flex shrink-0 cursor-pointer items-center rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-navy">
                <CalendarDays className="h-4 w-4" />
              </span>
            </DatePicker>
          )}

          {/* Add button — no date set, stays inline */}
          {hasText && !dueDate && (
            <button
              type="submit"
              disabled={adding}
              className="shrink-0 rounded-lg bg-navy px-3 py-1.5 font-display text-xs font-medium uppercase text-white transition-colors hover:bg-navy/90 disabled:opacity-50"
            >
              add
            </button>
          )}
        </div>

        {/* Action bar — appears when date is set, gives room to breathe */}
        {dueDate && (
          <div className="flex items-center justify-between border-t border-border/30 px-4 py-2.5 sm:px-5">
            <DatePicker value={dueDate} onChange={(d) => setDueDate(d)}>
              <span className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-navy/5 px-2.5 py-1 font-display text-xs font-medium uppercase text-navy transition-colors hover:bg-navy/10">
                <CalendarDays className="h-3 w-3" />
                {formatChip(dueDate)}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDueDate(null);
                  }}
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-navy/20"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            </DatePicker>

            {hasText && (
              <button
                type="submit"
                disabled={adding}
                className="shrink-0 rounded-lg bg-navy px-3 py-1.5 font-display text-xs font-medium uppercase text-white transition-colors hover:bg-navy/90 disabled:opacity-50"
              >
                add
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hint */}
      {hasText && !dueDate && (
        <p className="mt-2 px-4 font-display text-[11px] uppercase text-muted-foreground/50 sm:px-5">
          tap the calendar to add a due date — it&apos;ll show up in upcoming tasks
        </p>
      )}
    </form>
  );
}
