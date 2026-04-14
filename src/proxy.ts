import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept Better Auth's built-in error page → redirect to our custom one
  if (pathname === "/api/auth/error") {
    const error = request.nextUrl.searchParams.get("error") ?? "unknown";
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Allow auth API routes and login page through
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/api/health" ||
    pathname === "/monitoring" ||
    pathname === "/login" ||
    pathname === "/join" ||
    pathname === "/checkin" ||
    pathname.startsWith("/report/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/logo-") ||
    pathname.startsWith("/opengraph-image") ||
    pathname === "/favicon.png" ||
    pathname === "/apple-touch-icon.png" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // Check for session cookie (optimistic — real auth check happens server-side)
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/join", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
