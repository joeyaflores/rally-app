"use server";

import { getDb } from "./db";
import { requireAuth } from "./require-auth";
import { validateEmail, displayName } from "./format";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// ─── Types ───

export type SessionTheme = "navy" | "green" | "orange" | "black" | "pink";

export interface Vendor {
  name: string;
  instagram: string;
}

export interface CheckinSession {
  id: string;
  title: string;
  subtitle: string;
  theme: SessionTheme;
  image_url: string;
  event_details: string;
  vendors: Vendor[];
  session_date: string;
  day: string;
  status: "open" | "closed";
  opened_at: string;
  closed_at: string | null;
  created_at: string;
}

const IG_HANDLE_PREFIX = /^https?:\/\/(www\.)?instagram\.com\//i;

function normalizeIgHandle(input: string): string {
  return input
    .trim()
    .replace(IG_HANDLE_PREFIX, "")
    .replace(/^@+/, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function parseVendors(raw: string | null | undefined): Vendor[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: Vendor[] = [];
    for (const v of parsed) {
      if (!v || typeof v !== "object") continue;
      const name = typeof (v as Vendor).name === "string" ? (v as Vendor).name : "";
      const instagram = typeof (v as Vendor).instagram === "string" ? (v as Vendor).instagram : "";
      if (!instagram) continue;
      out.push({ name, instagram });
    }
    return out;
  } catch {
    return [];
  }
}

function sanitizeVendors(input: Vendor[] | undefined): Vendor[] {
  if (!input) return [];
  const out: Vendor[] = [];
  for (const v of input) {
    const handle = normalizeIgHandle(v.instagram ?? "");
    if (!handle) continue;
    out.push({
      name: (v.name ?? "").trim().slice(0, 100),
      instagram: handle.slice(0, 100),
    });
  }
  return out.slice(0, 20);
}

export interface CheckinSessionWithCount extends CheckinSession {
  checkin_count: number;
}

export interface Checkin {
  id: string;
  session_id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  checked_in_at: string;
}

export interface Member {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_month: number;
  birth_day: number;
  first_checkin: string;
  last_checkin: string;
  total_checkins: number;
  created_at: string;
}

// ─── Public actions (no auth) ───

export type OpenSession = Pick<
  CheckinSession,
  "id" | "title" | "subtitle" | "theme" | "image_url" | "event_details" | "vendors" | "session_date" | "day"
>;

export async function getOpenSession(): Promise<OpenSession | null> {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT id, title, subtitle, theme, image_url, event_details, vendors, session_date, day FROM checkin_sessions WHERE status = 'open' LIMIT 1"
    )
    .get() as (Omit<OpenSession, "vendors"> & { vendors: string }) | undefined;
  if (!row) return null;
  return { ...row, vendors: parseVendors(row.vendors) };
}

export async function submitCheckin(opts: {
  sessionId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthMonth: number;
  birthDay: number;
}): Promise<{ ok: boolean; alreadyCheckedIn?: boolean; totalCheckins?: number; error?: string }> {
  const trimmedFirst = opts.firstName.trim();
  const trimmedLast = opts.lastName.trim();
  const trimmedPhone = opts.phone.trim();
  const birthMonth = opts.birthMonth;
  const birthDay = opts.birthDay;

  if (!trimmedFirst || trimmedFirst.length > 100) {
    return { ok: false, error: "Enter your first name." };
  }
  if (!trimmedLast || trimmedLast.length > 100) {
    return { ok: false, error: "Enter your last name." };
  }
  if (trimmedPhone.length > 30) {
    return { ok: false, error: "Phone number is too long." };
  }
  // Validate birthday — both must be set or both zero (unset)
  if ((birthMonth > 0) !== (birthDay > 0)) {
    return { ok: false, error: "Select both birth month and day." };
  }
  if (birthMonth < 0 || birthMonth > 12 || birthDay < 0 || birthDay > 31) {
    return { ok: false, error: "Invalid birthday." };
  }

  const { email: normalized, error } = validateEmail(opts.email);
  if (error) return { ok: false, error };

  const fullName = displayName(trimmedFirst, trimmedLast);

  const db = getDb();

  // Verify session is open and get date for member tracking
  const session = db
    .prepare("SELECT id, session_date FROM checkin_sessions WHERE id = ? AND status = 'open'")
    .get(opts.sessionId) as { id: string; session_date: string } | undefined;
  if (!session) {
    return { ok: false, error: "Check-in is closed." };
  }

  // Insert check-in + upsert subscriber + upsert member (atomic)
  const tx = db.transaction(() => {
    const result = db.prepare(
      "INSERT OR IGNORE INTO checkins (id, session_id, name, first_name, last_name, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(crypto.randomUUID(), opts.sessionId, fullName, trimmedFirst, trimmedLast, normalized, trimmedPhone);

    // Also add to subscriber list
    db.prepare(
      "INSERT OR IGNORE INTO subscribers (id, email) VALUES (?, ?)"
    ).run(crypto.randomUUID(), normalized);

    // Upsert member — only increment if this is a new check-in (not duplicate)
    if (result.changes > 0) {
      db.prepare(
        `INSERT INTO members (id, name, first_name, last_name, email, phone, birth_month, birth_day, first_checkin, last_checkin, total_checkins)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON CONFLICT(email) DO UPDATE SET
           name = CASE WHEN members.first_name = '' THEN excluded.name ELSE members.name END,
           first_name = CASE WHEN members.first_name = '' THEN excluded.first_name ELSE members.first_name END,
           last_name = CASE WHEN members.last_name = '' THEN excluded.last_name ELSE members.last_name END,
           phone = CASE WHEN excluded.phone != '' THEN excluded.phone ELSE members.phone END,
           birth_month = CASE WHEN excluded.birth_month > 0 THEN excluded.birth_month ELSE members.birth_month END,
           birth_day = CASE WHEN excluded.birth_day > 0 THEN excluded.birth_day ELSE members.birth_day END,
           last_checkin = excluded.last_checkin,
           total_checkins = total_checkins + 1`
      ).run(crypto.randomUUID(), fullName, trimmedFirst, trimmedLast, normalized, trimmedPhone, birthMonth, birthDay, session.session_date, session.session_date);
    }

    // Get updated total for this member
    const member = db.prepare(
      "SELECT total_checkins FROM members WHERE email = ?"
    ).get(normalized) as { total_checkins: number } | undefined;

    return { changes: result.changes, totalCheckins: member?.total_checkins ?? 1 };
  });
  const { changes, totalCheckins } = tx();

  if (changes === 0) {
    return { ok: true, alreadyCheckedIn: true, totalCheckins };
  }
  return { ok: true, totalCheckins };
}

// ─── Admin actions (auth-gated) ───

export async function openCheckinSession(opts: {
  title: string;
  sessionDate: string;
  day: string;
  subtitle?: string;
  theme?: SessionTheme;
  imageUrl?: string;
  eventDetails?: string;
  vendors?: Vendor[];
}): Promise<{ ok: boolean; session?: CheckinSession; error?: string }> {
  await requireAuth();
  const db = getDb();

  const existing = db
    .prepare("SELECT id FROM checkin_sessions WHERE status = 'open'")
    .get();
  if (existing) {
    return { ok: false, error: "A session is already open. Close it first." };
  }

  const { title, sessionDate, day, subtitle = "", theme = "navy", imageUrl = "", eventDetails = "" } = opts;
  const vendors = sanitizeVendors(opts.vendors);

  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO checkin_sessions (id, title, subtitle, theme, image_url, event_details, vendors, session_date, day) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, title.trim(), subtitle.trim(), theme, imageUrl.trim(), eventDetails.trim(), JSON.stringify(vendors), sessionDate, day);

  const row = db
    .prepare("SELECT * FROM checkin_sessions WHERE id = ?")
    .get(id) as Omit<CheckinSession, "vendors"> & { vendors: string };
  const session: CheckinSession = { ...row, vendors: parseVendors(row.vendors) };

  revalidatePath("/checkin");
  return { ok: true, session };
}

export async function closeCheckinSession(
  sessionId: string
): Promise<{ ok: boolean; count?: number; error?: string }> {
  await requireAuth();
  const db = getDb();

  const tx = db.transaction(() => {
    const updated = db
      .prepare(
        "UPDATE checkin_sessions SET status = 'closed', closed_at = datetime('now') WHERE id = ? AND status = 'open'"
      )
      .run(sessionId);

    if (updated.changes === 0) {
      return { ok: false, error: "Session not found or already closed." } as const;
    }

    const session = db
      .prepare("SELECT session_date, day FROM checkin_sessions WHERE id = ?")
      .get(sessionId) as { session_date: string; day: string };

    const { count } = db
      .prepare("SELECT COUNT(*) as count FROM checkins WHERE session_id = ?")
      .get(sessionId) as { count: number };

    // Auto-create attendance event
    db.prepare(
      "INSERT OR REPLACE INTO attendance_events (id, event_date, day, attendance, note) VALUES (?, ?, ?, ?, ?)"
    ).run(crypto.randomUUID(), session.session_date, session.day, count, "via check-in");

    return { ok: true, count } as const;
  });

  const result = tx();

  revalidatePath("/");
  revalidatePath("/checkin");
  revalidatePath("/admin");
  return result;
}

type CheckinSessionRow = Omit<CheckinSession, "vendors"> & { vendors: string };

export async function getActiveSession(): Promise<CheckinSessionWithCount | null> {
  await requireAuth();
  const db = getDb();
  const row = db
    .prepare(
      `SELECT s.*, COUNT(c.id) as checkin_count
       FROM checkin_sessions s
       LEFT JOIN checkins c ON c.session_id = s.id
       WHERE s.status = 'open'
       GROUP BY s.id
       LIMIT 1`
    )
    .get() as (CheckinSessionRow & { checkin_count: number }) | undefined;
  if (!row) return null;
  return { ...row, vendors: parseVendors(row.vendors) };
}

export async function getCheckinSessions(
  limit = 50
): Promise<CheckinSessionWithCount[]> {
  await requireAuth();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT s.*, COUNT(c.id) as checkin_count
       FROM checkin_sessions s
       LEFT JOIN checkins c ON c.session_id = s.id
       GROUP BY s.id
       ORDER BY s.created_at DESC
       LIMIT ?`
    )
    .all(limit) as (CheckinSessionRow & { checkin_count: number })[];
  return rows.map((r) => ({ ...r, vendors: parseVendors(r.vendors) }));
}

export async function getSessionCheckins(sessionId: string): Promise<Checkin[]> {
  await requireAuth();
  const db = getDb();
  return db
    .prepare("SELECT * FROM checkins WHERE session_id = ? ORDER BY checked_in_at DESC")
    .all(sessionId) as Checkin[];
}

export async function deleteCheckinSession(sessionId: string): Promise<void> {
  await requireAuth();
  const db = getDb();
  db.prepare("DELETE FROM checkin_sessions WHERE id = ?").run(sessionId);
  revalidatePath("/checkin");
  revalidatePath("/admin");
}

export async function drawRaffleWinner(
  sessionId: string,
  excludeEmails: string[] = []
): Promise<{ ok: boolean; winner?: Checkin; totalEligible?: number; error?: string }> {
  await requireAuth();
  const db = getDb();

  let winner: Checkin | undefined;
  let totalEligible: number;

  if (excludeEmails.length > 0) {
    const placeholders = excludeEmails.map(() => "?").join(",");
    const eligible = db
      .prepare(
        `SELECT COUNT(*) as count FROM checkins WHERE session_id = ? AND email NOT IN (${placeholders})`
      )
      .get(sessionId, ...excludeEmails) as { count: number };
    totalEligible = eligible.count;

    if (totalEligible === 0) {
      return { ok: false, error: "No eligible check-ins remaining." };
    }

    winner = db
      .prepare(
        `SELECT * FROM checkins WHERE session_id = ? AND email NOT IN (${placeholders}) ORDER BY RANDOM() LIMIT 1`
      )
      .get(sessionId, ...excludeEmails) as Checkin;
  } else {
    const eligible = db
      .prepare("SELECT COUNT(*) as count FROM checkins WHERE session_id = ?")
      .get(sessionId) as { count: number };
    totalEligible = eligible.count;

    if (totalEligible === 0) {
      return { ok: false, error: "No eligible check-ins remaining." };
    }

    winner = db
      .prepare("SELECT * FROM checkins WHERE session_id = ? ORDER BY RANDOM() LIMIT 1")
      .get(sessionId) as Checkin;
  }

  return { ok: true, winner, totalEligible };
}

