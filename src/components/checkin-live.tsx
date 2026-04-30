"use client";

import { useState, useTransition, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Play,
  Square,
  Trash2,
  RefreshCw,
  Sparkles,
  Users,
  Upload,
  X,
  FileText,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import {
  openCheckinSession,
  closeCheckinSession,
  getSessionCheckins,
  deleteCheckinSession,
  drawRaffleWinner,
} from "@/lib/checkin";
import { createReportFromSession, publishReport } from "@/lib/reports";
import { BASE_URL } from "@/lib/socials";
import type { CheckinSessionWithCount, Checkin, SessionTheme, Vendor } from "@/lib/checkin";
import { formatDate, displayName } from "@/lib/format";
import { THEMES } from "@/lib/themes";
import { VendorEditor } from "@/components/vendor-editor";

const DAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const THEME_KEYS = Object.keys(THEMES) as SessionTheme[];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" });
}

export function CheckinLive({
  initialActive,
  initialSessions,
  initialSessionReports,
}: {
  initialActive: CheckinSessionWithCount | null;
  initialSessions: CheckinSessionWithCount[];
  initialSessionReports: Record<string, { token: string; published: number }>;
}) {
  const [active, setActive] = useState(initialActive);
  const [sessions, setSessions] = useState(initialSessions);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Report state
  const [sessionReports, setSessionReports] = useState(initialSessionReports);
  const [justClosedReport, setJustClosedReport] = useState<{
    token: string;
    title: string;
    count: number;
    reportId: string;
    sessionId: string;
    published: boolean;
  } | null>(null);
  const [reportCopied, setReportCopied] = useState(false);

  // Open session form
  const [showOpen, setShowOpen] = useState(false);
  const now = new Date();
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newEventDetails, setNewEventDetails] = useState("");
  const [newTheme, setNewTheme] = useState<SessionTheme>("navy");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newVendors, setNewVendors] = useState<Vendor[]>([]);
  const [newDate, setNewDate] = useState(now.toISOString().slice(0, 10));
  const [newDay, setNewDay] = useState(DAY_OPTIONS[now.getDay() === 0 ? 6 : now.getDay() - 1]);

  // Raffle state
  const [raffleState, setRaffleState] = useState<"idle" | "spinning" | "done">("idle");
  const [winner, setWinner] = useState<Checkin | null>(null);
  const [excludedEmails, setExcludedEmails] = useState<string[]>([]);
  const [spinName, setSpinName] = useState("");
  const raffleIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Cleanup raffle interval on unmount
  useEffect(() => {
    return () => {
      if (raffleIntervalRef.current) clearInterval(raffleIntervalRef.current);
    };
  }, []);

  const closedSessions = useMemo(
    () => sessions.filter((s) => s.status === "closed"),
    [sessions]
  );

  // Load check-ins for active session
  const loadCheckins = useCallback(() => {
    if (!active) return;
    startTransition(async () => {
      const data = await getSessionCheckins(active.id);
      setCheckins(data);
    });
  }, [active]);

  useEffect(() => {
    loadCheckins();
  }, [loadCheckins]);

  // Poll for new check-ins every 5s when session is open (stable interval via ref)
  const checkinCountRef = useRef(checkins.length);
  useEffect(() => {
    checkinCountRef.current = checkins.length;
  }, [checkins.length]);

  useEffect(() => {
    if (!active || active.status !== "open") return;
    const interval = setInterval(async () => {
      const data = await getSessionCheckins(active.id);
      if (data.length !== checkinCountRef.current) {
        setCheckins(data);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [active]);

  async function handleImageUpload(file: File) {
    setUploadingImage(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      if (res.ok) {
        const { url } = await res.json();
        setNewImageUrl(url);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to upload image.");
      }
    } catch {
      setError("Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  }

  function handleOpen() {
    setError("");
    startTransition(async () => {
      const result = await openCheckinSession({
        title: newTitle || `${newDay} Run`,
        sessionDate: newDate,
        day: newDay,
        subtitle: newSubtitle,
        theme: newTheme,
        imageUrl: newImageUrl,
        eventDetails: newEventDetails,
        vendors: newVendors,
      });
      if (result.ok && result.session) {
        const newSession = { ...result.session, checkin_count: 0 };
        setActive(newSession);
        setSessions((prev) => [newSession, ...prev]);
        setShowOpen(false);
        setJustClosedReport(null);
        setNewTitle("");
        setNewSubtitle("");
        setNewEventDetails("");
        setNewTheme("navy");
        setNewImageUrl("");
        setNewVendors([]);
        setCheckins([]);
      } else {
        setError(result.error ?? "Failed to open session.");
      }
    });
  }

  function handleClose() {
    if (!active) return;
    setError("");
    startTransition(async () => {
      const result = await closeCheckinSession(active.id);
      if (result.ok) {
        const closed = { ...active, status: "closed" as const, checkin_count: checkins.length };
        setSessions((prev) =>
          prev.map((s) => (s.id === active.id ? closed : s))
        );

        // Auto-create draft report
        const reportResult = await createReportFromSession(active.id);
        if (reportResult.ok && reportResult.report) {
          const r = reportResult.report;
          setSessionReports((prev) => ({
            ...prev,
            [active.id]: { token: r.token, published: r.published },
          }));
          setJustClosedReport({
            token: r.token,
            title: active.title,
            count: checkins.length,
            reportId: r.id,
            sessionId: active.id,
            published: r.published === 1,
          });
        }

        setActive(null);
        setRaffleState("idle");
        setWinner(null);
        setExcludedEmails([]);
      } else {
        setError(result.error ?? "Failed to close session.");
      }
    });
  }

  function handleDelete(id: string) {
    setError("");
    startTransition(async () => {
      await deleteCheckinSession(id);
      if (active?.id === id) setActive(null);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    });
  }

  function handleRaffle() {
    if (!active) return;
    setRaffleState("spinning");
    setWinner(null);

    const names = checkins.filter((c) => !excludedEmails.includes(c.email));
    if (names.length === 0) {
      setRaffleState("idle");
      return;
    }

    let count = 0;
    const totalSpins = 15 + Math.floor(Math.random() * 10);
    raffleIntervalRef.current = setInterval(() => {
      const pick = names[Math.floor(Math.random() * names.length)];
      setSpinName(pick.first_name || pick.name);
      count++;
      if (count >= totalSpins) {
        clearInterval(raffleIntervalRef.current);
        startTransition(async () => {
          const result = await drawRaffleWinner(active.id, excludedEmails);
          if (result.ok && result.winner) {
            setWinner(result.winner);
            setSpinName(displayName(result.winner.first_name, null, result.winner.name));
            setRaffleState("done");
          } else {
            setRaffleState("idle");
          }
        });
      }
    }, 80);
  }

  function handleExcludeWinner() {
    if (winner) {
      setExcludedEmails((prev) => [...prev, winner.email]);
      setWinner(null);
      setRaffleState("idle");
      setSpinName("");
    }
  }

  return (
    <div className="space-y-8">
      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ─── Just-closed report card ─── */}
      {justClosedReport && !active && (
        <div className="animate-fade-up overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm">
          <div className="border-b border-border/30 bg-emerald-50/50 px-5 py-3">
            <p className="flex items-center gap-1.5 font-display text-xs uppercase tracking-widest text-emerald-700">
              <Check className="h-3.5 w-3.5" />
              session closed &middot; report draft ready
            </p>
          </div>
          <div className="px-5 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy/[0.06]">
                <FileText className="h-5 w-5 text-navy" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base tracking-tight text-navy">
                  {justClosedReport.title.toLowerCase()}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {justClosedReport.count} checked in &middot;{" "}
                  {justClosedReport.published ? (
                    <span className="text-emerald-600">published</span>
                  ) : (
                    <span className="text-amber-600">draft</span>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {!justClosedReport.published ? (
                <button
                  onClick={() => {
                    startTransition(async () => {
                      await publishReport(justClosedReport.reportId);
                      setJustClosedReport((prev) =>
                        prev ? { ...prev, published: true } : null
                      );
                      setSessionReports((prev) => ({
                        ...prev,
                        [justClosedReport.sessionId]: {
                          ...prev[justClosedReport.sessionId],
                          published: 1,
                        },
                      }));
                    });
                  }}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-xs font-medium text-white transition-all hover:bg-navy-light disabled:opacity-50"
                >
                  publish report
                </button>
              ) : (
                <a
                  href={`${BASE_URL}/report/${justClosedReport.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-xs font-medium text-white transition-all hover:bg-navy-light"
                >
                  <ExternalLink className="h-3 w-3" />
                  view report
                </a>
              )}
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    `${BASE_URL}/report/${justClosedReport.token}`
                  );
                  setReportCopied(true);
                  setTimeout(() => setReportCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary/50"
              >
                {reportCopied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    copy link
                  </>
                )}
              </button>
              <a
                href="/admin/reports"
                className="flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary/50"
              >
                edit report
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── Active Session or Open New ─── */}
      {active ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-medium uppercase tracking-widest text-muted-foreground">
                live — {active.title.toLowerCase()}
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground/60">
                {formatDate(active.session_date)} &middot; share /checkin with runners
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              <Square className="h-3 w-3" />
              close session
            </button>
          </div>

          {/* Count */}
          <div className="mb-6 rounded-2xl border border-border/50 bg-white p-8 text-center shadow-sm">
            <p className="font-stat text-[0.6rem] tracking-[0.3em] uppercase text-muted-foreground/50">
              checked in
            </p>
            <p className="font-stat text-7xl tabular-nums leading-none tracking-wide text-navy sm:text-8xl">
              {checkins.length}
            </p>
            <button
              onClick={loadCheckins}
              disabled={isPending}
              className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground/40 transition-colors hover:text-muted-foreground disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isPending ? "animate-spin" : ""}`} />
              refresh
            </button>
          </div>

          {/* Raffle */}
          {checkins.length > 0 && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm">
              <div className="border-b border-border/30 px-5 py-3">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-1.5 font-display text-xs uppercase tracking-widest text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    raffle
                  </h4>
                  {excludedEmails.length > 0 && (
                    <span className="text-[10px] text-muted-foreground/40">
                      {excludedEmails.length} excluded
                    </span>
                  )}
                </div>
              </div>

              <div className="px-5 py-6 text-center">
                {raffleState === "spinning" && (
                  <p className="animate-pulse font-display text-3xl tracking-wide text-navy">
                    {spinName}
                  </p>
                )}
                {raffleState === "done" && winner && (
                  <div>
                    <p className="font-stat text-[0.55rem] tracking-[0.3em] uppercase text-muted-foreground/40">
                      winner
                    </p>
                    <p className="font-display text-4xl tracking-wide text-navy sm:text-5xl">
                      {displayName(winner.first_name, winner.last_name, winner.name)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/40">{winner.email}</p>
                    <button
                      onClick={handleExcludeWinner}
                      className="mt-4 text-xs text-muted-foreground/40 transition-colors hover:text-muted-foreground"
                    >
                      exclude &amp; draw again
                    </button>
                  </div>
                )}
                {raffleState === "idle" && (
                  <p className="text-sm text-muted-foreground/40">
                    {checkins.length - excludedEmails.length} eligible
                  </p>
                )}
              </div>

              <div className="border-t border-border/30 px-5 py-3">
                <button
                  onClick={handleRaffle}
                  disabled={isPending || raffleState === "spinning" || checkins.length - excludedEmails.length === 0}
                  className="w-full rounded-xl bg-navy px-6 py-3 font-display text-sm tracking-wide text-white transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  {raffleState === "done" ? "draw again" : "pick a winner"}
                </button>
              </div>
            </div>
          )}

          {/* Check-in list */}
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm">
            <div className="border-b border-border/30 px-5 py-3">
              <h4 className="flex items-center gap-1.5 font-display text-xs uppercase tracking-widest text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                who&apos;s here
              </h4>
            </div>
            {checkins.length > 0 ? (
              <div className="divide-y divide-border/30">
                {checkins.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-foreground">
                        {displayName(c.first_name, c.last_name, c.name)}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground/40">{c.email}</span>
                      {c.phone && (
                        <span className="ml-1.5 text-xs text-muted-foreground/30">{c.phone}</span>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground/30">
                      {formatTime(c.checked_in_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                waiting for check-ins…
              </p>
            )}
          </div>
        </section>
      ) : (
        <section>
          <div className="mb-4">
            <h3 className="font-display text-sm font-medium uppercase tracking-widest text-foreground">
              check-in sessions
            </h3>
            <p className="mt-1 font-display text-[11px] uppercase text-foreground/75">
              open a session to start collecting check-ins at your run
            </p>
          </div>

          {!showOpen ? (
            <button
              onClick={() => setShowOpen(true)}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy/10 bg-white/50 px-6 py-5 font-display text-sm tracking-wide text-navy transition-colors hover:border-navy/20 hover:bg-white"
            >
              <Play className="h-4 w-4" />
              open check-in
            </button>
          ) : (
            <div className="mb-6 overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm">
              <div className="space-y-3 px-5 py-4">
                <input
                  type="text"
                  name="session-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="session name…"
                  aria-label="Session name"
                  className="w-full rounded-lg border border-border/50 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-foreground/60 focus-visible:border-navy/30 focus-visible:ring-1 focus-visible:ring-navy/10"
                />
                <input
                  type="text"
                  name="session-subtitle"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="tagline for check-in page…"
                  aria-label="Event subtitle"
                  className="w-full rounded-lg border border-border/50 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-foreground/60 focus-visible:border-navy/30 focus-visible:ring-1 focus-visible:ring-navy/10"
                />
                <textarea
                  name="session-event-details"
                  value={newEventDetails}
                  onChange={(e) => setNewEventDetails(e.target.value)}
                  placeholder={"run details shown after check-in…\none line per item"}
                  aria-label="Event details"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border/50 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-foreground/60 focus-visible:border-navy/30 focus-visible:ring-1 focus-visible:ring-navy/10"
                />
                <div className="flex gap-3">
                  <input
                    type="date"
                    name="session-date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    aria-label="Session date"
                    className="flex-1 rounded-lg border border-border/50 bg-white px-3 py-2 text-sm outline-none transition-colors focus-visible:border-navy/30 focus-visible:ring-1 focus-visible:ring-navy/10"
                  />
                  <select
                    name="session-day"
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    aria-label="Day of week"
                    className="rounded-lg border border-border/50 bg-white px-3 py-2 text-sm outline-none transition-colors focus-visible:border-navy/30 focus-visible:ring-1 focus-visible:ring-navy/10"
                  >
                    {DAY_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Theme picker */}
                <div>
                  <p className="mb-2 font-display text-[11px] uppercase text-foreground">check-in page theme</p>
                  <div className="flex gap-2">
                    {THEME_KEYS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNewTheme(key)}
                        aria-label={`${THEMES[key].label} theme`}
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${THEMES[key].bg} transition-all ${
                          newTheme === key
                            ? "ring-2 ring-navy ring-offset-2"
                            : "opacity-50 hover:opacity-75"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Image upload */}
                <div>
                  <p className="mb-2 font-display text-[11px] uppercase text-foreground">background image</p>
                  {newImageUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={newImageUrl}
                        alt="Event background"
                        className="h-16 w-24 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setNewImageUrl("")}
                        className="absolute -right-1.5 -top-1.5 rounded-full bg-foreground/80 p-0.5 text-white transition-colors hover:bg-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border/60 px-3 py-2 font-display text-xs uppercase text-foreground transition-colors hover:border-navy/30 hover:bg-secondary/30">
                      <Upload className="h-3 w-3" />
                      {uploadingImage ? "uploading…" : "upload image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                      />
                    </label>
                  )}
                </div>

                <VendorEditor vendors={newVendors} onChange={setNewVendors} />
              </div>
              <div className="flex gap-2 border-t border-border/30 bg-secondary/20 px-5 py-3">
                <button
                  onClick={handleOpen}
                  disabled={isPending || uploadingImage || !newDate}
                  className="flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 font-display text-sm font-medium uppercase text-white transition-all hover:bg-navy-light disabled:opacity-40"
                >
                  <Play className="h-3.5 w-3.5" />
                  start
                </button>
                <button
                  onClick={() => setShowOpen(false)}
                  className="rounded-lg px-3 py-2 font-display text-sm uppercase text-foreground transition-colors hover:bg-secondary/50"
                >
                  cancel
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── Past Sessions ─── */}
      {closedSessions.length > 0 && (
        <section>
          <h3 className="mb-4 font-display text-sm font-medium uppercase tracking-widest text-muted-foreground">
            past sessions
          </h3>
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm">
            <div className="divide-y divide-border/30">
              {closedSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-foreground">{s.title || s.day + " Run"}</span>
                    <span className="ml-2 text-xs text-muted-foreground/40">
                      {formatDate(s.session_date)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="flex items-center gap-1 rounded-full bg-navy/[0.06] px-2.5 py-0.5 text-xs font-medium text-navy">
                      <Users className="h-3 w-3" />
                      {s.checkin_count}
                    </span>
                    {sessionReports[s.id] ? (
                      <a
                        href={
                          sessionReports[s.id].published
                            ? `${BASE_URL}/report/${sessionReports[s.id].token}`
                            : "/admin/reports"
                        }
                        target={sessionReports[s.id].published ? "_blank" : undefined}
                        rel={sessionReports[s.id].published ? "noopener noreferrer" : undefined}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                          sessionReports[s.id].published
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        }`}
                      >
                        <FileText className="h-3 w-3" />
                        {sessionReports[s.id].published ? "report" : "draft"}
                      </a>
                    ) : null}
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={isPending}
                      aria-label={`Delete ${s.title || s.day + " Run"} session`}
                      className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
