import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Public access via published report token, or auth-gated session
  const token = req.nextUrl.searchParams.get("token");
  if (token) {
    const rdb = getDb();
    const report = rdb
      .prepare("SELECT id FROM event_reports WHERE token = ? AND published = 1")
      .get(token);
    if (!report) return new NextResponse(null, { status: 401 });
  } else {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new NextResponse(null, { status: 401 });
  }

  const { id } = await params;

  // Look up thumbnail URL from DB — never trust user-supplied URLs
  const db = getDb();
  const row = db
    .prepare("SELECT thumbnail_url FROM social_posts WHERE id = ?")
    .get(id) as { thumbnail_url: string } | undefined;

  if (!row?.thumbnail_url) {
    return new NextResponse(null, { status: 404 });
  }

  // Fetch the image server-side (no Sec-Fetch headers → CDN serves full response)
  let upstream: Response;
  try {
    upstream = await fetch(row.thumbnail_url, {
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }

  if (!upstream.ok) {
    return new NextResponse(null, { status: 502 });
  }

  // Validate content type
  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return new NextResponse(null, { status: 502 });
  }

  // Buffer the response to enforce size limit regardless of Content-Length header
  const buf = await upstream.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  return new NextResponse(buf, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buf.byteLength),
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
