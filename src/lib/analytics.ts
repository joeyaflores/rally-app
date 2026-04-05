"use server";

import { getDb } from "./db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { requireAuth } from "./require-auth";
import * as Sentry from "@sentry/nextjs";
import { instagram, tiktok, strava, events as hardcodedEvents } from "./data";
import type { IGMetrics, TTMetrics, StravaMetrics, AttendanceEvent, MonthData, MetricSnapshot } from "./analytics-types";

// --- Queries ---

export async function getMonthData(year: number, month: number): Promise<MonthData> {
  await requireAuth();
  const db = getDb();

  // Single query for all platforms (was 3 separate queries)
  const metricRows = db.prepare(
    `SELECT platform, metrics FROM platform_metrics
     WHERE year = ? AND month = ? AND platform IN ('instagram', 'tiktok', 'strava')`
  ).all(year, month) as { platform: string; metrics: string }[];

  const byPlatform = new Map(metricRows.map((r) => [r.platform, JSON.parse(r.metrics)]));

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  const events = db.prepare(
    `SELECT id, event_date, day, attendance, note FROM attendance_events
     WHERE event_date >= ? AND event_date < ?
     ORDER BY event_date`
  ).all(startDate, endDate) as AttendanceEvent[];

  return {
    ig: byPlatform.get("instagram") ?? null,
    tt: byPlatform.get("tiktok") ?? null,
    strava: byPlatform.get("strava") ?? null,
    events,
  };
}

export async function getLatestMonth(): Promise<{ year: number; month: number } | null> {
  await requireAuth();
  const db = getDb();
  const row = db.prepare(
    "SELECT year, month FROM platform_metrics ORDER BY year DESC, month DESC LIMIT 1"
  ).get() as { year: number; month: number } | undefined;
  return row ?? null;
}

export async function hasAnyData(): Promise<boolean> {
  await requireAuth();
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as c FROM platform_metrics").get() as { c: number };
  return row.c > 0;
}

// --- Mutations ---

export async function saveMonthMetrics(
  year: number,
  month: number,
  ig: IGMetrics,
  tt: TTMetrics,
  sv: StravaMetrics
): Promise<{ success: boolean; message: string }> {
  await requireAuth();
  const db = getDb();

  const upsert = db.prepare(
    `INSERT INTO platform_metrics (id, platform, year, month, metrics, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(platform, year, month)
     DO UPDATE SET metrics = excluded.metrics, updated_at = datetime('now')`
  );

  const snapshot = db.prepare(
    `INSERT INTO metric_snapshots (id, platform, year, month, metrics, recorded_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`
  );

  const tx = db.transaction(() => {
    const igJson = JSON.stringify(ig);
    const ttJson = JSON.stringify(tt);
    const svJson = JSON.stringify(sv);

    // Upsert current state
    upsert.run(crypto.randomUUID(), "instagram", year, month, igJson);
    upsert.run(crypto.randomUUID(), "tiktok", year, month, ttJson);
    upsert.run(crypto.randomUUID(), "strava", year, month, svJson);

    // Append snapshots
    snapshot.run(crypto.randomUUID(), "instagram", year, month, igJson);
    snapshot.run(crypto.randomUUID(), "tiktok", year, month, ttJson);
    snapshot.run(crypto.randomUUID(), "strava", year, month, svJson);
  });

  try {
    tx();
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, message: "saved" };
  } catch (err) {
    Sentry.captureException(err, { tags: { action: "saveMonthMetrics" } });
    return { success: false, message: err instanceof Error ? err.message : "save failed" };
  }
}

export async function addAttendanceEvent(
  eventDate: string,
  day: string,
  attendance: number,
  note = ""
): Promise<{ success: boolean; event?: AttendanceEvent; message?: string }> {
  await requireAuth();
  const db = getDb();
  const id = crypto.randomUUID();

  try {
    db.prepare(
      "INSERT OR REPLACE INTO attendance_events (id, event_date, day, attendance, note) VALUES (?, ?, ?, ?, ?)"
    ).run(id, eventDate, day, attendance, note);
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, event: { id, event_date: eventDate, day, attendance, note } };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "failed" };
  }
}

export async function updateAttendanceNote(id: string, note: string): Promise<void> {
  await requireAuth();
  const db = getDb();
  db.prepare("UPDATE attendance_events SET note = ? WHERE id = ?").run(note, id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteAttendanceEvent(id: string): Promise<void> {
  await requireAuth();
  const db = getDb();
  db.prepare("DELETE FROM attendance_events WHERE id = ?").run(id);
  revalidatePath("/");
  revalidatePath("/admin");
}

// --- Snapshots ---

export async function getMonthSnapshots(
  year: number,
  month: number
): Promise<MetricSnapshot[]> {
  await requireAuth();
  const db = getDb();
  const rows = db.prepare(
    `SELECT id, platform, year, month, metrics, recorded_at
     FROM metric_snapshots
     WHERE year = ? AND month = ?
     ORDER BY recorded_at ASC`
  ).all(year, month) as { id: string; platform: string; year: number; month: number; metrics: string; recorded_at: string }[];

  return rows.map((r) => ({
    ...r,
    metrics: JSON.parse(r.metrics),
  }));
}

// --- Seed ---

export async function seedInitialData(): Promise<{ success: boolean; message: string }> {
  await requireAuth();
  const db = getDb();

  const count = db.prepare("SELECT COUNT(*) as c FROM platform_metrics").get() as { c: number };
  if (count.c > 0) return { success: false, message: "data already seeded" };

  const upsert = db.prepare(
    `INSERT INTO platform_metrics (id, platform, year, month, metrics, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(platform, year, month)
     DO UPDATE SET metrics = excluded.metrics, updated_at = datetime('now')`
  );

  const insertEvent = db.prepare(
    "INSERT OR REPLACE INTO attendance_events (id, event_date, day, attendance) VALUES (?, ?, ?, ?)"
  );

  const snapshot = db.prepare(
    `INSERT INTO metric_snapshots (id, platform, year, month, metrics, recorded_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`
  );

  const tx = db.transaction(() => {
    // January
    const janIg = JSON.stringify(instagram.jan);
    const janTt = JSON.stringify(tiktok.jan);
    const janSv = JSON.stringify({ members: strava.members, posts: strava.posts.jan });
    upsert.run(crypto.randomUUID(), "instagram", 2026, 1, janIg);
    upsert.run(crypto.randomUUID(), "tiktok", 2026, 1, janTt);
    upsert.run(crypto.randomUUID(), "strava", 2026, 1, janSv);
    snapshot.run(crypto.randomUUID(), "instagram", 2026, 1, janIg);
    snapshot.run(crypto.randomUUID(), "tiktok", 2026, 1, janTt);
    snapshot.run(crypto.randomUUID(), "strava", 2026, 1, janSv);

    // February
    const febIg = JSON.stringify(instagram.feb);
    const febTt = JSON.stringify(tiktok.feb);
    const febSv = JSON.stringify({ members: strava.members, posts: strava.posts.feb });
    upsert.run(crypto.randomUUID(), "instagram", 2026, 2, febIg);
    upsert.run(crypto.randomUUID(), "tiktok", 2026, 2, febTt);
    upsert.run(crypto.randomUUID(), "strava", 2026, 2, febSv);
    snapshot.run(crypto.randomUUID(), "instagram", 2026, 2, febIg);
    snapshot.run(crypto.randomUUID(), "tiktok", 2026, 2, febTt);
    snapshot.run(crypto.randomUUID(), "strava", 2026, 2, febSv);

    // February attendance events
    for (const evt of hardcodedEvents) {
      const [monthStr, dayNum] = evt.date.split(" ");
      const monthIdx = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(monthStr) + 1;
      const isoDate = `2026-${String(monthIdx).padStart(2, "0")}-${String(parseInt(dayNum)).padStart(2, "0")}`;
      insertEvent.run(crypto.randomUUID(), isoDate, evt.day, evt.attendance);
    }
  });

  try {
    tx();
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, message: "seeded january & february data" };
  } catch (err) {
    Sentry.captureException(err, { tags: { action: "seedInitialData" } });
    return { success: false, message: err instanceof Error ? err.message : "seed failed" };
  }
}
