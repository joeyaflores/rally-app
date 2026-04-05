"use server";

import { headers } from "next/headers";
import { getDb } from "./db";
import { validateEmail } from "./format";
import crypto from "crypto";

// ─── In-memory rate limiter ───

const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_MAX = 5; // max attempts per window

const attempts = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (attempts.get(ip) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  if (timestamps.length >= RATE_MAX) {
    attempts.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  attempts.set(ip, timestamps);
  return false;
}

// Public — no auth required
export async function subscribe(
  email: string,
  honeypot?: string
): Promise<{ ok: boolean; error?: string }> {
  // Honeypot — bots fill this, humans never see it
  if (honeypot) return { ok: true };

  const { email: normalized, error } = validateEmail(email);
  if (error) return { ok: false, error };

  // Rate limit by IP
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return { ok: false, error: "Too many requests. Try again later." };
  }

  const db = getDb();

  db.prepare(
    "INSERT OR IGNORE INTO subscribers (id, email) VALUES (?, ?)"
  ).run(crypto.randomUUID(), normalized);

  return { ok: true };
}
