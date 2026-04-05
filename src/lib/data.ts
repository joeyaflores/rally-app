import { getDb } from "./db";
import config from "@rally";

export const brand = {
  name: config.name,
  fullName: config.fullName,
  tagline: config.tagline,
  communityName: config.terms.community,
  memberName: config.terms.member,
  location: config.location,
  email: config.email,
  founders: config.founders,
};

export const weeklyRuns = config.events.map((e) => ({
  name: e.name,
  day: e.day,
  time: e.time,
  location: e.location,
  distance: e.distance,
}));

// Fallback seed data — used only when the database is empty (first run).
// Replace with your own numbers or leave as zeros; actual data comes from
// the admin page and Apify scraping once you start using the app.

const EMPTY = {
  followers: 0, posts: 0, reels: 0, totalViews: 0,
  viewsFromFollowers: 0, viewsFromNonFollowers: 0,
  accountsReached: 0, profileVisits: 0, externalLinkTaps: 0,
  likes: 0, comments: 0, saves: 0, shares: 0, reposts: 0,
};

export const instagram = { jan: { ...EMPTY }, feb: { ...EMPTY } };

export const tiktok = {
  jan: { followers: 0, tiktoks: 0, totalViews: 0, profileViews: 0, likes: 0, comments: 0, shares: 0 },
  feb: { followers: 0, tiktoks: 0, totalViews: 0, profileViews: 0, likes: 0, comments: 0, shares: 0 },
};

export const strava = { members: 0, posts: { jan: 0, feb: 0 } };

export const events: { date: string; day: string; attendance: number }[] = [];

export const partnerships: { name: string; type: string; status: "lead" | "active" | "closed"; description: string }[] = [];

export { pctChange, formatNumber } from "./format";

// --- Data layer ---

import { EMPTY_IG, EMPTY_TT, MONTH_NAMES } from "./analytics-types";
export { MONTH_NAMES };

function getNativeDashboardData() {
  const db = getDb();
  const now = new Date();
  const calYear = now.getFullYear();
  const calMonth = now.getMonth() + 1;

  // Check if any data exists at all
  const hasMetrics = db.prepare("SELECT 1 FROM platform_metrics LIMIT 1").get();
  const hasAttendance = db.prepare("SELECT 1 FROM attendance_events LIMIT 1").get();
  if (!hasMetrics && !hasAttendance) return null;

  // Platform data: use latest month with actual metrics (may differ from calendar)
  const latestMetrics = hasMetrics
    ? db.prepare("SELECT year, month FROM platform_metrics ORDER BY year DESC, month DESC LIMIT 1").get() as { year: number; month: number }
    : null;

  const pYear = latestMetrics?.year ?? calYear;
  const pMonth = latestMetrics?.month ?? calMonth;
  const pPrevMonth = pMonth === 1 ? 12 : pMonth - 1;
  const pPrevYear = pMonth === 1 ? pYear - 1 : pYear;

  // Batch-fetch all platform metrics for both months (was 6 separate queries)
  const metricRows = db.prepare(
    `SELECT platform, year, month, metrics FROM platform_metrics
     WHERE (year = ? AND month = ?) OR (year = ? AND month = ?)
     AND platform IN ('instagram', 'tiktok', 'strava')`
  ).all(pYear, pMonth, pPrevYear, pPrevMonth) as { platform: string; year: number; month: number; metrics: string }[];

  function getMetrics(platform: string, y: number, m: number) {
    const row = metricRows.find((r) => r.platform === platform && r.year === y && r.month === m);
    return row ? JSON.parse(row.metrics) : null;
  }

  const igCurr = getMetrics("instagram", pYear, pMonth);
  const igPrev = getMetrics("instagram", pPrevYear, pPrevMonth);
  const ttCurr = getMetrics("tiktok", pYear, pMonth);
  const ttPrev = getMetrics("tiktok", pPrevYear, pPrevMonth);
  const stravaCurr = getMetrics("strava", pYear, pMonth);
  const stravaPrev = getMetrics("strava", pPrevYear, pPrevMonth);

  // Attendance: always use current calendar month
  const startDate = `${calYear}-${String(calMonth).padStart(2, "0")}-01`;
  const nextMo = calMonth === 12 ? 1 : calMonth + 1;
  const nextYr = calMonth === 12 ? calYear + 1 : calYear;
  const endDate = `${nextYr}-${String(nextMo).padStart(2, "0")}-01`;

  const rawEvents = db.prepare(
    `SELECT event_date, day, attendance, note FROM attendance_events
     WHERE event_date >= ? AND event_date < ?
     ORDER BY event_date`
  ).all(startDate, endDate) as { event_date: string; day: string; attendance: number; note: string }[];

  const nativeEvents = rawEvents.map((e) => {
    const d = new Date(e.event_date + "T00:00:00");
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { date: dateStr, day: e.day, attendance: e.attendance };
  });

  // All attendance events across all months
  const allRawEvents = db.prepare(
    "SELECT event_date, day, attendance, note FROM attendance_events ORDER BY event_date"
  ).all() as { event_date: string; day: string; attendance: number; note: string }[];

  const allEvents = allRawEvents.map((e) => {
    const d = new Date(e.event_date + "T00:00:00");
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const monthStr = d.toLocaleDateString("en-US", { month: "short" });
    return { date: dateStr, day: e.day, attendance: e.attendance, month: monthStr, note: e.note };
  });

  // Find most recent update across both tables
  const updatedRow = db.prepare(
    `SELECT MAX(ts) as updated_at FROM (
       SELECT updated_at as ts FROM platform_metrics WHERE year = ? AND month = ?
       UNION ALL
       SELECT created_at as ts FROM attendance_events WHERE event_date >= ? AND event_date < ?
     )`
  ).get(pYear, pMonth, startDate, endDate) as { updated_at: string | null } | undefined;

  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const dayOfMonth = now.getDate();
  const isPartial = dayOfMonth < daysInMonth;

  const updatedDate = updatedRow?.updated_at ? new Date(updatedRow.updated_at) : now;
  const lastUpdatedShort = updatedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toLowerCase();

  return {
    lastUpdated: updatedRow?.updated_at
      ? new Date(updatedRow.updated_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    currentMonth: MONTH_NAMES[calMonth],
    previousMonth: MONTH_NAMES[calMonth === 1 ? 12 : calMonth - 1],
    platformMonth: MONTH_NAMES[pMonth],
    platformPrevMonth: MONTH_NAMES[pPrevMonth],
    isPartial,
    dayOfMonth,
    daysInMonth,
    lastUpdatedShort,
    ig: {
      prev: igPrev ?? EMPTY_IG,
      curr: igCurr ?? EMPTY_IG,
    },
    tt: {
      prev: ttPrev ?? EMPTY_TT,
      curr: ttCurr ?? EMPTY_TT,
    },
    strava: {
      members: stravaCurr?.members ?? 0,
      posts: {
        prev: stravaPrev?.posts ?? 0,
        curr: stravaCurr?.posts ?? 0,
      },
    },
    events: nativeEvents,
    allEvents,
  };
}

function formatSyncDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getDashboardData() {
  // Prefer native analytics tables
  const native = getNativeDashboardData();
  if (native) return native;

  // Fallback to hardcoded data when native tables are empty
  return {
    lastUpdated: formatSyncDate("2026-02-28T18:30:00Z"),
    currentMonth: "February",
    previousMonth: "January",
    platformMonth: "February",
    platformPrevMonth: "January",
    isPartial: false,
    dayOfMonth: 28,
    daysInMonth: 28,
    lastUpdatedShort: "feb 28",
    ig: { prev: instagram.jan, curr: instagram.feb },
    tt: { prev: tiktok.jan, curr: tiktok.feb },
    strava: { members: strava.members, posts: { prev: strava.posts.jan, curr: strava.posts.feb } },
    events,
    allEvents: events.map((e) => ({ ...e, month: "Feb", note: "" })),
  };
}
