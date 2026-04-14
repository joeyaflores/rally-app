import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Lightweight liveness probe for Fly.io health checks — no DB, no I/O. */
export function GET() {
  return NextResponse.json({ status: "ok" });
}
