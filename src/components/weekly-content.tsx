import Link from "next/link";
import { ArrowRight, Check, Instagram } from "lucide-react";
import { TikTokIcon, StravaIcon } from "@/components/icons";
import type { ContentPost, Platform } from "@/lib/calendar-types";

/* ─── Platform config ─── */

const PF: Record<Platform, { color: string; icon: React.ReactNode }> = {
  instagram: { color: "#E1306C", icon: <Instagram className="h-3 w-3" /> },
  tiktok: { color: "#000000", icon: <TikTokIcon className="h-3 w-3" /> },
  strava: { color: "#FC4C02", icon: <StravaIcon className="h-3 w-3" /> },
};

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/* ─── Week helpers ─── */

interface WeekDay {
  date: string;
  label: string;
  dayNum: number;
  isToday: boolean;
}

function getWeekDays(): WeekDay[] {
  const now = new Date();
  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({
      date: iso,
      label: i === 0 ? "today" : DAY_NAMES[d.getDay()],
      dayNum: d.getDate(),
      isToday: i === 0,
    });
  }
  return days;
}

/* ─── Component ─── */

export function WeeklyContent({ posts }: { posts: ContentPost[] }) {
  const weekDays = getWeekDays();
  const postsByDate = new Map<string, ContentPost[]>();
  let postedCount = 0;
  for (const post of posts) {
    const arr = postsByDate.get(post.post_date) || [];
    arr.push(post);
    postsByDate.set(post.post_date, arr);
    if (post.status === "posted") postedCount++;
  }

  /* Empty state */
  if (posts.length === 0) {
    return (
      <section className="animate-fade-up" style={{ animationDelay: "200ms" }}>
        <div className="mb-3 px-1">
          <h2 className="font-display text-sm font-medium uppercase tracking-widest text-muted-foreground">
            content week
          </h2>
        </div>
        <Link
          href="/calendar"
          className="group block rounded-2xl border border-dashed border-border/40 bg-white/50 px-5 py-5 text-center transition-all hover:border-navy/20 hover:bg-white"
        >
          <p className="text-sm text-muted-foreground/40">
            no content planned this week
          </p>
          <p className="mt-1 text-xs text-muted-foreground/30 transition-colors group-hover:text-navy/50">
            open calendar &rarr;
          </p>
        </Link>
      </section>
    );
  }

  return (
    <section className="animate-fade-up" style={{ animationDelay: "200ms" }}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-sm font-medium uppercase tracking-widest text-muted-foreground">
          content week
          <span className="ml-2 normal-case tracking-normal text-muted-foreground/40">
            {postedCount}/{posts.length} posted
          </span>
        </h2>
        <Link
          href="/calendar"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-navy"
        >
          calendar
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Week grid */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="grid grid-cols-7 divide-x divide-border/10">
          {weekDays.map((day) => {
            const dayPosts = postsByDate.get(day.date) || [];
            const isRunDay = day.label === "mon" || day.label === "sat";

            return (
              <div
                key={day.date}
                className={`
                  min-h-[84px] p-1.5 sm:p-2
                  ${day.isToday ? "bg-navy/[0.03]" : ""}
                `}
              >
                {/* Day header */}
                <div className="mb-1.5 text-center">
                  <span className="block text-[9px] font-medium uppercase tracking-wide text-muted-foreground/40 sm:text-[10px]">
                    {day.label}
                  </span>
                  <span
                    className={`
                      mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium sm:h-6 sm:w-6 sm:text-xs
                      ${day.isToday ? "bg-navy text-white" : "text-muted-foreground/60"}
                    `}
                  >
                    {day.dayNum}
                  </span>
                  {isRunDay && (
                    <span
                      className={`
                        mx-auto mt-0.5 block h-0.5 w-3 rounded-full
                        ${day.label === "mon" ? "bg-navy/15" : "bg-warm/25"}
                      `}
                    />
                  )}
                </div>

                {/* Post pills */}
                <div className="space-y-0.5">
                  {dayPosts.map((post) => {
                    const pf = PF[post.platform];
                    const isPosted = post.status === "posted";
                    return (
                      <div
                        key={post.id}
                        className="flex items-center gap-0.5 rounded px-1 py-0.5 sm:gap-1 sm:px-1.5"
                        style={{ backgroundColor: `${pf.color}10` }}
                        title={post.title || "untitled"}
                      >
                        <span className="shrink-0" style={{ color: pf.color }}>
                          {isPosted ? (
                            <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          ) : (
                            pf.icon
                          )}
                        </span>
                        <span
                          className="hidden truncate text-[10px] sm:inline"
                          style={{ color: pf.color }}
                        >
                          {post.title || "untitled"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
