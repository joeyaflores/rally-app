import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Route,
  Instagram,
  ExternalLink,
  Sun,
  Moon,
} from "lucide-react";
import { TikTokIcon, StravaIcon } from "@/components/icons";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { SubscribeForm } from "@/components/subscribe-form";
import { socials } from "@/lib/socials";
import config from "@rally";

const locationCity = config.location.split(",")[0].toLowerCase();

export const metadata: Metadata = {
  title: `Join Us | ${config.fullName}`,
  description: `${config.location}'s community run club. ${config.terms.welcome}. ${config.joinPage.heroSubtitle}.`,
  openGraph: {
    title: `${config.fullName} — ${config.location}`,
    description: `${config.terms.welcome}. ${config.joinPage.heroSubtitle}.`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${config.fullName} — ${config.location}`,
    description: `${config.terms.welcome}. ${config.joinPage.heroSubtitle}.`,
  },
};

const SOCIAL_CARDS = [
  {
    platform: "instagram" as const,
    icon: Instagram,
    bgColor: "bg-[#E1306C]/10",
    textColor: "text-[#E1306C]",
    hoverBg: "group-hover:bg-[#E1306C]/15",
  },
  {
    platform: "tiktok" as const,
    icon: TikTokIcon,
    bgColor: "bg-black/[0.06]",
    textColor: "text-black",
    hoverBg: "group-hover:bg-black/10",
  },
  {
    platform: "strava" as const,
    icon: StravaIcon,
    bgColor: "bg-[#FC4C02]/10",
    textColor: "text-[#FC4C02]",
    hoverBg: "group-hover:bg-[#FC4C02]/15",
  },
];

export default function JoinPage() {
  return (
    <div className="min-h-screen">
      {/* Force scroll to top + set body bg for iOS 26 Safari Liquid Glass toolbar tinting */}
      <script dangerouslySetInnerHTML={{ __html: `scrollTo(0,0);document.body.style.backgroundColor='${config.theme.primary}'` }} />
      {/* ─── Hero ─── */}
      <section className="min-h-hero relative flex flex-col overflow-hidden text-white sm:px-0">
        {/* Background slideshow */}
        <HeroSlideshow />
        {/* Navy overlay */}
        <div className="absolute inset-0 z-[1] bg-navy/[0.78]" />
        {/* Noise texture */}
        <div className="noise-bg absolute inset-0 z-[2]" />
        {/* Decorative circles */}
        <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/[0.025]" />
          <div className="absolute -bottom-40 -left-20 h-[26rem] w-[26rem] rounded-full bg-white/[0.02]" />
        </div>

        <div
          className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pt-10 sm:px-8 sm:pt-16 sm:pb-12"
          style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {/* Club identity — top */}
          <div
            className="animate-fade-up flex items-center gap-3"
            style={{ animationDelay: "100ms" }}
          >
            <Image
              src="/logo-icon.svg"
              alt=""
              width={32}
              height={32}
              className="h-6 w-6 opacity-70 invert sm:h-8 sm:w-8"
            />
            <h1 className="font-display text-sm tracking-wide text-white/60 sm:text-base">
              {config.fullName.toLowerCase()}{" "}
              <span className="text-white/35">&middot;</span>{" "}
              <span className="text-white/45">{locationCity}</span>
            </h1>
          </div>

          {/* The runs — centered in available space */}
          <div className="flex flex-1 items-start pt-[25%] sm:items-center sm:pt-0 sm:py-8">
            <div
              className="w-full animate-fade-up rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm"
              style={{ animationDelay: "250ms" }}
            >
            {/* ── Mobile: compact side-by-side ── */}
            <div className="sm:hidden">
              <div className={`grid grid-cols-${config.events.length}`}>
                {config.events.map((event, i) => (
                  <div
                    key={event.name}
                    className={`px-5 py-4 ${i > 0 ? "border-l border-white/[0.06]" : ""}`}
                  >
                    <p className="font-stat text-[0.55rem] tracking-[0.25em] uppercase text-white/40">
                      {event.dayShort} &middot; {event.shortName}
                    </p>
                    <p className="mt-1 font-stat text-2xl leading-none tracking-wide text-white">
                      {event.timeSplit.value} <span className="text-lg text-white/70">{event.timeSplit.period}</span>
                    </p>
                    <p className="mt-1.5 flex items-center gap-1 text-[0.6rem] tracking-wider text-white/30">
                      <Route className="h-2.5 w-2.5 shrink-0" />
                      {event.distanceShort}
                    </p>
                    <a
                      href={event.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1 text-[0.6rem] text-white/40 active:text-white/60"
                    >
                      <MapPin className="h-2.5 w-2.5 shrink-0" />
                      <span className="underline decoration-white/20 underline-offset-2">{event.locationShort}</span>
                    </a>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/[0.06] px-5 py-2.5">
                <p className="text-center text-[0.6rem] tracking-widest text-white/25">
                  {config.joinPage.heroSubtitle}
                </p>
              </div>
            </div>

            {/* ── Desktop: full dramatic layout ── */}
            <div className="hidden sm:block">
              {config.events.map((event, i) => (
                <div key={event.name}>
                  {i > 0 && <div className="mx-8 border-t border-white/[0.06]" />}
                  <div className="px-8 pb-7 pt-7">
                    <p className="font-stat text-xs tracking-[0.3em] uppercase text-white/45">
                      {event.day} &middot; {event.shortName}
                    </p>
                    <p className="font-stat text-6xl leading-none tracking-wide text-white md:text-7xl">
                      {event.time}
                    </p>
                    <p className="mt-1 font-stat text-[0.65rem] tracking-[0.2em] uppercase text-white/35">
                      Takeoff
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 text-sm text-white/50">
                      <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white/70">
                        <MapPin className="h-3.5 w-3.5" />
                        Meet at {event.locationShort}, {locationCity}
                      </a>
                      <span className="flex items-center gap-1.5">
                        <Route className="h-3.5 w-3.5" />
                        {event.distance}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-t border-white/[0.06] px-8 py-4">
                <p className="text-xs leading-relaxed text-white/35">
                  {config.terms.welcome}. Arrive 10–15 min early for parking &amp;
                  stretching.
                </p>
              </div>
            </div>
            </div>
          </div>

          {/* Bottom — email capture + socials */}
          <div
            className="animate-fade-up"
            style={{ animationDelay: "400ms" }}
          >
            <SubscribeForm />
          </div>
        </div>
      </section>

      {/* ─── Weekly Runs ─── */}
      <section id="weekly-runs" className="noise-bg relative bg-white px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-3xl tracking-tight text-navy sm:text-4xl">
            weekly runs
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            {config.joinPage.eventsIntro}
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {config.events.map((event, i) => (
              <div
                key={event.name}
                className="group relative overflow-hidden rounded-2xl border-0 bg-background p-8 shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <div className={`absolute left-0 top-0 h-full w-1 ${i === 0 ? "bg-navy" : "bg-navy-light"}`} />

                <div className="mb-4 flex items-center gap-2.5 text-navy/40">
                  {event.timeOfDay === "evening" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                  <span className="font-stat text-xs tracking-[0.2em] uppercase">
                    {event.timeOfDay === "evening" ? "Weeknight" : "Weekend"}
                  </span>
                </div>

                <h3 className="font-display text-xl tracking-tight text-navy">
                  {event.name.toLowerCase()}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {event.description}
                </p>

                <div className="mt-6 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-foreground/70">
                    <Clock className="h-4 w-4 shrink-0 text-navy/40" />
                    <span>Takeoff at {event.time}</span>
                  </div>
                  <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 text-sm text-foreground/70 underline decoration-foreground/15 underline-offset-2 transition-colors hover:text-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-navy/40" />
                    <span>Meet at {event.locationShort}, {locationCity}</span>
                  </a>
                  <div className="flex items-center gap-2.5 text-sm text-foreground/70">
                    <Route className="h-4 w-4 shrink-0 text-navy/40" />
                    <span>{event.distance}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── The Neighborhood ─── */}
      <section className="noise-bg relative bg-background px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-3xl tracking-tight text-navy sm:text-4xl">
            {config.terms.community}
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            Where to find the club online.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {SOCIAL_CARDS.map(({ platform, icon: Icon, bgColor, textColor, hoverBg }) => (
              <a
                key={platform}
                href={socials[platform].url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bgColor} ${textColor} transition-colors ${hoverBg}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div className="text-center">
                  <p className="font-display text-base tracking-tight text-navy">
                    {platform}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {socials[platform].handle}
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Just Show Up ─── */}
      <section className="noise-bg relative overflow-hidden bg-navy px-6 py-28 text-white sm:py-36">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-white/[0.02]" />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl md:text-6xl">
            {config.joinPage.ctaHeading}
          </h2>
          <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-white/50">
            {config.joinPage.ctaBody}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={socials.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-xl bg-white px-7 py-3.5 font-display text-sm tracking-wide text-navy shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <Instagram className="h-4 w-4" />
              {config.joinPage.ctaButtonText}
            </a>
            <a
              href="#weekly-runs"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 font-display text-sm tracking-wide text-white/70 transition-colors hover:border-white/40 hover:text-white"
            >
              {config.joinPage.ctaSecondaryText}
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-navy-dark px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center">
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
          <Link
            href="/login"
            className="text-xs text-white/15 transition-colors hover:text-white/30"
          >
            team login
          </Link>
        </div>
      </footer>
    </div>
  );
}
