/** Format a date string as "Mar 11" or "Mar 11, 2026" when `year` is true. */
export function formatDate(dateStr: string, { year = false }: { year?: boolean } = {}): string {
  // Handle SQLite datetime ("2026-03-12 19:00:00"), ISO ("2026-03-12T19:00:00"), or date-only ("2026-03-12")
  const normalized = dateStr.includes("T") || dateStr.includes(" ")
    ? dateStr.replace(" ", "T")
    : dateStr + "T00:00:00";
  const d = new Date(normalized);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(year && { year: "numeric" }),
  });
}

export function pctChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return n.toLocaleString();
}

/** Total interactions (likes + comments + shares) for a social post. */
export function interactions(post: { likes: number; comments: number; shares: number }): number {
  return post.likes + post.comments + post.shares;
}

/** Validate and normalize an email. Returns { email, error }. */
export function validateEmail(raw: string): { email: string; error?: string } {
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { email, error: "Enter a valid email." };
  }
  return { email };
}

/** Build a display name from first/last, falling back to a legacy name or fallback. */
export function displayName(
  first?: string | null,
  last?: string | null,
  fallback?: string | null,
): string {
  if (first && last) return `${first} ${last}`;
  return first || fallback || "";
}

/** Escape a value for CSV output (handles commas, quotes, formula injection). */
export function escapeCSV(value: string): string {
  // Prefix formula-triggering characters to prevent injection
  const escaped = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  if (/[",\n]/.test(escaped)) {
    return `"${escaped.replace(/"/g, '""')}"`;
  }
  return escaped;
}
