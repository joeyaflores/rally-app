import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

export function GET() {
  const start = Date.now();

  try {
    const db = getDb();

    // Single query for all table counts + last sync
    const stats = db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM members) AS members,
          (SELECT COUNT(*) FROM checkins) AS checkins,
          (SELECT COUNT(*) FROM social_posts) AS social_posts,
          (SELECT COUNT(*) FROM metric_snapshots) AS metric_snapshots,
          (SELECT COUNT(*) FROM content_posts) AS content_posts,
          (SELECT COUNT(*) FROM notes) AS notes,
          (SELECT MAX(recorded_at) FROM metric_snapshots) AS last_sync`
      )
      .get() as Record<string, number | string | null>;

    const counts = {
      members: stats.members as number,
      checkins: stats.checkins as number,
      social_posts: stats.social_posts as number,
      metric_snapshots: stats.metric_snapshots as number,
      content_posts: stats.content_posts as number,
      notes: stats.notes as number,
    };
    const lastSync = stats.last_sync as string | null;

    // DB file size
    const pageCount = (db.prepare("PRAGMA page_count").get() as { page_count: number }).page_count;
    const pageSize = (db.prepare("PRAGMA page_size").get() as { page_size: number }).page_size;
    const dbSizeBytes = pageCount * pageSize;

    const ms = Date.now() - start;

    return NextResponse.json({
      status: "ok",
      db_size_mb: +(dbSizeBytes / 1024 / 1024).toFixed(2),
      last_sync: lastSync,
      counts,
      response_ms: ms,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    log.error("Health check failed", err);
    return NextResponse.json(
      {
        status: "error",
        error: err instanceof Error ? err.message : "unknown",
        response_ms: Date.now() - start,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
