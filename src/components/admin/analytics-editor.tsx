"use client";

import { useState, useTransition, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  X,
  Plus,
  Trash2,
  Database,
  Instagram,
} from "lucide-react";
import {
  getMonthData,
  getMonthSnapshots,
  saveMonthMetrics,
  addAttendanceEvent,
  updateAttendanceNote,
  deleteAttendanceEvent,
  seedInitialData,
} from "@/lib/analytics";
import { syncFromApify } from "@/lib/apify";
import {
  EMPTY_IG,
  EMPTY_TT,
  EMPTY_STRAVA,
  MONTH_NAMES,
} from "@/lib/analytics-types";
import type {
  IGMetrics,
  TTMetrics,
  StravaMetrics,
  AttendanceEvent,
  MonthData,
  MetricSnapshot,
} from "@/lib/analytics-types";
import { TikTokIcon, StravaIcon } from "@/components/icons";

interface FieldDef {
  key: string;
  label: string;
  sub?: string;
}

const IG_FIELDS: FieldDef[] = [
  { key: "followers", label: "followers", sub: "current total" },
  { key: "posts", label: "posts", sub: "posted this month" },
  { key: "reels", label: "reels", sub: "posted this month" },
  { key: "totalViews", label: "total views", sub: "this month" },
  { key: "viewsFromFollowers", label: "views from followers %", sub: "this month" },
  { key: "viewsFromNonFollowers", label: "views from non-followers %", sub: "this month" },
  { key: "accountsReached", label: "accounts reached", sub: "this month" },
  { key: "profileVisits", label: "profile visits", sub: "this month" },
  { key: "externalLinkTaps", label: "external link taps", sub: "this month" },
  { key: "likes", label: "likes", sub: "this month" },
  { key: "comments", label: "comments", sub: "this month" },
  { key: "saves", label: "saves", sub: "this month" },
  { key: "shares", label: "shares", sub: "this month" },
  { key: "reposts", label: "reposts", sub: "this month" },
];

const TT_FIELDS: FieldDef[] = [
  { key: "followers", label: "followers", sub: "current total" },
  { key: "tiktoks", label: "tiktoks", sub: "posted this month" },
  { key: "totalViews", label: "total views", sub: "this month" },
  { key: "profileViews", label: "profile views", sub: "this month" },
  { key: "likes", label: "likes", sub: "this month" },
  { key: "comments", label: "comments", sub: "this month" },
  { key: "shares", label: "shares", sub: "this month" },
];

const STRAVA_FIELDS: FieldDef[] = [
  { key: "members", label: "members", sub: "current total" },
  { key: "posts", label: "posts", sub: "this month" },
];

interface Props {
  initialYear: number;
  initialMonth: number;
  initialData: MonthData;
  initialSnapshots: MetricSnapshot[];
  needsSeed: boolean;
}

export function AnalyticsEditor({ initialYear, initialMonth, initialData, initialSnapshots, needsSeed }: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [ig, setIg] = useState<IGMetrics>(initialData.ig ?? { ...EMPTY_IG });
  const [tt, setTt] = useState<TTMetrics>(initialData.tt ?? { ...EMPTY_TT });
  const [sv, setSv] = useState<StravaMetrics>(initialData.strava ?? { ...EMPTY_STRAVA });
  const [events, setEvents] = useState<AttendanceEvent[]>(initialData.events);
  const [snapshots, setSnapshots] = useState<MetricSnapshot[]>(initialSnapshots);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [seeded, setSeeded] = useState(!needsSeed);
  const [isPending, startTransition] = useTransition();

  // --- New event form ---
  const [newDate, setNewDate] = useState("");
  const [newCount, setNewCount] = useState("");
  const [newNote, setNewNote] = useState("");

  const navigateMonth = useCallback((dir: 1 | -1) => {
    startTransition(async () => {
      let nextMonth = month + dir;
      let nextYear = year;
      if (nextMonth < 1) { nextMonth = 12; nextYear--; }
      if (nextMonth > 12) { nextMonth = 1; nextYear++; }

      const [data, snaps] = await Promise.all([
        getMonthData(nextYear, nextMonth),
        getMonthSnapshots(nextYear, nextMonth),
      ]);
      setYear(nextYear);
      setMonth(nextMonth);
      setIg(data.ig ?? { ...EMPTY_IG });
      setTt(data.tt ?? { ...EMPTY_TT });
      setSv(data.strava ?? { ...EMPTY_STRAVA });
      setEvents(data.events);
      setSnapshots(snaps);
      setDirty(false);
      setResult(null);
      setNewDate("");
      setNewCount("");
      setNewNote("");
    });
  }, [month, year]);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const res = await saveMonthMetrics(year, month, ig, tt, sv);
      setResult(res);
      if (res.success) {
        setDirty(false);
        const snaps = await getMonthSnapshots(year, month);
        setSnapshots(snaps);
      }
      setTimeout(() => setResult(null), 3000);
    });
  }, [year, month, ig, tt, sv]);

  const handleAddEvent = useCallback(() => {
    if (!newDate || !newCount) return;
    startTransition(async () => {
      const d = new Date(newDate + "T00:00:00");
      const day = d.toLocaleDateString("en-US", { weekday: "short" });
      const res = await addAttendanceEvent(newDate, day, parseInt(newCount, 10), newNote.trim());
      if (res.success && res.event) {
        setEvents((prev) => [...prev, res.event!].sort((a, b) => a.event_date.localeCompare(b.event_date)));
        setNewDate("");
        setNewCount("");
        setNewNote("");
      }
    });
  }, [newDate, newCount, newNote]);

  const handleDeleteEvent = useCallback((id: string) => {
    startTransition(async () => {
      await deleteAttendanceEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    });
  }, []);

  const handleSeed = useCallback(() => {
    startTransition(async () => {
      const res = await seedInitialData();
      if (res.success) {
        setSeeded(true);
        const [data, snaps] = await Promise.all([
          getMonthData(year, month),
          getMonthSnapshots(year, month),
        ]);
        setIg(data.ig ?? { ...EMPTY_IG });
        setTt(data.tt ?? { ...EMPTY_TT });
        setSv(data.strava ?? { ...EMPTY_STRAVA });
        setEvents(data.events);
        setSnapshots(snaps);
      }
      setResult(res);
      setTimeout(() => setResult(null), 3000);
    });
  }, [year, month]);

  const [syncing, startSync] = useTransition();

  function handleSync() {
    setResult(null);
    startSync(async () => {
      try {
        const data = await syncFromApify();
        let filled = 0;
        if (data.ig) {
          setIg((prev) => {
            const next = { ...prev };
            for (const [k, v] of Object.entries(data.ig!)) {
              if (v && v > 0) (next as Record<string, number>)[k] = v;
            }
            return next;
          });
          filled++;
        }
        if (data.tt) {
          setTt((prev) => {
            const next = { ...prev };
            for (const [k, v] of Object.entries(data.tt!)) {
              if (v && v > 0) (next as Record<string, number>)[k] = v;
            }
            return next;
          });
          filled++;
        }
        if (filled > 0) setDirty(true);
        const msg = filled > 0
          ? `synced ${filled} platform${filled !== 1 ? "s" : ""} — review & fill in private metrics, then save`
          : "no data returned";
        setResult({
          success: filled > 0,
          message: data.error ? `${msg} (${data.error})` : msg,
        });
      } catch (err) {
        setResult({ success: false, message: err instanceof Error ? err.message : "Sync failed" });
      }
      setTimeout(() => setResult(null), 5000);
    });
  }

  function updateIg(key: keyof IGMetrics, val: string) {
    setIg((prev) => ({ ...prev, [key]: Number(val) || 0 }));
    setDirty(true);
  }

  function updateTt(key: keyof TTMetrics, val: string) {
    setTt((prev) => ({ ...prev, [key]: Number(val) || 0 }));
    setDirty(true);
  }

  function updateSv(key: keyof StravaMetrics, val: string) {
    setSv((prev) => ({ ...prev, [key]: Number(val) || 0 }));
    setDirty(true);
  }

  return (
    <div className="space-y-8">
      {/* Seed banner */}
      {!seeded && (
        <div className="animate-fade-up rounded-2xl border-2 border-dashed border-navy/20 bg-white p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/5">
            <Database className="h-6 w-6 text-navy" />
          </div>
          <p className="mb-1 font-display text-lg text-navy">welcome in</p>
          <p className="mb-4 text-sm text-muted-foreground">
            load your january & february numbers so the dashboard has something to show
          </p>
          <button
            onClick={handleSeed}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-navy-light disabled:opacity-50"
          >
            <Database className="h-4 w-4" />
            load existing data
          </button>
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          disabled={isPending}
          className="rounded-xl border border-border/50 bg-white p-2.5 text-muted-foreground shadow-sm transition-all hover:border-navy/20 hover:text-navy disabled:opacity-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="text-center">
          <h2 className="font-display text-3xl tracking-tight text-navy sm:text-4xl">
            {MONTH_NAMES[month].toLowerCase()}
          </h2>
          <p className="text-sm text-muted-foreground">{year}</p>
        </div>

        <button
          onClick={() => navigateMonth(1)}
          disabled={isPending}
          className="rounded-xl border border-border/50 bg-white p-2.5 text-muted-foreground shadow-sm transition-all hover:border-navy/20 hover:text-navy disabled:opacity-50"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* How it works + sync */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          pull the current numbers from each app&apos;s insights and type them below.
          <br className="hidden sm:block" />
          {" "}you can update anytime — every save is tracked so nothing gets lost.
        </p>
        <button
          onClick={handleSync}
          disabled={syncing || isPending}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-white px-3 py-1.5 text-xs text-muted-foreground shadow-sm transition-colors hover:border-navy/20 hover:text-navy disabled:opacity-50"
        >
          {syncing ? "syncing…" : "sync from apify"}
        </button>
      </div>

      {/* Loading overlay */}
      {isPending && (
        <div className="flex justify-center py-2">
          <div className="h-1 w-24 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-navy" />
          </div>
        </div>
      )}

      {/* Platform sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Instagram */}
        <PlatformSection
          title="instagram"
          icon={<Instagram className="h-4 w-4" />}
          color="#E1306C"
          fields={IG_FIELDS}
          values={ig as unknown as Record<string, number>}
          onChange={updateIg as (key: string, val: string) => void}
          hint="profile → professional dashboard → account insights"
        />

        {/* TikTok */}
        <PlatformSection
          title="tiktok"
          icon={<TikTokIcon className="h-4 w-4" />}
          color="#000000"
          fields={TT_FIELDS}
          values={tt as unknown as Record<string, number>}
          onChange={updateTt as (key: string, val: string) => void}
          hint="profile → creator tools → analytics"
        />
      </div>

      {/* Strava */}
      <PlatformSection
        title="strava"
        icon={<StravaIcon className="h-4 w-4" />}
        color="#FC4C02"
        fields={STRAVA_FIELDS}
        values={sv as unknown as Record<string, number>}
        onChange={updateSv as (key: string, val: string) => void}
        hint="club page → member count & activity posts"
        compact
      />

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending || !dirty}
          className="inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-navy-light hover:shadow-md disabled:opacity-40"
        >
          <Save className="h-4 w-4" />
          save {MONTH_NAMES[month].toLowerCase()} metrics
        </button>
        {result && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
              result.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {result.success ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {result.message}
          </span>
        )}
      </div>

      {/* Snapshot history */}
      <SnapshotHistory snapshots={snapshots} month={MONTH_NAMES[month].toLowerCase()} />

      {/* Attendance */}
      <section>
        <div className="mb-4">
          <h3 className="font-display text-sm font-medium uppercase tracking-widest text-muted-foreground">
            attendance — {MONTH_NAMES[month].toLowerCase()}
          </h3>
          <p className="mt-1 text-[11px] text-muted-foreground/60">
            log the headcount after each run — pick the date and enter how many showed up
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm">
          {events.length > 0 ? (
            <div className="divide-y divide-border/30">
              {events.map((evt) => {
                const d = new Date(evt.event_date + "T00:00:00");
                const display = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                return (
                  <div key={evt.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <span className="w-16 shrink-0 text-sm text-muted-foreground">{display}</span>
                      <span className="w-10 shrink-0 rounded-md bg-secondary/60 px-2 py-0.5 text-center text-xs font-medium text-navy">
                        {evt.day}
                      </span>
                      <input
                        type="text"
                        defaultValue={evt.note}
                        placeholder="add note..."
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val !== (evt.note || "")) {
                            updateAttendanceNote(evt.id, val);
                            setEvents((prev) => prev.map((ev) => ev.id === evt.id ? { ...ev, note: val } : ev));
                          }
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                        className="min-w-0 flex-1 border-0 bg-transparent px-0 text-xs italic text-muted-foreground/60 outline-none placeholder:not-italic placeholder:text-muted-foreground/25 focus:text-foreground"
                      />
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-stat text-2xl tracking-wide text-navy">
                        {evt.attendance}
                      </span>
                      <button
                        onClick={() => handleDeleteEvent(evt.id)}
                        disabled={isPending}
                        className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">
              no attendance logged for {MONTH_NAMES[month].toLowerCase()}
            </p>
          )}

          {/* Add event row */}
          <div className="border-t border-border/30 bg-secondary/20 px-5 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="rounded-lg border border-border/50 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-navy/30 focus:ring-1 focus:ring-navy/10"
              />
              <input
                type="number"
                value={newCount}
                onChange={(e) => setNewCount(e.target.value)}
                placeholder="count"
                min={0}
                className="w-24 rounded-lg border border-border/50 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-navy/30 focus:ring-1 focus:ring-navy/10"
              />
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="note (optional)"
                className="min-w-0 flex-1 rounded-lg border border-border/50 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-navy/30 focus:ring-1 focus:ring-navy/10"
              />
              <button
                onClick={handleAddEvent}
                disabled={isPending || !newDate || !newCount}
                className="rounded-lg bg-navy p-2 text-white transition-all hover:bg-navy-light disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// --- Platform section component ---

function PlatformSection({
  title,
  icon,
  color,
  fields,
  values,
  onChange,
  compact,
  hint,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  fields: FieldDef[];
  values: Record<string, number>;
  onChange: (key: string, val: string) => void;
  compact?: boolean;
  hint?: string;
}) {
  return (
    <section className="animate-fade-up">
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}12` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <div>
          <h3 className="font-display text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {title}
          </h3>
          {hint && (
            <p className="text-[11px] text-muted-foreground/60">{hint}</p>
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
        <div className={`grid gap-x-6 gap-y-4 ${compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs text-muted-foreground">
                {f.label}
                {f.sub && (
                  <span className="ml-1 text-muted-foreground/40">{f.sub}</span>
                )}
              </label>
              <input
                type="number"
                value={values[f.key] || ""}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder="0"
                step="any"
                className="w-full rounded-lg border border-border/40 bg-secondary/20 px-3 py-2 font-stat text-xl tracking-wide text-navy outline-none transition-all placeholder:text-border focus:border-navy/30 focus:bg-white focus:ring-1 focus:ring-navy/10"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Snapshot history ---

function SnapshotHistory({ snapshots, month }: { snapshots: MetricSnapshot[]; month: string }) {
  if (snapshots.length === 0) return null;

  // Group snapshots by recorded_at timestamp (3 per save: ig, tt, strava)
  const saves: { time: string; ig?: Record<string, number>; tt?: Record<string, number>; strava?: Record<string, number> }[] = [];
  const byTime = new Map<string, typeof saves[number]>();

  for (const s of snapshots) {
    let entry = byTime.get(s.recorded_at);
    if (!entry) {
      entry = { time: s.recorded_at };
      byTime.set(s.recorded_at, entry);
      saves.push(entry);
    }
    if (s.platform === "instagram") entry.ig = s.metrics;
    else if (s.platform === "tiktok") entry.tt = s.metrics;
    else if (s.platform === "strava") entry.strava = s.metrics;
  }

  return (
    <section>
      <div className="mb-4">
        <h3 className="font-display text-sm font-medium uppercase tracking-widest text-muted-foreground">
          update history — {month}
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          every time you save, the numbers are logged here so you can see growth throughout the month
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm">
        <div className="divide-y divide-border/30">
          {saves.map((save, i) => {
            const d = new Date(save.time + "Z");
            const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
            const igFollowers = save.ig?.followers ?? 0;
            const ttFollowers = save.tt?.followers ?? 0;
            const stravaMembers = save.strava?.members ?? 0;
            const totalFollowers = igFollowers + ttFollowers + stravaMembers;
            const igViews = save.ig?.totalViews ?? 0;
            const ttViews = save.tt?.totalViews ?? 0;

            // Compare with previous save
            const prev = i > 0 ? saves[i - 1] : null;
            const prevTotal = prev
              ? (prev.ig?.followers ?? 0) + (prev.tt?.followers ?? 0) + (prev.strava?.members ?? 0)
              : 0;
            const followerDelta = prev ? totalFollowers - prevTotal : 0;

            return (
              <div key={save.time} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{dateStr}</span>
                    <span className="text-xs text-muted-foreground">{timeStr}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="font-stat text-lg tracking-wide text-navy">
                      {totalFollowers.toLocaleString()}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">followers</span>
                    {followerDelta !== 0 && (
                      <span className={`ml-1.5 text-xs font-medium ${followerDelta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {followerDelta > 0 ? "+" : ""}{followerDelta}
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <span className="font-stat text-lg tracking-wide text-navy">
                      {(igViews + ttViews).toLocaleString()}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">views</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
