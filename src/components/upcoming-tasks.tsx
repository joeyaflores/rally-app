"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ArrowRight } from "lucide-react";
import { toggleChecklistItem } from "@/lib/notes";
import type { UpcomingTask } from "@/lib/notes";

type Urgency = "overdue" | "today" | "week" | "later";

function getUrgency(dueDate: string): Urgency {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate + "T00:00:00");
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / 86400000
  );
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 7) return "week";
  return "later";
}

function formatDueDate(dueDate: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate + "T00:00:00");
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / 86400000
  );

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";

  const month = due.toLocaleDateString("en-US", { month: "short" });
  const day = due.getDate();
  if (due.getFullYear() !== now.getFullYear()) {
    return `${month} ${day} '${due.getFullYear().toString().slice(2)}`;
  }
  return `${month} ${day}`;
}

// Stable color palette for grouping tasks by note
const NOTE_COLORS = [
  "#E1306C", // pink
  "#059669", // emerald
  "#D97706", // amber
  "#1B2B4D", // navy
  "#FC4C02", // orange
  "#8B5CF6", // violet
  "#0891B2", // cyan
  "#EC4899", // magenta
];

function noteColor(noteId: string): string {
  let hash = 0;
  for (let i = 0; i < noteId.length; i++) {
    hash = ((hash << 5) - hash + noteId.charCodeAt(i)) | 0;
  }
  return NOTE_COLORS[Math.abs(hash) % NOTE_COLORS.length];
}

const urgencyStyles: Record<
  Urgency,
  { dot: string; date: string; row: string }
> = {
  overdue: {
    dot: "bg-warm",
    date: "text-warm font-medium",
    row: "bg-warm-muted/50",
  },
  today: {
    dot: "bg-navy",
    date: "text-navy font-medium",
    row: "",
  },
  week: {
    dot: "bg-navy/40",
    date: "text-muted-foreground",
    row: "",
  },
  later: {
    dot: "bg-border",
    date: "text-muted-foreground/60",
    row: "",
  },
};

function TaskRow({
  task,
  onToggle,
  completed,
}: {
  task: UpcomingTask;
  onToggle: () => void;
  completed: boolean;
}) {
  const urgency = getUrgency(task.dueDate);
  const styles = urgencyStyles[urgency];
  const dateLabel = formatDueDate(task.dueDate);

  const color = noteColor(task.noteId);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border-l-[3px] px-3 py-2.5 transition-all ${styles.row} ${
        completed ? "opacity-40" : ""
      }`}
      style={{ borderLeftColor: color }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2 transition-colors ${
          completed
            ? "border-navy bg-navy text-white"
            : "border-border hover:border-navy/50"
        }`}
      >
        {completed ? <Check className="h-3 w-3" /> : null}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm ${
            completed
              ? "text-muted-foreground line-through"
              : "text-foreground"
          }`}
        >
          {task.text || "untitled task"}
        </p>
        <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground/60">
          <span
            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          {task.noteTitle || "untitled"}
        </p>
      </div>

      {/* Date */}
      <span className={`shrink-0 text-xs ${styles.date}`}>
        {dateLabel}
      </span>
    </div>
  );
}

export function UpcomingTasks({ tasks }: { tasks: UpcomingTask[] }) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set()
  );
  const [expanded, setExpanded] = useState(false);

  if (tasks.length === 0) return null;

  const visibleTasks = tasks.filter((t) => !completedIds.has(t.id));
  const overdueCount = visibleTasks.filter(
    (t) => getUrgency(t.dueDate) === "overdue"
  ).length;
  const todayCount = visibleTasks.filter(
    (t) => getUrgency(t.dueDate) === "today"
  ).length;

  function handleToggle(task: UpcomingTask) {
    setCompletedIds(
      (prev) => new Set([...prev, task.id])
    );
    toggleChecklistItem(task.noteId, task.id);
  }


  const badgeLabel = overdueCount > 0
    ? `${overdueCount} overdue`
    : `${visibleTasks.length} upcoming`;
  const badgeClass = overdueCount > 0
    ? "text-warm"
    : "text-muted-foreground/40";

  return (
    <section className="animate-fade-up" style={{ animationDelay: "150ms" }}>
      {/* Section title */}
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-sm font-medium uppercase tracking-widest text-muted-foreground">
          what&apos;s ahead
          <span className={`ml-2 normal-case tracking-normal ${badgeClass}`}>
            {badgeLabel}
          </span>
        </h2>
        <Link
          href="/notes"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-navy"
        >
          all notes
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl border border-border/50 bg-white shadow-sm max-md:cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {/* Mobile collapsed summary */}
        <div
          className={`flex items-center gap-2 px-4 py-2.5 md:hidden ${
            expanded ? "hidden" : ""
          }`}
        >
          {overdueCount > 0 && (
            <span className="rounded-full bg-warm-muted px-2 py-0.5 text-[11px] font-medium text-warm">
              {overdueCount} overdue
            </span>
          )}
          {todayCount > 0 && (
            <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[11px] font-medium text-navy">
              {todayCount} due today
            </span>
          )}
          {overdueCount === 0 && todayCount === 0 && (
            <span className="text-[11px] text-muted-foreground/40">
              {visibleTasks.length} item{visibleTasks.length !== 1 ? "s" : ""}
            </span>
          )}
          <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
        </div>

        {/* Task list — collapsible on mobile, always visible on md+ */}
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            expanded
              ? "grid-rows-[1fr]"
              : "grid-rows-[0fr] md:grid-rows-[1fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-0.5 p-2">
              {visibleTasks.length > 0 ? (
                visibleTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggle(task)}
                    completed={completedIds.has(task.id)}
                  />
                ))
              ) : (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    all caught up &mdash; nothing ahead
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
