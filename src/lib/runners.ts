"use server";

import { getDb } from "./db";
import { requireAuth } from "./require-auth";
import { escapeCSV } from "./format";

export interface Runner {
  id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  first_checkin: string | null;
  last_checkin: string | null;
  total_checkins: number;
  source: "checkin" | "subscribe";
  created_at: string;
}

const RUNNERS_QUERY = `
  SELECT id, name, first_name, last_name, email, phone, first_checkin, last_checkin, total_checkins, created_at, 'checkin' AS source
  FROM members
  UNION ALL
  SELECT s.id, NULL AS name, NULL AS first_name, NULL AS last_name, s.email, NULL AS phone, NULL AS first_checkin, NULL AS last_checkin, 0 AS total_checkins, s.created_at, 'subscribe' AS source
  FROM subscribers s
  WHERE s.email NOT IN (SELECT email FROM members)
  ORDER BY total_checkins DESC, created_at DESC
`;

/**
 * Merged view of members (from check-in) + subscribers (from /join).
 * Subscribers whose email already exists in members are excluded (deduped).
 */
export async function getRunners(): Promise<Runner[]> {
  await requireAuth();
  const db = getDb();
  return db.prepare(RUNNERS_QUERY).all() as Runner[];
}

export async function deleteRunner(id: string, source: "checkin" | "subscribe"): Promise<void> {
  await requireAuth();
  if (source !== "subscribe") return;
  const db = getDb();
  db.prepare("DELETE FROM subscribers WHERE id = ?").run(id);
}

export async function getRunnersCSV(): Promise<string> {
  const runners = await getRunners();
  const lines = ["first_name,last_name,email,phone,total_runs,first_run,last_run,source,joined"];
  for (const r of runners) {
    lines.push(
      [
        escapeCSV(r.first_name ?? r.name ?? ""),
        escapeCSV(r.last_name ?? ""),
        escapeCSV(r.email),
        escapeCSV(r.phone ?? ""),
        r.total_checkins,
        escapeCSV(r.first_checkin ?? ""),
        escapeCSV(r.last_checkin ?? ""),
        r.source,
        escapeCSV(r.created_at),
      ].join(",")
    );
  }
  return lines.join("\n");
}
