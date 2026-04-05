"use server";

import { headers } from "next/headers";
import { auth } from "./auth";
import { getDb } from "./db";
import * as Sentry from "@sentry/nextjs";
import { log } from "./log";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
const SHEET_RANGE = "2026!A1:Z50";

// --- Google token refresh ---

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_SHEETS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_SHEETS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_SHEETS_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

// --- Sheet fetching ---

async function fetchSheet(): Promise<string[][]> {
  const token = await getAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_RANGE)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Sheets API failed: ${res.status}`);
  const data = await res.json();
  return data.values ?? [];
}

// --- Parsing helpers ---

function parseNum(val: string | undefined): number {
  if (!val) return 0;
  return Number(val.replace(/[,%]/g, "")) || 0;
}

function findSection(rows: string[][], header: string): number {
  return rows.findIndex((r) => r[0]?.trim().toUpperCase() === header);
}

function getMonthColumns(rows: string[][], headerRow: number): string[] {
  // The row after the section header has month names
  return rows[headerRow + 1] ?? [];
}

function metricVal(rows: string[][], sectionStart: number, metricOffset: number, colIdx: number): number {
  const row = rows[sectionStart + 2 + metricOffset]; // +2 to skip header + month row
  return parseNum(row?.[colIdx]);
}

// --- Attendance parsing ---

function parseAttendance(rows: string[][], stravaStart: number, monthCol: number): { date: string; day: string; attendance: number }[] {
  const events: { date: string; day: string; attendance: number }[] = [];
  // Attendance rows start after strava metrics (members, posts)
  const attendanceStart = stravaStart + 4; // header + months + members + posts

  for (let i = attendanceStart; i < rows.length; i++) {
    const cell = rows[i]?.[monthCol];
    if (!cell?.trim()) continue;
    // Format: "Mon 2/2 - 102" or "Sat 3/7 -"
    const match = cell.match(/^(\w+)\s+(\d+\/\d+)\s*-\s*(\d+)?/);
    if (match) {
      const [, day, date, att] = match;
      if (att) {
        events.push({ date, day, attendance: parseInt(att, 10) });
      }
    }
  }
  return events;
}

// --- Column completeness check ---

function countFilledMetrics(rows: string[][], sectionStart: number, metricCount: number, colIdx: number): number {
  let filled = 0;
  for (let offset = 0; offset < metricCount; offset++) {
    const row = rows[sectionStart + 2 + offset]; // +2 to skip header + month row
    if (row?.[colIdx]?.trim()) filled++;
  }
  return filled;
}

const MIN_FILLED_METRICS = 3; // need at least 3 filled cells across IG to count as a real month

// --- Main parse function ---

function parseSheetData(rows: string[][]) {
  const igStart = findSection(rows, "INSTAGRAM");
  const ttStart = findSection(rows, "TIKTOK");
  const stravaStart = findSection(rows, "STRAVA");

  if (igStart === -1 || ttStart === -1 || stravaStart === -1) {
    throw new Error("Could not find all sections in sheet");
  }

  // Determine which months have data
  const igMonths = getMonthColumns(rows, igStart);

  // Scan right-to-left for the latest month with enough data to be meaningful
  // A month needs at least MIN_FILLED_METRICS instagram cells filled to qualify
  let currIdx = -1;
  const igFollowersRow = rows[igStart + 2];
  for (let i = (igFollowersRow?.length ?? 1) - 1; i >= 1; i--) {
    if (igFollowersRow?.[i]?.trim()) {
      const filled = countFilledMetrics(rows, igStart, 14, i);
      if (filled >= MIN_FILLED_METRICS) {
        currIdx = i;
        break;
      }
    }
  }
  if (currIdx === -1) {
    throw new Error("No month with enough data found in sheet");
  }
  const prevIdx = currIdx - 1;
  const currMonth = igMonths[currIdx] ?? "Unknown";
  const prevMonth = prevIdx >= 1 ? (igMonths[prevIdx] ?? "") : "";

  // Helper to read a metric row relative to section start
  const igMetric = (offset: number, col: number) => metricVal(rows, igStart, offset, col);
  const ttMetric = (offset: number, col: number) => metricVal(rows, ttStart, offset, col);
  const stravaMetric = (offset: number, col: number) => metricVal(rows, stravaStart, offset, col);

  const data = {
    syncedAt: new Date().toISOString(),
    currentMonth: currMonth,
    previousMonth: prevMonth,
    instagram: {
      prev: {
        followers: igMetric(0, prevIdx),
        posts: igMetric(1, prevIdx),
        reels: igMetric(2, prevIdx),
        totalViews: igMetric(3, prevIdx),
        viewsFromFollowers: igMetric(4, prevIdx),
        viewsFromNonFollowers: igMetric(5, prevIdx),
        accountsReached: igMetric(6, prevIdx),
        profileVisits: igMetric(7, prevIdx),
        externalLinkTaps: igMetric(8, prevIdx),
        likes: igMetric(9, prevIdx),
        comments: igMetric(10, prevIdx),
        saves: igMetric(11, prevIdx),
        shares: igMetric(12, prevIdx),
        reposts: igMetric(13, prevIdx),
      },
      curr: {
        followers: igMetric(0, currIdx),
        posts: igMetric(1, currIdx),
        reels: igMetric(2, currIdx),
        totalViews: igMetric(3, currIdx),
        viewsFromFollowers: igMetric(4, currIdx),
        viewsFromNonFollowers: igMetric(5, currIdx),
        accountsReached: igMetric(6, currIdx),
        profileVisits: igMetric(7, currIdx),
        externalLinkTaps: igMetric(8, currIdx),
        likes: igMetric(9, currIdx),
        comments: igMetric(10, currIdx),
        saves: igMetric(11, currIdx),
        shares: igMetric(12, currIdx),
        reposts: igMetric(13, currIdx),
      },
    },
    tiktok: {
      prev: {
        followers: ttMetric(0, prevIdx),
        tiktoks: ttMetric(1, prevIdx),
        totalViews: ttMetric(2, prevIdx),
        profileViews: ttMetric(3, prevIdx),
        likes: ttMetric(4, prevIdx),
        comments: ttMetric(5, prevIdx),
        shares: ttMetric(6, prevIdx),
      },
      curr: {
        followers: ttMetric(0, currIdx),
        tiktoks: ttMetric(1, currIdx),
        totalViews: ttMetric(2, currIdx),
        profileViews: ttMetric(3, currIdx),
        likes: ttMetric(4, currIdx),
        comments: ttMetric(5, currIdx),
        shares: ttMetric(6, currIdx),
      },
    },
    strava: {
      members: stravaMetric(0, currIdx),
      posts: {
        prev: stravaMetric(1, prevIdx),
        curr: stravaMetric(1, currIdx),
      },
    },
    events: parseAttendance(rows, stravaStart, currIdx),
  };

  return data;
}

// --- Public server action ---

export async function syncFromSheet(): Promise<{ success: boolean; message: string }> {
  // Verify session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, message: "Not authenticated" };

  try {
    const rows = await fetchSheet();
    const data = parseSheetData(rows);

    const db = getDb();
    db.prepare(
      `CREATE TABLE IF NOT EXISTS sheet_cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    ).run();

    db.prepare(
      `INSERT OR REPLACE INTO sheet_cache (key, value, updated_at)
       VALUES ('dashboard', ?, ?)`
    ).run(JSON.stringify(data), data.syncedAt);

    log.info("Sheet sync complete", { action: "syncFromSheet", month: data.currentMonth });
    return { success: true, message: `synced — ${data.currentMonth.toLowerCase()} data` };
  } catch (err) {
    Sentry.captureException(err, { tags: { action: "syncFromSheet" } });
    log.error("Sheet sync failed", err, { action: "syncFromSheet" });
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message };
  }
}
