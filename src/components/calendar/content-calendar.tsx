"use client";

import {
  useState,
  useCallback,
  useTransition,
  useRef,
  useEffect,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  X,
  Trash2,
  Instagram,
} from "lucide-react";
import { TikTokIcon, StravaIcon } from "@/components/icons";
import {
  getMonthPosts,
  createPost,
  updatePost,
  deletePost,
} from "@/lib/calendar";
import { MONTH_NAMES } from "@/lib/analytics-types";
import type { ContentPost, Platform, PostStatus, PostScope, Creator } from "@/lib/calendar-types";
import config from "@rally";

/* ─── Constants ─── */

const PLATFORMS: {
  id: Platform;
  label: string;
  color: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "instagram",
    label: "IG",
    color: "#E1306C",
    icon: <Instagram className="h-4 w-4" />,
  },
  {
    id: "tiktok",
    label: "TT",
    color: "#000000",
    icon: <TikTokIcon className="h-4 w-4" />,
  },
  {
    id: "strava",
    label: "Strava",
    color: "#FC4C02",
    icon: <StravaIcon className="h-4 w-4" />,
  },
];

const STATUSES: { id: PostStatus; label: string }[] = [
  { id: "idea", label: "idea" },
  { id: "drafted", label: "drafted" },
  { id: "posted", label: "posted" },
];

const CREATORS = config.creators;

const PLATFORM_MAP = new Map(PLATFORMS.map((p) => [p.id, p]));
const CREATOR_MAP = new Map<string, (typeof CREATORS)[number]>(CREATORS.map((c) => [c.id, c]));

const DOW_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

/* ─── Helpers ─── */

interface CalendarDay {
  date: string;
  dayNum: number;
  isCurrentMonth: boolean;
  dow: number;
}

function getCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDow = firstDay.getDay();

  const days: CalendarDay[] = [];

  // Previous month padding
  const prevLastDay = new Date(year, month - 1, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevLastDay - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    days.push({
      date: `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      dayNum: d,
      isCurrentMonth: false,
      dow: days.length % 7,
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      dayNum: d,
      isCurrentMonth: true,
      dow: (startDow + d - 1) % 7,
    });
  }

  // Next month padding
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        date: `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        dayNum: d,
        isCurrentMonth: false,
        dow: days.length % 7,
      });
    }
  }

  return days;
}

function getToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDateFriendly(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toLowerCase();
}

function platformColor(p: Platform): string {
  return PLATFORM_MAP.get(p)!.color;
}

function agendaDateLabel(date: string, todayStr: string): string {
  if (date === todayStr) return "today";
  const t = new Date(todayStr + "T00:00:00");
  t.setDate(t.getDate() + 1);
  const tmrw = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  if (date === tmrw) return "tomorrow";
  const d = new Date(date + "T00:00:00");
  return d
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
    .toLowerCase();
}

/* ─── Main Component ─── */

interface Props {
  initialYear: number;
  initialMonth: number;
  initialPosts: ContentPost[];
}

export function ContentCalendar({
  initialYear,
  initialMonth,
  initialPosts,
}: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [posts, setPosts] = useState(initialPosts);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<ContentPost | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formCaption, setFormCaption] = useState("");
  const [formCreator, setFormCreator] = useState("");
  const [formPlatforms, setFormPlatforms] = useState<Platform[]>(["instagram"]);
  const [formStatus, setFormStatus] = useState<PostStatus>("idea");
  const [formScope, setFormScope] = useState<PostScope>("club");

  // Scope filters — "club" on by default, creator names toggle personal posts
  const [scopeFilters, setScopeFilters] = useState<Set<"club" | Creator>>(() => new Set(["club"]));

  const titleInputRef = useRef<HTMLInputElement>(null);
  const lastPlatformRef = useRef<Platform[]>(["instagram"]);
  const lastCreatorRef = useRef<string>("");

  // Drag-to-reschedule
  const [draggingPost, setDraggingPost] = useState<ContentPost | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);
  const dragRef = useRef<{
    post: ContentPost;
    startX: number;
    startY: number;
    activated: boolean;
  } | null>(null);
  const dropTargetRef = useRef<string | null>(null);
  const floatingPillRef = useRef<HTMLDivElement>(null);
  const justDraggedRef = useRef(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  // Filter posts by scope
  const filteredPosts = posts.filter((p) => {
    if (p.scope === "personal") return scopeFilters.has(p.creator as Creator);
    return scopeFilters.has("club");
  });

  // Computed — single pass for grouping + stats
  const calendarDays = getCalendarDays(year, month);
  const postsByDate = new Map<string, ContentPost[]>();
  const totalPosts = filteredPosts.length;
  let postedCount = 0, igCount = 0, ttCount = 0, stravaCount = 0;
  for (const post of filteredPosts) {
    const existing = postsByDate.get(post.post_date) || [];
    existing.push(post);
    postsByDate.set(post.post_date, existing);
    if (post.status === "posted") postedCount++;
    if (post.platform === "instagram") igCount++;
    else if (post.platform === "tiktok") ttCount++;
    else if (post.platform === "strava") stravaCount++;
  }

  const today = getToday();

  // Agenda — today + upcoming posts grouped by date (for mobile)
  const upcomingSorted = filteredPosts
    .filter((p) => p.post_date >= today)
    .sort((a, b) => a.post_date.localeCompare(b.post_date));
  const agendaGroups: {
    date: string;
    label: string;
    posts: ContentPost[];
  }[] = [];
  for (const post of upcomingSorted) {
    const last = agendaGroups[agendaGroups.length - 1];
    if (last && last.date === post.post_date) {
      last.posts.push(post);
    } else {
      agendaGroups.push({
        date: post.post_date,
        label: agendaDateLabel(post.post_date, today),
        posts: [post],
      });
    }
  }

  /* ─── Handlers ─── */

  const resetForm = useCallback(() => {
    setFormTitle("");
    setFormBody("");
    setFormCaption("");
    setFormCreator("");
    setFormStatus("idea");
    setFormScope("club");
  }, []);

  const selectDay = useCallback(
    (date: string) => {
      if (selectedDate === date && !editing) {
        setSelectedDate(null);
        return;
      }
      setSelectedDate(date);
      setEditing(null);
      resetForm();
      setFormPlatforms(lastPlatformRef.current);
      setFormCreator(lastCreatorRef.current);
      setTimeout(() => titleInputRef.current?.focus(), 50);
    },
    [selectedDate, editing, resetForm]
  );

  const openEdit = useCallback((post: ContentPost) => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    setSelectedDate(post.post_date);
    setEditing(post);
    setFormTitle(post.title);
    setFormBody(post.body);
    setFormCaption(post.caption);
    setFormCreator(post.creator);
    setFormPlatforms([post.platform]);
    setFormStatus(post.status);
    setFormScope(post.scope);
    setTimeout(() => titleInputRef.current?.focus(), 50);
  }, []);

  const closePanel = useCallback(() => {
    setSelectedDate(null);
    setEditing(null);
    resetForm();
  }, [resetForm]);

  const handleSave = useCallback(() => {
    if (!selectedDate) return;
    const trimmedTitle = formTitle.trim();
    if (!trimmedTitle && !editing) return;

    lastPlatformRef.current = formPlatforms;
    if (formCreator) lastCreatorRef.current = formCreator;

    const opts = { body: formBody.trim(), caption: formCaption.trim(), creator: formCreator, scope: formScope };

    startTransition(async () => {
      if (editing) {
        const updates = {
          title: trimmedTitle,
          ...opts,
          platform: formPlatforms[0],
          status: formStatus,
        };
        await updatePost(editing.id, updates);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === editing.id ? { ...p, ...updates } : p
          )
        );
        setEditing(null);
        resetForm();
      } else {
        const newPosts = await Promise.all(
          formPlatforms.map((platform) =>
            createPost(selectedDate, platform, trimmedTitle, formStatus, opts)
          )
        );
        setPosts((prev) => [...prev, ...newPosts]);
        resetForm();
      }
      setFormPlatforms(lastPlatformRef.current);
      setFormCreator(lastCreatorRef.current);
      setTimeout(() => titleInputRef.current?.focus(), 50);
    });
  }, [selectedDate, formTitle, formBody, formCaption, formCreator, formPlatforms, formStatus, formScope, editing, resetForm]);

  const handleDelete = useCallback(() => {
    if (!editing) return;
    startTransition(async () => {
      await deletePost(editing.id);
      setPosts((prev) => prev.filter((p) => p.id !== editing.id));
      setEditing(null);
      resetForm();
    });
  }, [editing, resetForm]);

  const navigateMonth = useCallback(
    (dir: 1 | -1) => {
      startTransition(async () => {
        let nextMonth = month + dir;
        let nextYear = year;
        if (nextMonth < 1) {
          nextMonth = 12;
          nextYear--;
        }
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear++;
        }

        const newPosts = await getMonthPosts(nextYear, nextMonth);
        setYear(nextYear);
        setMonth(nextMonth);
        setPosts(newPosts);
        setSelectedDate(null);
        setEditing(null);
      });
    },
    [month, year]
  );

  const cancelDrag = useCallback(() => {
    dragCleanupRef.current?.();
    dragCleanupRef.current = null;
    dragRef.current = null;
    setDraggingPost(null);
    setDropTargetDate(null);
    dropTargetRef.current = null;
  }, []);

  const handlePillPointerDown = useCallback(
    (e: React.PointerEvent, post: ContentPost) => {
      if (e.button !== 0) return;

      const drag = {
        post,
        startX: e.clientX,
        startY: e.clientY,
        activated: false,
      };
      dragRef.current = drag;

      function handlePointerMove(ev: PointerEvent) {
        if (!dragRef.current) return;

        if (!drag.activated) {
          const dx = ev.clientX - drag.startX;
          const dy = ev.clientY - drag.startY;
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
          drag.activated = true;
          setDraggingPost(drag.post);
        }

        // Move floating pill
        const pill = floatingPillRef.current;
        if (pill) {
          pill.style.left = `${ev.clientX}px`;
          pill.style.top = `${ev.clientY - 20}px`;
        }

        // Detect drop target via elementFromPoint
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const cell = el?.closest("[data-date]") as HTMLElement | null;
        if (cell && cell.dataset.currentMonth === "true") {
          const date = cell.dataset.date!;
          setDropTargetDate(date);
          dropTargetRef.current = date;
        } else {
          setDropTargetDate(null);
          dropTargetRef.current = null;
        }
      }

      function handlePointerUp() {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        dragCleanupRef.current = null;

        const target = dropTargetRef.current;

        if (drag.activated && target && target !== drag.post.post_date) {
          justDraggedRef.current = true;
          // Optimistic update
          setPosts((prev) =>
            prev.map((p) =>
              p.id === drag.post.id ? { ...p, post_date: target } : p
            )
          );
          startTransition(async () => {
            await updatePost(drag.post.id, { post_date: target });
          });
        } else if (drag.activated) {
          justDraggedRef.current = true;
        }

        dragRef.current = null;
        setDraggingPost(null);
        setDropTargetDate(null);
        dropTargetRef.current = null;
      }

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      dragCleanupRef.current = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    },
    []
  );

  // Stable ref to latest handleSave so the keyboard effect doesn't churn
  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  });

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (draggingPost) {
          cancelDrag();
        } else {
          closePanel();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSaveRef.current();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePanel, draggingPost, cancelDrag]);

  return (
    <div className="space-y-5">
      {/* ─── Month Navigation ─── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          disabled={isPending}
          className="rounded-xl border border-border/50 bg-white p-2.5 text-muted-foreground shadow-sm transition-all hover:border-navy/20 hover:text-navy disabled:opacity-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="text-center">
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-navy sm:text-4xl">
            {MONTH_NAMES[month]}
          </h2>
          <p className="font-display text-sm uppercase text-muted-foreground">{year}</p>
        </div>

        <button
          onClick={() => navigateMonth(1)}
          disabled={isPending}
          className="rounded-xl border border-border/50 bg-white p-2.5 text-muted-foreground shadow-sm transition-all hover:border-navy/20 hover:text-navy disabled:opacity-50"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* ─── Month Stats ─── */}
      {totalPosts > 0 && (
        <div className="animate-fade-up flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white px-5 py-3 shadow-sm">
          <div className="flex items-center gap-3 font-display text-sm uppercase text-muted-foreground">
            <span>
              <span className="font-stat text-lg tracking-wide text-navy">
                {totalPosts}
              </span>{" "}
              planned
            </span>
            <span className="text-border">·</span>
            <span>
              <span className="font-stat text-lg tracking-wide text-navy">
                {postedCount}
              </span>{" "}
              posted
            </span>
          </div>
          <div className="flex items-center gap-3 font-display text-xs uppercase text-muted-foreground">
            {igCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: "#E1306C" }}
                />
                {igCount}
              </span>
            )}
            {ttCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-black" />
                {ttCount}
              </span>
            )}
            {stravaCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: "#FC4C02" }}
                />
                {stravaCount}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ─── Scope Filters ─── */}
      <div className="flex flex-wrap items-center gap-1.5 px-1">
        <button
          onClick={() =>
            setScopeFilters((prev) => {
              const next = new Set(prev);
              next.has("club") ? next.delete("club") : next.add("club");
              return next.size > 0 ? next : prev;
            })
          }
          className={`rounded-full px-3 py-1 font-display text-[11px] font-medium uppercase transition-all ${
            scopeFilters.has("club")
              ? "bg-navy text-white"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          club
        </button>
        {CREATORS.map((c) => (
          <button
            key={c.id}
            onClick={() =>
              setScopeFilters((prev) => {
                const next = new Set(prev);
                next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                return next.size > 0 ? next : prev;
              })
            }
            className={`rounded-full px-3 py-1 font-display text-[11px] font-medium uppercase transition-all ${
              scopeFilters.has(c.id)
                ? "text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
            style={scopeFilters.has(c.id) ? { backgroundColor: c.color } : undefined}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ─── Loading ─── */}
      {isPending && (
        <div className="flex justify-center py-1">
          <div className="h-1 w-24 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-navy" />
          </div>
        </div>
      )}

      {/* ─── Calendar Grid ─── */}
      <div className="animate-fade-up overflow-hidden rounded-2xl bg-white shadow-sm">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-border/30 bg-navy">
          {DOW_LABELS.map((label, i) => (
            <div
              key={i}
              className="py-2.5 text-center text-[11px] font-medium uppercase tracking-widest text-white/70"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dayPosts = postsByDate.get(day.date) || [];
            const isSelected = selectedDate === day.date;
            const isToday = day.date === today;
            const isRunDay =
              day.isCurrentMonth && (day.dow === 1 || day.dow === 6);

            return (
              <div
                key={day.date}
                data-date={day.date}
                data-current-month={String(day.isCurrentMonth)}
                onClick={() => day.isCurrentMonth && selectDay(day.date)}
                className={`
                  group relative min-h-[72px] border-b border-r border-border/20 p-1.5 transition-colors sm:min-h-[96px] sm:p-2
                  ${day.isCurrentMonth ? "cursor-pointer hover:bg-navy/[0.02]" : "pointer-events-none bg-secondary/20"}
                  ${!day.isCurrentMonth ? "opacity-30" : ""}
                  ${isSelected && !dropTargetDate ? "ring-2 ring-inset ring-navy/40 bg-navy/[0.03]" : ""}
                  ${isToday && !isSelected ? "bg-warm-muted/40" : ""}
                  ${dropTargetDate === day.date ? "ring-2 ring-inset ring-warm/60 bg-warm/[0.06]" : ""}
                `}
              >
                {/* Day header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`
                      inline-flex items-center justify-center font-display text-xs
                      ${isToday ? "h-6 w-6 rounded-full bg-navy font-medium text-white" : "h-6 w-6 font-medium text-muted-foreground"}
                    `}
                  >
                    {day.dayNum}
                  </span>

                  <div className="flex items-center gap-1">
                    {isRunDay && (
                      <span
                        className={`
                          hidden font-display text-[9px] font-medium uppercase sm:inline
                          ${day.dow === 1 ? "text-navy/40" : "text-warm/50"}
                        `}
                      >
                        run
                      </span>
                    )}
                    {/* Hover add hint */}
                    {day.isCurrentMonth && (
                      <Plus className="h-3 w-3 text-muted-foreground/0 transition-all group-hover:text-muted-foreground/30" />
                    )}
                  </div>
                </div>

                {/* Run day indicator for mobile */}
                {isRunDay && (
                  <div
                    className={`
                      mt-0.5 h-0.5 w-3 rounded-full sm:hidden
                      ${day.dow === 1 ? "bg-navy/20" : "bg-warm/30"}
                    `}
                  />
                )}

                {/* Post pills */}
                <div className="mt-1 space-y-0.5">
                  {dayPosts.slice(0, 3).map((post) => (
                    <PostPill
                      key={post.id}
                      post={post}
                      onClick={() => openEdit(post)}
                      onDragStart={(e) => handlePillPointerDown(e, post)}
                      isDragging={draggingPost?.id === post.id}
                    />
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="block font-display text-[9px] uppercase text-muted-foreground/50 sm:text-[10px]">
                      +{dayPosts.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Add / Edit Panel ─── */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          selectedDate ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          {selectedDate && (
            <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              {/* Panel header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-navy">
                    {editing ? "edit post" : "new post"}
                  </h3>
                  <p className="font-display text-sm uppercase text-muted-foreground">
                    {formatDateFriendly(selectedDate)}
                  </p>
                </div>
                <button
                  onClick={closePanel}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Title */}
              <input
                ref={titleInputRef}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="post title"
                className="w-full border-0 bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted-foreground/30"
              />

              {/* Details */}
              <div className="my-3 h-px bg-border/20" />
              <textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="details & notes..."
                rows={2}
                className="w-full resize-none bg-transparent text-sm text-foreground/80 outline-none placeholder:text-muted-foreground/25"
              />

              {/* Caption */}
              <div className="mt-3 rounded-xl border border-border/20 bg-secondary/15 p-3">
                <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40">
                  caption
                </span>
                <textarea
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  placeholder="write your caption..."
                  rows={3}
                  className="w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/25"
                />
              </div>

              {/* Meta selectors */}
              <div className="mt-4 space-y-3">
                {/* Platform — multi-select when creating, single when editing */}
                <div className="flex items-center gap-3">
                  <span className="font-display text-[11px] uppercase text-muted-foreground/60">
                    platform{!editing && formPlatforms.length > 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {PLATFORMS.map((p) => {
                      const isActive = formPlatforms.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            if (editing) {
                              setFormPlatforms([p.id]);
                            } else {
                              setFormPlatforms((prev) =>
                                prev.includes(p.id)
                                  ? prev.length > 1 ? prev.filter((x) => x !== p.id) : prev
                                  : [...prev, p.id]
                              );
                            }
                          }}
                          className={`
                            flex h-9 w-9 items-center justify-center rounded-xl transition-all
                            ${isActive ? "" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}
                          `}
                          style={
                            isActive
                              ? {
                                  backgroundColor: `${p.color}14`,
                                  color: p.color,
                                  boxShadow: `0 0 0 2px ${p.color}50`,
                                }
                              : undefined
                          }
                          title={p.label}
                        >
                          {p.icon}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <span className="font-display text-[11px] uppercase text-muted-foreground/60">status</span>
                  <div className="flex items-center gap-1.5">
                    {STATUSES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setFormStatus(s.id)}
                        className={`
                          rounded-lg px-3 py-1.5 font-display text-xs font-medium uppercase transition-all
                          ${formStatus === s.id ? "bg-navy text-white" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}
                        `}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Creator */}
                <div className="flex items-center gap-3">
                  <span className="font-display text-[11px] uppercase text-muted-foreground/60">creator</span>
                  <div className="flex items-center gap-1.5">
                    {CREATORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setFormCreator(formCreator === c.id ? "" : c.id)}
                        className={`
                          rounded-lg px-3 py-1.5 font-display text-xs font-medium uppercase transition-all
                          ${formCreator === c.id ? "text-white shadow-sm" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}
                        `}
                        style={formCreator === c.id ? { backgroundColor: c.color } : undefined}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scope */}
                <div className="flex items-center gap-3">
                  <span className="font-display text-[11px] uppercase text-muted-foreground/60">scope</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setFormScope("club")}
                      className={`rounded-lg px-3 py-1.5 font-display text-xs font-medium uppercase transition-all ${
                        formScope === "club"
                          ? "bg-navy text-white"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      club
                    </button>
                    <button
                      onClick={() => setFormScope("personal")}
                      className={`rounded-lg px-3 py-1.5 font-display text-xs font-medium uppercase transition-all ${
                        formScope === "personal"
                          ? "bg-warm text-navy-dark"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      personal
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={handleSave}
                  disabled={isPending || (!formTitle.trim() && !editing)}
                  className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 font-display text-sm font-medium uppercase text-white transition-all hover:bg-navy-light disabled:opacity-40"
                >
                  {editing ? "update" : "add post"}
                </button>

                <div className="flex items-center gap-2">
                  <span className="hidden text-[11px] text-muted-foreground/40 sm:inline">
                    ⌘ enter to save
                  </span>
                  {editing && (
                    <button
                      onClick={handleDelete}
                      disabled={isPending}
                      className="rounded-lg p-2 text-muted-foreground/40 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Coming Up ─── */}
      {agendaGroups.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-sm font-medium uppercase tracking-widest text-muted-foreground px-1">
            coming up
          </h3>
          {agendaGroups.map((group) => (
            <div key={group.date}>
              <p className="mb-1.5 px-1 text-[11px] font-medium text-muted-foreground/50">
                {group.label}
              </p>
              <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="divide-y divide-border/20">
                  {group.posts.map((post) => {
                    const pf = PLATFORM_MAP.get(post.platform)!;
                    return (
                      <button
                        key={post.id}
                        onClick={() => openEdit(post)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/30 active:bg-secondary/40"
                      >
                        <div
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: `${pf.color}12`,
                            color: pf.color,
                          }}
                        >
                          {pf.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm leading-snug text-foreground">
                              {post.title || "untitled"}
                            </p>
                            {post.creator && (
                              <span
                                className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium text-white"
                                style={{ backgroundColor: CREATOR_MAP.get(post.creator)?.color }}
                              >
                                {CREATOR_MAP.get(post.creator)?.label}
                              </span>
                            )}
                          </div>
                          {post.caption && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground/50">
                              {post.caption}
                            </p>
                          )}
                          <span
                            className={`
                              mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium
                              ${
                                post.status === "posted"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : post.status === "drafted"
                                    ? "bg-navy/[0.08] text-navy"
                                    : "bg-secondary text-muted-foreground"
                              }
                            `}
                          >
                            {post.status === "posted" ? "✓ posted" : post.status}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Empty State ─── */}
      {totalPosts === 0 && !selectedDate && (
        <div className="animate-fade-up flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-display text-sm uppercase text-muted-foreground">
              no content planned for{" "}
              {MONTH_NAMES[month]} yet
            </p>
            <p className="mt-1 font-display text-xs uppercase text-muted-foreground/50">
              click any day to start planning
            </p>
          </div>
        </div>
      )}

      {/* ─── Floating Drag Pill ─── */}
      {draggingPost && (
        <div
          ref={floatingPillRef}
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full"
          style={{ left: 0, top: 0 }}
        >
          <div
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-border/20"
            style={{
              borderLeft: `3px solid ${platformColor(draggingPost.platform)}`,
            }}
          >
            <span style={{ color: platformColor(draggingPost.platform) }}>
              {PLATFORM_MAP.get(draggingPost.platform)?.icon}
            </span>
            <span className="max-w-[160px] truncate text-foreground">
              {draggingPost.title || "untitled"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Post Pill ─── */

function PostPill({
  post,
  onClick,
  onDragStart,
  isDragging,
}: {
  post: ContentPost;
  onClick: () => void;
  onDragStart?: (e: React.PointerEvent) => void;
  isDragging?: boolean;
}) {
  const color = platformColor(post.platform);
  const isIdea = post.status === "idea";
  const isPosted = post.status === "posted";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onDragStart?.(e);
      }}
      className={`group/pill w-full touch-none text-left transition-all ${isDragging ? "opacity-30" : ""}`}
    >
      <div
        className={`
          flex items-center gap-1 rounded-md px-1.5 py-[3px] text-[10px] leading-tight transition-all sm:text-[11px]
          ${isIdea ? "border border-dashed" : ""}
          group-hover/pill:ring-1
        `}
        style={
          {
            backgroundColor: isIdea ? "transparent" : `${color}10`,
            color: color,
            borderColor: isIdea ? `${color}30` : "transparent",
            "--tw-ring-color": `${color}25`,
          } as React.CSSProperties
        }
      >
        {isPosted && <Check className="h-2.5 w-2.5 shrink-0" />}
        {post.scope === "personal" && <span className="text-[8px] opacity-50">@</span>}
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full sm:hidden"
          style={{ backgroundColor: color }}
        />
        <span className="hidden truncate sm:inline">
          {post.title || "untitled"}
        </span>
      </div>
    </button>
  );
}
