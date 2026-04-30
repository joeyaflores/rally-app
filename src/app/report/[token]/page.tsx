import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Instagram, Eye, Heart, MessageCircle, Share2, ExternalLink, ImageIcon } from "lucide-react";
import { headers } from "next/headers";
import { TikTokIcon, StravaIcon } from "@/components/icons";
import { AnimatedNumber } from "@/components/animated-number";
import { PostDismiss, DriveUrlEditor } from "@/components/report-post-actions";
import { ShareLink } from "@/components/share-link";
import { auth } from "@/lib/auth";
import { getReportPageData } from "@/lib/reports";
import { formatNumber, formatDate, interactions } from "@/lib/format";
import { BASE_URL, socials } from "@/lib/socials";
import type { ReportMetrics } from "@/lib/report-types";
import type { SocialPost } from "@/lib/analytics-types";
import type { Platform } from "@/lib/calendar-types";
import config from "@rally";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const data = await getReportPageData(token);
  if (!data) return { title: "Report Not Found" };

  const { report, attendance } = data;
  const date = new Date(report.event_date + "T00:00:00");
  const dateStr = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const desc = attendance
    ? `${attendance.total} ${config.terms.member} showed up on ${dateStr}${report.location ? ` in ${report.location}` : ""}`
    : `${report.title} — ${dateStr}`;

  return {
    title: `${report.title} | ${config.fullName}`,
    description: desc,
    openGraph: {
      title: `${report.title} — Event Report`,
      description: desc,
      siteName: config.fullName,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${report.title} — Event Report`,
      description: desc,
    },
  };
}

export default async function ReportPage({ params }: Props) {
  const { token } = await params;

  // Parallel fetch: report data + optional auth check (no waterfall)
  const h = await headers();
  const [data, session] = await Promise.all([
    getReportPageData(token),
    auth.api.getSession({ headers: h }).catch(() => null),
  ]);
  if (!data) notFound();

  const { report, attendance, metrics, posts } = data;
  const isEditor = !!session;

  // Prefer direct uploads; fall back to board images
  const images = report.images.length > 0 ? report.images : data.boardImages;

  // Aggregate content stats
  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
  const totalInteractions = posts.reduce(
    (sum, p) => sum + interactions(p),
    0
  );

  // Best comment for editorial pull quote — most-liked, minimum length
  const pullQuote = posts
    .flatMap((p) => p.latest_comments.map((c) => ({ ...c, postUrl: p.url })))
    .filter((c) => c.text.length >= 15)
    .sort((a, b) => b.likesCount - a.likesCount)[0] ?? null;

  const date = new Date(report.event_date + "T00:00:00");
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const reportUrl = `${BASE_URL}/report/${token}`;

  return (
    <div className="min-h-screen">
      {/* iOS Safari Liquid Glass tinting */}
      <script
        dangerouslySetInnerHTML={{
          __html: `scrollTo(0,0);document.body.style.backgroundColor='${config.theme.primary}'`,
        }}
      />

      {/* ═══════════════════════════════════════════════
          HERO — Navy background with event title & big number
          ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-navy text-white">
        {/* Hero background image */}
        {report.hero_image_url && (
          <div
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${report.hero_image_url})` }}
          />
        )}
        {/* Navy overlay */}
        <div
          className={`absolute inset-0 z-[1] ${
            report.hero_image_url ? "bg-navy/[0.82]" : "bg-navy"
          }`}
        />
        {/* Noise texture */}
        <div className="noise-bg absolute inset-0 z-[2]" />
        {/* Decorative circles */}
        <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/[0.025]" />
          <div className="absolute -bottom-40 -left-20 h-[26rem] w-[26rem] rounded-full bg-white/[0.02]" />
          <div className="absolute right-[10%] top-[60%] h-64 w-64 rounded-full bg-warm/[0.03]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-6 pb-12 pt-8 sm:pb-28 sm:pt-16">
          {/* Top bar — logo + share */}
          <div
            className="animate-fade-up flex items-center justify-between"
            style={{ animationDelay: "50ms" }}
          >
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo-icon.svg"
                alt=""
                width={28}
                height={28}
                className="h-5 w-5 opacity-60 invert sm:h-6 sm:w-6"
              />
              <p className="font-display text-xs tracking-wide text-white/40 sm:text-sm">
                {config.fullName.toLowerCase()}
              </p>
            </div>
            <ShareLink
              url={reportUrl}
              title={report.title}
              text={`${report.title} — Event Report`}
              label="share"
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-xs text-white/50 backdrop-blur-sm transition-colors hover:bg-white/[0.1] hover:text-white/70"
            />
          </div>

          {/* Event badge */}
          <div
            className="animate-fade-up mt-6 sm:mt-14"
            style={{ animationDelay: "100ms" }}
          >
            <span className="inline-block rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1 font-stat text-[0.55rem] tracking-[0.3em] uppercase text-white/40 sm:px-4 sm:py-1.5 sm:text-[0.6rem]">
              event report
            </span>
          </div>

          {/* Event title */}
          <h1
            className="animate-fade-up mt-3 font-display text-3xl leading-[1.1] tracking-tight sm:mt-5 sm:text-5xl md:text-6xl"
            style={{ animationDelay: "200ms" }}
          >
            {report.title}
          </h1>

          {/* Date & location */}
          <p
            className="animate-fade-up mt-2 font-stat text-[0.6rem] tracking-[0.2em] uppercase text-white/45 sm:mt-3 sm:text-xs"
            style={{ animationDelay: "300ms" }}
          >
            {dateStr}
            {report.location && (
              <>
                {" "}
                <span className="text-white/25">&middot;</span> {report.location}
              </>
            )}
          </p>

          {/* THE BIG NUMBER — immediately after date on mobile */}
          {attendance && (
            <div
              className="animate-fade-up mt-8 text-center sm:mt-14"
              style={{ animationDelay: "400ms" }}
            >
              <div className="inline-flex flex-col items-center rounded-2xl border border-white/[0.08] bg-white/[0.04] px-10 py-6 backdrop-blur-sm sm:px-16 sm:py-10">
                <AnimatedNumber
                  value={attendance.total}
                  className="font-stat text-7xl leading-none tracking-wide text-warm sm:text-8xl md:text-9xl"
                  duration={1400}
                />
                <p className="mt-1.5 font-display text-sm tracking-tight text-white/50 sm:mt-2 sm:text-lg">
                  {config.terms.member} showed up
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {report.description && (
            <p
              className="animate-fade-up mt-4 max-w-lg text-xs leading-relaxed text-white/30 sm:mt-6 sm:text-sm sm:text-white/40 md:text-base"
              style={{ animationDelay: "500ms" }}
            >
              {report.description}
            </p>
          )}
        </div>
      </section>

      {/* Warm accent line */}
      <div className="h-1 bg-gradient-to-r from-warm via-gold to-warm" />

      {/* ═══════════════════════════════════════════════
          WHO SHOWED UP — Attendance breakdown
          ═══════════════════════════════════════════════ */}
      {attendance && (attendance.newNeighbors > 0 || attendance.returning > 0 || report.highlights.length > 0) && (
        <section className="noise-bg relative bg-white px-6 py-16 sm:py-24">
          <div className="relative z-10 mx-auto max-w-3xl">
            <h2
              className="animate-fade-up text-center font-display text-2xl tracking-tight text-navy sm:text-3xl"
              style={{ animationDelay: "100ms" }}
            >
              who showed up
            </h2>
            <p
              className="animate-fade-up mt-2 text-center text-sm text-muted-foreground"
              style={{ animationDelay: "150ms" }}
            >
              a breakdown of the community that came together
            </p>

            <div
              className="animate-fade-up mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6"
              style={{ animationDelay: "250ms" }}
            >
              {/* New members */}
              {attendance.newNeighbors > 0 && (
                <StatCard
                  value={attendance.newNeighbors}
                  label={`new ${config.terms.member}`}
                  sublabel="first time running with us"
                  accent="warm"
                />
              )}
              {/* Returning */}
              {attendance.returning > 0 && (
                <StatCard
                  value={attendance.returning}
                  label="returning runners"
                  sublabel="came back for more"
                  accent="navy"
                />
              )}
              {/* Custom highlights */}
              {report.highlights.map((h, i) => (
                <StatCard
                  key={i}
                  value={h.value}
                  label={h.label}
                  suffix={h.suffix}
                  accent={i % 2 === 0 ? "gold" : "navy"}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          THE CONTENT — Event posts with real metrics
          (falls back to old platform reach if no posts)
          ═══════════════════════════════════════════════ */}
      {posts.length > 0 ? (
        <section className="noise-bg relative bg-background px-6 py-16 sm:py-24">
          <div className="relative z-10 mx-auto max-w-3xl">
            <h2
              className="animate-fade-up text-center font-display text-2xl tracking-tight text-navy sm:text-3xl"
              style={{ animationDelay: "100ms" }}
            >
              the content
            </h2>
            <p
              className="animate-fade-up mt-2 text-center text-sm text-muted-foreground"
              style={{ animationDelay: "150ms" }}
            >
              what we put out from this event
            </p>

            {/* Aggregate stats */}
            <div
              className="animate-fade-up mt-8 flex items-center justify-center gap-8 sm:gap-12"
              style={{ animationDelay: "200ms" }}
            >
              {totalViews > 0 && (
                <div className="text-center">
                  <AnimatedNumber
                    value={totalViews}
                    className="font-stat text-2xl tracking-wide text-navy sm:text-3xl"
                    duration={1000}
                  />
                  <p className="mt-0.5 text-[11px] text-muted-foreground/50">
                    total views
                  </p>
                </div>
              )}
              <div className="text-center">
                <AnimatedNumber
                  value={totalInteractions}
                  className="font-stat text-2xl tracking-wide text-navy sm:text-3xl"
                  duration={1000}
                />
                <p className="mt-0.5 text-[11px] text-muted-foreground/50">
                  interactions
                </p>
              </div>
              <div className="text-center">
                <p className="font-stat text-2xl tracking-wide text-navy sm:text-3xl">
                  {posts.length}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/50">
                  posts
                </p>
              </div>
            </div>

            {/* Featured top post */}
            <div
              className="animate-fade-up mt-10"
              style={{ animationDelay: "300ms" }}
            >
              <FeaturedReportPost post={posts[0]} token={token} isEditor={isEditor} reportId={report.id} />
            </div>

            {/* Remaining posts */}
            {posts.length > 1 && (
              <div
                className="animate-fade-up mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
                style={{ animationDelay: "400ms" }}
              >
                {posts.slice(1).map((post) => (
                  <ReportPostCard key={post.id} post={post} token={token} isEditor={isEditor} reportId={report.id} />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : metrics && (metrics.ig || metrics.tt || metrics.strava) ? (
        <section className="noise-bg relative bg-background px-6 py-16 sm:py-24">
          <div className="relative z-10 mx-auto max-w-3xl">
            <h2
              className="animate-fade-up text-center font-display text-2xl tracking-tight text-navy sm:text-3xl"
              style={{ animationDelay: "100ms" }}
            >
              the reach
            </h2>
            <p
              className="animate-fade-up mt-2 text-center text-sm text-muted-foreground"
              style={{ animationDelay: "150ms" }}
            >
              our digital footprint this month
            </p>

            <div className="mt-10 space-y-4">
              {metrics.ig && <PlatformReach platform="instagram" metrics={metrics.ig} delay={250} />}
              {metrics.tt && <PlatformReach platform="tiktok" metrics={metrics.tt} delay={350} />}
              {metrics.strava && <PlatformReach platform="strava" metrics={metrics.strava} delay={450} />}
            </div>
          </div>
        </section>
      ) : null}

      {/* ═══════════════════════════════════════════════
          PULL QUOTE — Editorial testimonial moment
          ═══════════════════════════════════════════════ */}
      {pullQuote && (
        <section className="relative overflow-hidden bg-warm-muted px-6 py-12 sm:py-16">
          {/* Subtle warm edge accents */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-warm/0 via-warm/20 to-warm/0" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-warm/0 via-warm/20 to-warm/0" />

          <div className="mx-auto max-w-2xl text-center">
            {/* Decorative open quote */}
            <span
              className="animate-fade-up block font-display text-5xl leading-none text-warm/[0.18] sm:text-7xl"
              style={{ animationDelay: "100ms" }}
            >
              &ldquo;
            </span>

            {/* Quote text */}
            <p
              className="animate-fade-up -mt-3 font-display text-lg leading-snug tracking-tight text-navy/75 sm:-mt-5 sm:text-2xl md:text-3xl"
              style={{ animationDelay: "200ms" }}
            >
              {pullQuote.text}
            </p>

            {/* Attribution + post link */}
            <div
              className="animate-fade-up mt-4 flex items-center justify-center gap-3"
              style={{ animationDelay: "300ms" }}
            >
              <span className="text-xs tracking-wide text-warm/50 sm:text-sm">
                @{pullQuote.username}
              </span>
              {pullQuote.postUrl && (
                <>
                  <span className="text-warm/20">&middot;</span>
                  <a
                    href={pullQuote.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-warm/40 transition-colors hover:text-warm/70 sm:text-sm"
                  >
                    view post
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          GALLERY — Event photos + drive album link
          ═══════════════════════════════════════════════ */}
      {(images.length > 0 || report.drive_url || isEditor) && (
        <section className="noise-bg relative bg-white px-6 py-16 sm:py-24">
          <div className="relative z-10 mx-auto max-w-3xl">
            <h2
              className="animate-fade-up text-center font-display text-2xl tracking-tight text-navy sm:text-3xl"
              style={{ animationDelay: "100ms" }}
            >
              moments
            </h2>
            <p
              className="animate-fade-up mt-2 text-center text-sm text-muted-foreground"
              style={{ animationDelay: "150ms" }}
            >
              from the run
            </p>

            {images.length > 0 && (
              <div className="animate-fade-up mt-10" style={{ animationDelay: "200ms" }}>
                {/* Featured first image */}
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-md">
                  <Image
                    src={images[0]}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                    priority
                  />
                </div>

                {/* Remaining images in grid */}
                {images.length > 1 && (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.slice(1).map((src, i) => (
                      <div
                        key={i}
                        className="relative aspect-square overflow-hidden rounded-xl shadow-sm"
                      >
                        <Image
                          src={src}
                          alt=""
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-300 hover:scale-105"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Drive album link — visible to everyone when set */}
            {report.drive_url && (
              <div
                className="animate-fade-up mt-8 text-center"
                style={{ animationDelay: "300ms" }}
              >
                <a
                  href={report.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-xl border border-navy/[0.08] bg-navy/[0.03] px-6 py-3 font-display text-sm tracking-tight text-navy/70 transition-all hover:-translate-y-0.5 hover:border-navy/[0.15] hover:bg-navy/[0.06] hover:text-navy"
                >
                  <ImageIcon className="h-4 w-4" />
                  see all photos
                  <ExternalLink className="h-3 w-3 text-navy/30" />
                </a>
              </div>
            )}

            {/* Editor controls for drive URL */}
            {isEditor && (
              <div className="mt-4 flex justify-center">
                <DriveUrlEditor reportId={report.id} initialUrl={report.drive_url} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          VENDORS — Local businesses present at this run
          ═══════════════════════════════════════════════ */}
      {report.vendors.length > 0 && (
        <section className="noise-bg relative overflow-hidden bg-secondary px-6 py-16 sm:py-24">
          {/* Subtle warm wash */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse at top, rgba(226,184,8,0.08) 0%, transparent 55%)",
            }}
          />

          <div className="relative z-10 mx-auto max-w-3xl">
            <p
              className="animate-fade-up text-center font-stat text-[0.65rem] uppercase tracking-[0.32em] text-warm/70 sm:text-xs"
              style={{ animationDelay: "80ms" }}
            >
              on the ground
            </p>
            <h2
              className="animate-fade-up mt-2 text-center font-display text-2xl tracking-tight text-navy sm:text-3xl"
              style={{ animationDelay: "140ms" }}
            >
              neighborhood vendors
            </h2>
            <p
              className="animate-fade-up mt-2 text-center text-sm text-muted-foreground"
              style={{ animationDelay: "200ms" }}
            >
              small businesses that showed up for the run — give them a follow
            </p>

            <ul
              className={`animate-fade-up mt-10 grid gap-3 ${
                report.vendors.length === 1
                  ? "mx-auto max-w-md grid-cols-1"
                  : "grid-cols-1 sm:grid-cols-2"
              }`}
              style={{ animationDelay: "300ms" }}
            >
              {report.vendors.map((v, i) => (
                <li key={`${v.instagram}-${i}`}>
                  <a
                    href={`https://instagram.com/${v.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-navy/[0.06] bg-white px-4 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-warm/30 hover:shadow-md sm:px-5"
                  >
                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-warm/25 to-warm/[0.06] text-navy/80 transition-all duration-200 group-hover:from-warm/40 group-hover:to-warm/10 group-hover:text-navy"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-[18px] w-[18px]"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="5" />
                        <circle cx="12" cy="12" r="4" />
                        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
                      </svg>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-base leading-tight tracking-tight text-navy sm:text-lg">
                        {v.name || `@${v.instagram}`}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground/70">
                        @{v.instagram}
                      </span>
                    </span>

                    <ExternalLink
                      aria-hidden
                      className="h-3.5 w-3.5 shrink-0 text-navy/25 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-warm"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          PARTNERS — Sponsor showcase + CTA
          ═══════════════════════════════════════════════ */}
      {report.sponsors.length > 0 && (
        <section className="relative overflow-hidden bg-navy px-6 py-16 text-white sm:py-24">
          {/* Noise + circles */}
          <div className="noise-bg absolute inset-0 z-0" />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/[0.03]" />
            <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-white/[0.02]" />
          </div>

          <div className="relative z-10 mx-auto max-w-3xl">
            <h2
              className="animate-fade-up text-center font-display text-2xl tracking-tight sm:text-3xl"
              style={{ animationDelay: "100ms" }}
            >
              our partners
            </h2>
            <p
              className="animate-fade-up mt-2 text-center text-sm text-white/40"
              style={{ animationDelay: "150ms" }}
            >
              brands that made this possible
            </p>

            <div
              className={`animate-fade-up mt-10 ${
                report.sponsors.length === 1
                  ? "mx-auto max-w-[220px]"
                  : report.sponsors.length === 2
                    ? "mx-auto grid max-w-md grid-cols-2 gap-3 sm:gap-4"
                    : "grid grid-cols-3 gap-2.5 sm:gap-4"
              }`}
              style={{ animationDelay: "250ms" }}
            >
              {report.sponsors.map((s, i) => {
                const name = s.brand || s.name;
                const initials = name
                  .split(/\s+/)
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-5 text-center backdrop-blur-sm transition-colors hover:bg-white/[0.07] sm:px-6 sm:py-8"
                  >
                    {/* Logo or monogram */}
                    {s.logo_url ? (
                      <div className="mx-auto flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/[0.1] p-1.5 sm:h-16 sm:w-16 sm:rounded-2xl sm:p-2.5">
                        <Image
                          src={s.logo_url}
                          alt={name}
                          width={48}
                          height={48}
                          unoptimized
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] sm:h-16 sm:w-16 sm:rounded-2xl">
                        <span className="font-display text-sm tracking-tight text-white/50 sm:text-xl">
                          {initials}
                        </span>
                      </div>
                    )}

                    <p className="mt-2.5 font-display text-xs leading-tight tracking-tight sm:mt-4 sm:text-base">
                      {name}
                    </p>
                    {s.role && (
                      <p className="mt-0.5 text-[10px] text-white/35 sm:mt-1 sm:text-sm">
                        {s.role}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div
              className="animate-fade-up mt-12 text-center"
              style={{ animationDelay: "350ms" }}
            >
              <p className="font-display text-lg tracking-tight text-white/60">
                want to partner with us?
              </p>
              <p className="mt-2 text-sm text-white/30">
                reach out to learn how your brand can be part of our next run
              </p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <a
                  href={socials.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-xl bg-white px-7 py-3.5 font-display text-sm tracking-wide text-navy shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  <Instagram className="h-4 w-4" />
                  reach out
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════ */}
      <footer className="bg-navy-dark px-6 py-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <Image
            src="/logo-icon.svg"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 opacity-30 invert"
          />
          <p className="font-display text-sm tracking-wide text-white/25">
            {config.legalName.toLowerCase()} &middot; {config.location.toLowerCase()}
          </p>

          {/* Share + socials */}
          <div className="flex items-center gap-4">
            <a
              href={socials.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/20 transition-colors hover:text-white/40"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={socials.tiktok.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/20 transition-colors hover:text-white/40"
            >
              <TikTokIcon className="h-4 w-4" />
            </a>
            <a
              href={socials.strava.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/20 transition-colors hover:text-white/40"
            >
              <StravaIcon className="h-4 w-4" />
            </a>
          </div>

          <Link
            href="/join"
            className="text-xs text-white/15 transition-colors hover:text-white/30"
          >
            join the club
          </Link>
        </div>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  Sub-components
// ═══════════════════════════════════════════════════

function StatCard({
  value,
  label,
  sublabel,
  suffix,
  accent = "navy",
}: {
  value: number | string;
  label: string;
  sublabel?: string;
  suffix?: string;
  accent?: "navy" | "warm" | "gold";
}) {
  const accentColors = {
    navy: "border-l-navy",
    warm: "border-l-warm",
    gold: "border-l-gold",
  };

  return (
    <div
      className={`rounded-xl border-0 border-l-[3px] bg-background p-5 shadow-sm sm:p-6 ${accentColors[accent]}`}
    >
      <p className="font-stat text-3xl leading-none tracking-wide text-navy sm:text-4xl">
        {typeof value === "number" ? (
          <AnimatedNumber value={value} duration={1000} />
        ) : (
          value
        )}
        {suffix && (
          <span className="ml-1 text-lg text-navy/40">{suffix}</span>
        )}
      </p>
      <p className="mt-1.5 font-display text-sm tracking-tight text-navy/70">
        {label}
      </p>
      {sublabel && (
        <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
      )}
    </div>
  );
}

// ─── Event content cards ───

function getPostPlatform(platform: string) {
  if (platform === "instagram") return { Icon: Instagram, color: "#E1306C" };
  return { Icon: TikTokIcon, color: "#000000" };
}

function FeaturedReportPost({
  post,
  token,
  isEditor,
  reportId,
}: {
  post: SocialPost;
  token: string;
  isEditor: boolean;
  reportId: string;
}) {
  const { Icon: PlatformIcon, color: platformColor } = getPostPlatform(post.platform);
  const total = interactions(post);
  const engRate =
    post.views > 0 ? ((total / post.views) * 100).toFixed(1) : null;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-navy shadow-lg">
      {isEditor && <PostDismiss reportId={reportId} postId={post.id} />}
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute right-6 top-10 h-10 w-10 rounded-full bg-white/[0.03]" />

      <div className="relative flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <div
          className="relative aspect-[4/3] w-full shrink-0 overflow-hidden sm:aspect-auto sm:w-52 md:w-60"
          style={{
            background: `linear-gradient(135deg, ${platformColor}20, ${platformColor}40)`,
          }}
        >
          {post.thumbnail_url && (
            <Image
              src={`/api/img/${post.id}?token=${token}`}
              alt=""
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 240px"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Platform badge */}
          <div className="absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm">
            <PlatformIcon
              className="h-3 w-3"
              style={{ color: platformColor }}
            />
          </div>

          {/* Date */}
          {post.posted_at && (
            <span className="absolute bottom-3 left-3 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {formatDate(post.posted_at)}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="relative flex flex-1 flex-col p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {post.views > 0 && (
              <div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 text-white/30" />
                  <p className="text-[10px] font-medium text-white/40">
                    views
                  </p>
                </div>
                <p className="font-stat text-2xl tracking-wide text-white sm:text-3xl">
                  {post.views.toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-white/30" />
                <p className="text-[10px] font-medium text-white/40">likes</p>
              </div>
              <p className="font-stat text-2xl tracking-wide text-white sm:text-3xl">
                {post.likes.toLocaleString()}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3 text-white/30" />
                <p className="text-[10px] font-medium text-white/40">
                  comments
                </p>
              </div>
              <p className="font-stat text-2xl tracking-wide text-white sm:text-3xl">
                {post.comments.toLocaleString()}
              </p>
            </div>
            {post.shares > 0 && (
              <div>
                <div className="flex items-center gap-1">
                  <Share2 className="h-3 w-3 text-white/30" />
                  <p className="text-[10px] font-medium text-white/40">
                    shares
                  </p>
                </div>
                <p className="font-stat text-2xl tracking-wide text-white sm:text-3xl">
                  {post.shares.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {engRate && (
            <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-white/10 px-3 py-1">
              <span className="text-[10px] text-white/50">eng rate</span>
              <span className="font-stat text-sm tracking-wide text-white">
                {engRate}%
              </span>
            </div>
          )}

          {post.caption && (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/60">
              {post.caption}
            </p>
          )}

          {/* Top comments — social proof */}
          {post.latest_comments.length > 0 && (
            <div className="mt-4 border-t border-white/[0.06] pt-4">
              <p className="mb-2.5 text-[9px] font-medium uppercase tracking-[0.2em] text-white/20">
                what {config.terms.member} said
              </p>
              <div className="space-y-2">
                {post.latest_comments.slice(0, 3).map((c, i) => (
                  <div
                    key={i}
                    className="rounded-lg border-l-2 border-warm/30 bg-white/[0.04] py-1.5 pl-3 pr-3"
                  >
                    <p className="line-clamp-2 text-[11px] leading-relaxed text-white/50">
                      {c.text}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] font-medium text-warm/50">
                        @{c.username}
                      </span>
                      {c.likesCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-white/20">
                          <Heart className="h-2 w-2" />
                          {c.likesCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 self-start text-xs text-white/40 transition-colors hover:text-white/70"
            >
              view post <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportPostCard({
  post,
  token,
  isEditor,
  reportId,
}: {
  post: SocialPost;
  token: string;
  isEditor: boolean;
  reportId: string;
}) {
  const { Icon: PlatformIcon, color: platformColor } = getPostPlatform(post.platform);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm">
      {isEditor && <PostDismiss reportId={reportId} postId={post.id} />}
      {/* Thumbnail */}
      <div
        className="relative aspect-[4/5] overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${platformColor}12, ${platformColor}28)`,
        }}
      >
        {post.thumbnail_url && (
          <Image
            src={`/api/img/${post.id}?token=${token}`}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="font-stat text-2xl leading-none tracking-wide text-white">
            {post.views > 0
              ? post.views.toLocaleString()
              : post.likes.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-white/50">
            {post.views > 0 ? "views" : "likes"}
          </p>
          <div className="mt-1.5 flex items-center gap-3">
            {post.views > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-white/60">
                <Heart className="h-2.5 w-2.5" />
                {post.likes.toLocaleString()}
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] text-white/60">
              <MessageCircle className="h-2.5 w-2.5" />
              {post.comments.toLocaleString()}
            </span>
            {post.shares > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-white/60">
                <Share2 className="h-2.5 w-2.5" />
                {post.shares.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Platform badge */}
        <div className="absolute left-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm">
          <PlatformIcon
            className="h-2.5 w-2.5"
            style={{ color: platformColor }}
          />
        </div>
      </div>

      {/* Date */}
      <div className="px-3 py-2.5">
        {post.posted_at ? (
          <span className="text-[10px] text-muted-foreground/50">
            {formatDate(post.posted_at)}
          </span>
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
    </div>
  );
}

// ─── Platform metrics card ───

const PLATFORM_CONFIG = {
  instagram: {
    icon: Instagram,
    handle: config.socials.instagram.handle,
    color: "#E1306C",
    bgColor: "bg-[#E1306C]/[0.06]",
    borderColor: "border-l-[#E1306C]",
    fields: (m: ReportMetrics["ig"]) =>
      m
        ? [
            { label: "followers", value: m.followers },
            { label: "views", value: m.totalViews },
            { label: "reached", value: m.accountsReached },
            { label: "engagement", value: m.engagement },
          ]
        : [],
  },
  tiktok: {
    icon: TikTokIcon,
    handle: config.socials.tiktok.handle,
    color: "#000000",
    bgColor: "bg-black/[0.04]",
    borderColor: "border-l-black",
    fields: (m: ReportMetrics["tt"]) =>
      m
        ? [
            { label: "followers", value: m.followers },
            { label: "views", value: m.totalViews },
            { label: "likes", value: m.likes },
            { label: "shares", value: m.shares },
          ]
        : [],
  },
  strava: {
    icon: StravaIcon,
    handle: config.socials.strava.handle.toLowerCase(),
    color: "#FC4C02",
    bgColor: "bg-[#FC4C02]/[0.06]",
    borderColor: "border-l-[#FC4C02]",
    fields: (m: ReportMetrics["strava"]) =>
      m ? [{ label: "members", value: m.members }] : [],
  },
};

function PlatformReach({
  platform,
  metrics,
  delay,
}: {
  platform: Platform;
  metrics: Record<string, number>;
  delay: number;
}) {
  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- metrics shape varies by platform, validated by PLATFORM_CONFIG.fields
  const fields = config.fields(metrics as any);

  return (
    <div
      className={`animate-fade-up overflow-hidden rounded-2xl border-0 border-l-[3px] bg-white p-6 shadow-sm sm:p-8 ${config.borderColor}`}
      style={{
        animationDelay: `${delay}ms`,
        borderLeftColor: config.color,
      }}
    >
      {/* Platform header */}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.bgColor}`}
        >
          <Icon className="h-5 w-5" style={{ color: config.color }} />
        </div>
        <div>
          <p className="font-display text-base tracking-tight text-navy">
            {platform}
          </p>
          <p className="text-xs text-muted-foreground">{config.handle}</p>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="font-stat text-2xl leading-none tracking-wide text-navy sm:text-3xl">
              {formatNumber(f.value)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{f.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
