"use server";

import { cache } from "react";
import { getDb } from "./db";
import { requireAuth } from "./require-auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import config from "@rally";
import type {
  EventReport,
  ReportPageData,
  ReportAttendance,
  ReportMetrics,
  ReportHighlight,
  ReportSponsor,
} from "./report-types";
import type { Vendor } from "./checkin";
import type { IGMetrics, TTMetrics, StravaMetrics, SocialPost } from "./analytics-types";

// ─── Helpers ───

function generateToken(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  const rand = crypto.randomBytes(8).toString("hex");
  return slug ? `${slug}-${rand}` : rand;
}

function parseRow(row: Record<string, unknown>): EventReport {
  return {
    ...row,
    highlights: JSON.parse((row.highlights as string) || "[]"),
    sponsors: JSON.parse((row.sponsors as string) || "[]"),
    vendors: JSON.parse((row.vendors as string) || "[]"),
    images: JSON.parse((row.images as string) || "[]"),
    excluded_post_ids: JSON.parse((row.excluded_post_ids as string) || "[]"),
  } as EventReport;
}

// ─── Public queries (no auth) ───

export async function getReportByToken(token: string): Promise<EventReport | null> {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM event_reports WHERE token = ? AND published = 1")
    .get(token) as Record<string, unknown> | undefined;
  return row ? parseRow(row) : null;
}

export const getReportPageData = cache(async function getReportPageData(token: string): Promise<ReportPageData | null> {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM event_reports WHERE token = ? AND published = 1")
    .get(token) as Record<string, unknown> | undefined;

  if (!row) return null;

  const report = parseRow(row);

  // ─── Attendance from check-in session (single query) ───
  let attendance: ReportAttendance | null = null;
  if (report.session_id) {
    const row = db
      .prepare(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN m.first_checkin = s.session_date THEN 1 ELSE 0 END) as new_neighbors
         FROM checkins c
         JOIN checkin_sessions s ON c.session_id = s.id
         LEFT JOIN members m ON c.email = m.email
         WHERE c.session_id = ?`
      )
      .get(report.session_id) as { total: number; new_neighbors: number };

    if (row.total > 0) {
      attendance = {
        total: row.total,
        newNeighbors: row.new_neighbors,
        returning: row.total - row.new_neighbors,
      };
    }
  }

  // ─── Platform metrics (single query) ───
  let metrics: ReportMetrics | null = null;
  if (report.metrics_year && report.metrics_month) {
    const rows = db
      .prepare(
        `SELECT platform, metrics FROM platform_metrics
         WHERE year = ? AND month = ?
         AND platform IN ('instagram', 'tiktok', 'strava')`
      )
      .all(report.metrics_year, report.metrics_month) as { platform: string; metrics: string }[];

    const byPlatform = new Map(rows.map((r) => [r.platform, JSON.parse(r.metrics)]));
    const ig = byPlatform.get("instagram") as IGMetrics | undefined;
    const tt = byPlatform.get("tiktok") as TTMetrics | undefined;
    const sv = byPlatform.get("strava") as StravaMetrics | undefined;

    if (ig || tt || sv) {
      metrics = {
        ig: ig
          ? {
              followers: ig.followers,
              totalViews: ig.totalViews,
              accountsReached: ig.accountsReached,
              engagement: ig.likes + ig.comments + ig.saves + ig.shares,
              posts: ig.posts + ig.reels,
            }
          : null,
        tt: tt
          ? {
              followers: tt.followers,
              totalViews: tt.totalViews,
              likes: tt.likes,
              shares: tt.shares,
              tiktoks: tt.tiktoks,
            }
          : null,
        strava: sv ? { members: sv.members } : null,
      };
    }
  }

  // ─── Board images ───
  const boardImages: string[] = [];
  if (report.board_id) {
    const images = db
      .prepare(
        "SELECT content FROM board_items WHERE board_id = ? AND item_type = 'image' ORDER BY position ASC LIMIT 12"
      )
      .all(report.board_id) as { content: string }[];
    boardImages.push(...images.map((i) => i.content));
  }

  // ─── Event content (posts from date window) ───
  let posts: SocialPost[] = [];
  {
    const startFallback = new Date(report.event_date + "T00:00:00");
    startFallback.setDate(startFallback.getDate() - 5);
    const start = report.content_start ?? startFallback.toISOString().slice(0, 10);
    const endFallback = new Date(report.event_date + "T00:00:00");
    endFallback.setDate(endFallback.getDate() + 4);
    const end = report.content_end ?? endFallback.toISOString().slice(0, 10);

    const excluded: string[] = report.excluded_post_ids;
    const excludeClause =
      excluded.length > 0
        ? `AND id NOT IN (${excluded.map(() => "?").join(",")})`
        : "";

    const postRows = db
      .prepare(
        `SELECT * FROM social_posts
         WHERE posted_at >= ? AND posted_at < ? ${excludeClause}
         ORDER BY (likes + comments + shares) DESC
         LIMIT 7`
      )
      .all(start, end + "T23:59:59", ...excluded) as Record<string, unknown>[];

    posts = postRows.map((r) => ({
      ...(r as unknown as SocialPost),
      hashtags: [] as string[],
      mentions: [] as string[],
      latest_comments: JSON.parse((r.latest_comments as string) || "[]"),
    }));
  }

  return { report, attendance, metrics, boardImages, posts };
});

// ─── Admin queries (auth-gated) ───

export async function getReports(): Promise<EventReport[]> {
  await requireAuth();
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM event_reports ORDER BY event_date DESC")
    .all() as Record<string, unknown>[];
  return rows.map(parseRow);
}

export async function getReportById(id: string): Promise<EventReport | null> {
  await requireAuth();
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM event_reports WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? parseRow(row) : null;
}

// ─── Admin mutations ───

export async function createReport(opts: {
  title: string;
  event_date: string;
  location?: string;
  description?: string;
  session_id?: string;
  board_id?: string;
  hero_image_url?: string;
  highlights?: ReportHighlight[];
  sponsors?: ReportSponsor[];
  images?: string[];
  content_start?: string;
  content_end?: string;
  metrics_year?: number;
  metrics_month?: number;
  published?: boolean;
}): Promise<{ ok: boolean; report?: EventReport; error?: string }> {
  await requireAuth();
  const db = getDb();

  const id = crypto.randomUUID();
  const token = generateToken(opts.title);

  try {
    db.prepare(
      `INSERT INTO event_reports (
        id, token, title, event_date, location, description,
        session_id, board_id, hero_image_url, highlights, sponsors, images,
        content_start, content_end, metrics_year, metrics_month, published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      token,
      opts.title.trim(),
      opts.event_date,
      opts.location?.trim() ?? "",
      opts.description?.trim() ?? "",
      opts.session_id ?? null,
      opts.board_id ?? null,
      opts.hero_image_url?.trim() ?? "",
      JSON.stringify(opts.highlights ?? []),
      JSON.stringify(opts.sponsors ?? []),
      JSON.stringify(opts.images ?? []),
      opts.content_start ?? null,
      opts.content_end ?? null,
      opts.metrics_year ?? null,
      opts.metrics_month ?? null,
      opts.published ? 1 : 0
    );

    const report = parseRow(
      db.prepare("SELECT * FROM event_reports WHERE id = ?").get(id) as Record<string, unknown>
    );

    revalidatePath("/admin/reports");
    return { ok: true, report };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create report" };
  }
}

export async function updateReport(
  id: string,
  data: Partial<{
    title: string;
    event_date: string;
    location: string;
    description: string;
    session_id: string | null;
    board_id: string | null;
    hero_image_url: string;
    highlights: ReportHighlight[];
    sponsors: ReportSponsor[];
    vendors: Vendor[];
    images: string[];
    content_start: string | null;
    content_end: string | null;
    metrics_year: number | null;
    metrics_month: number | null;
    published: boolean;
  }>
): Promise<{ ok: boolean; error?: string }> {
  await requireAuth();
  const db = getDb();

  const sets: string[] = [];
  const values: unknown[] = [];

  for (const [key, val] of Object.entries(data)) {
    if (val === undefined) continue;
    if (key === "highlights" || key === "sponsors" || key === "vendors" || key === "images") {
      sets.push(`${key} = ?`);
      values.push(JSON.stringify(val));
    } else if (key === "published") {
      sets.push(`${key} = ?`);
      values.push(val ? 1 : 0);
    } else {
      sets.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (sets.length === 0) return { ok: true };

  sets.push("updated_at = datetime('now')");
  values.push(id);

  try {
    db.prepare(`UPDATE event_reports SET ${sets.join(", ")} WHERE id = ?`).run(...values);

    // Revalidate admin + public report page
    const row = db.prepare("SELECT token FROM event_reports WHERE id = ?").get(id) as { token: string } | undefined;
    revalidatePath("/admin/reports");
    if (row) revalidatePath(`/report/${row.token}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function deleteReport(id: string): Promise<void> {
  await requireAuth();
  const db = getDb();
  db.prepare("DELETE FROM event_reports WHERE id = ?").run(id);
  revalidatePath("/admin/reports");
}

// ─── Session-based report helpers ───

/** Create a draft report pre-filled from a closed check-in session. */
export async function createReportFromSession(
  sessionId: string
): Promise<{ ok: boolean; report?: EventReport; error?: string }> {
  await requireAuth();
  const db = getDb();

  // Check if report already exists for this session
  const existingRow = db
    .prepare("SELECT * FROM event_reports WHERE session_id = ?")
    .get(sessionId) as Record<string, unknown> | undefined;
  if (existingRow) {
    return { ok: true, report: parseRow(existingRow) };
  }

  // Look up session
  const session = db
    .prepare("SELECT title, session_date, day, vendors FROM checkin_sessions WHERE id = ?")
    .get(sessionId) as { title: string; session_date: string; day: string; vendors: string } | undefined;
  if (!session) return { ok: false, error: "Session not found" };

  const [yearStr, monthStr] = session.session_date.split("-");
  const id = crypto.randomUUID();
  const token = generateToken(session.title);

  db.prepare(
    `INSERT INTO event_reports (
      id, token, title, event_date, location, description,
      session_id, highlights, sponsors, vendors, images,
      metrics_year, metrics_month, published
    ) VALUES (?, ?, ?, ?, ?, ?, ?, '[]', '[]', ?, '[]', ?, ?, 0)`
  ).run(
    id,
    token,
    session.title.toLowerCase(),
    session.session_date,
    config.report.defaultLocation,
    "",
    sessionId,
    session.vendors || "[]",
    parseInt(yearStr),
    parseInt(monthStr),
  );

  const report = parseRow(
    db.prepare("SELECT * FROM event_reports WHERE id = ?").get(id) as Record<string, unknown>
  );

  revalidatePath("/admin/reports");
  return { ok: true, report };
}

/** Publish a draft report. */
export async function publishReport(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAuth();
  const db = getDb();
  db.prepare("UPDATE event_reports SET published = 1, updated_at = datetime('now') WHERE id = ?").run(id);
  revalidatePath("/admin/reports");
  return { ok: true };
}

/** Get report tokens for a list of session IDs (batch lookup). */
export async function getReportsBySessionIds(
  sessionIds: string[]
): Promise<Record<string, { token: string; published: number }>> {
  await requireAuth();
  if (sessionIds.length === 0) return {};
  const db = getDb();
  const placeholders = sessionIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT session_id, token, published FROM event_reports WHERE session_id IN (${placeholders})`
    )
    .all(...sessionIds) as { session_id: string; token: string; published: number }[];
  const map: Record<string, { token: string; published: number }> = {};
  for (const r of rows) map[r.session_id] = { token: r.token, published: r.published };
  return map;
}

// ─── Post exclusion (auth-gated) ───

/** Atomic read-modify-write on excluded_post_ids. */
async function modifyExcludedPosts(
  reportId: string,
  mutate: (ids: string[]) => string[]
): Promise<{ ok: boolean }> {
  await requireAuth();
  const db = getDb();
  const ok = db.transaction(() => {
    const row = db
      .prepare("SELECT excluded_post_ids FROM event_reports WHERE id = ?")
      .get(reportId) as { excluded_post_ids: string } | undefined;
    if (!row) return false;

    const updated = mutate(JSON.parse(row.excluded_post_ids || "[]"));
    db.prepare(
      "UPDATE event_reports SET excluded_post_ids = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(JSON.stringify(updated), reportId);
    return true;
  })();
  return { ok };
}

/** Hide a post from a published report. */
export async function excludePostFromReport(
  reportId: string,
  postId: string
): Promise<{ ok: boolean }> {
  return modifyExcludedPosts(reportId, (ids) =>
    ids.includes(postId) ? ids : [...ids, postId]
  );
}

/** Restore a hidden post to a report. */
export async function restorePostToReport(
  reportId: string,
  postId: string
): Promise<{ ok: boolean }> {
  return modifyExcludedPosts(reportId, (ids) =>
    ids.filter((id) => id !== postId)
  );
}

/** Set or clear the Google Drive photo album URL on a report. */
export async function updateReportDriveUrl(
  reportId: string,
  driveUrl: string
): Promise<{ ok: boolean }> {
  await requireAuth();
  const db = getDb();
  db.prepare(
    "UPDATE event_reports SET drive_url = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(driveUrl.trim(), reportId);
  return { ok: true };
}
