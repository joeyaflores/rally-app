import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { MapPin, Route, Instagram } from "lucide-react";
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

const SOCIAL_LINKS = [
  { platform: "instagram" as const, icon: Instagram, color: "#E1306C" },
  { platform: "tiktok" as const, icon: TikTokIcon, color: "#000000" },
  { platform: "strava" as const, icon: StravaIcon, color: "#FC4C02" },
];

export default function JoinPage() {
  return (
    <div className="min-h-screen">
      {/* iOS 26 Safari Liquid Glass toolbar tinting */}
      <Script id="ios-toolbar-tint" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: `scrollTo(0,0);document.body.style.backgroundColor='${config.theme.background}'` }} />

      {/* ─── Hero — poster style ─── */}
      <section className="noise-bg relative flex min-h-hero flex-col overflow-hidden bg-background">
        <HeroSlideshow />
        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-warm/[0.06]" />
          <div className="absolute -bottom-40 -left-20 h-[26rem] w-[26rem] rounded-full bg-navy/[0.03]" />
        </div>

        <div
          className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pt-10 sm:px-8 sm:pt-16 sm:pb-12"
          style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {/* Club identity */}
          <div
            className="animate-fade-up flex items-center gap-3"
            style={{ animationDelay: "100ms" }}
          >
            <Image
              src="/logo-mascot.png"
              alt={config.fullName}
              width={120}
              height={150}
              className="h-20 w-auto drop-shadow-md sm:h-28"
              priority
            />
            <div>
              <h1 className="font-display text-base font-bold uppercase leading-tight tracking-wide text-navy sm:text-xl">
                {config.fullName}
              </h1>
              <p className="mt-0.5 text-[11px] uppercase tracking-widest text-muted-foreground sm:text-sm">
                {config.location}
              </p>
            </div>
          </div>

          {/* The run — big poster typography */}
          <div className="flex flex-1 items-start pt-[20%] sm:items-center sm:pt-0 sm:py-8">
            <div
              className="w-full animate-fade-up"
              style={{ animationDelay: "250ms" }}
            >
              {config.events.map((event) => (
                <div key={event.name}>
                  <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-warm sm:text-base">
                    {event.day}
                  </p>
                  <p className="font-display text-[4.5rem] font-black uppercase leading-[0.85] tracking-tight text-navy sm:text-[7rem]">
                    {event.time.split(" ")[0]}
                    <span className="text-[2.5rem] sm:text-[3.5rem]">
                      {event.time.split(" ")[1]}
                    </span>
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-medium text-navy/70">
                    <a
                      href={event.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 underline decoration-navy/20 underline-offset-2 transition-colors hover:text-navy"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {event.locationShort}, {locationCity}
                    </a>
                    <span className="flex items-center gap-1.5">
                      <Route className="h-3.5 w-3.5" />
                      {event.distance}
                    </span>
                  </div>
                  {event.description && (
                    <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Email capture + socials */}
          <div
            className="animate-fade-up"
            style={{ animationDelay: "400ms" }}
          >
            <SubscribeForm />
          </div>
        </div>
      </section>

      {/* ─── Weekly Runs ─── */}
      <section id="weekly-runs" className="noise-bg relative bg-background px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-navy sm:text-3xl">
            {config.joinPage.eventsIntro}
          </h2>

          <div className="mt-10 space-y-8">
            {config.events.map((event) => (
              <div key={event.name} className="flex gap-5 sm:gap-8">
                <div className="flex flex-col items-center pt-1">
                  <div className="h-3 w-3 rounded-full bg-warm" />
                  <div className="mt-1 w-px flex-1 bg-warm/20" />
                </div>
                <div className="pb-2">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-navy">
                    {event.name.toLowerCase()}
                  </h3>
                  {event.description && (
                    <p className="mt-2 text-sm font-medium leading-relaxed text-navy/50">
                      {event.description}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-display text-sm font-medium text-navy/70">
                    <span className="font-display font-bold text-navy">
                      {event.day}s &middot; {event.time}
                    </span>
                    <a
                      href={event.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 underline decoration-navy/20 underline-offset-2 transition-colors hover:text-navy"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {event.locationShort}
                    </a>
                    <span className="flex items-center gap-1">
                      <Route className="h-3.5 w-3.5" />
                      {event.distance}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Find us ─── */}
      <section className="noise-bg relative bg-background px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-navy sm:text-xl">
            {config.terms.community}
          </h2>
          <p className="mt-1 font-display text-xs uppercase tracking-widest text-navy/40">
            follow along &middot; stay in the loop
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {SOCIAL_LINKS.map(({ platform, icon: Icon, color }) => (
              <a
                key={platform}
                href={socials[platform].url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl bg-white px-5 py-3.5 shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <Icon className="h-5 w-5" style={{ color }} />
                <div>
                  <p className="font-display text-sm font-bold uppercase tracking-wide text-navy">
                    {platform}
                  </p>
                  <p className="font-display text-xs font-medium text-navy/50">
                    {socials[platform].handle}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="noise-bg relative overflow-hidden bg-background px-6 py-24 sm:py-32">
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-navy sm:text-5xl md:text-6xl">
            {config.joinPage.ctaHeading}
          </h2>
          {config.joinPage.ctaBody && (
            <p className="mx-auto mt-5 max-w-md text-base font-medium leading-relaxed text-navy/50 sm:text-lg">
              {config.joinPage.ctaBody}
            </p>
          )}

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={socials.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-xl bg-navy px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <Instagram className="h-4 w-4" />
              {config.joinPage.ctaButtonText}
            </a>
            <a
              href="#weekly-runs"
              className="inline-flex items-center gap-2 rounded-xl border border-navy/20 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-navy/60 transition-colors hover:border-navy/40 hover:text-navy"
            >
              {config.joinPage.ctaSecondaryText}
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-background px-6 py-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <Image
            src="/logo-mascot.png"
            alt=""
            width={140}
            height={175}
            className="h-32 w-auto sm:h-36"
          />
          <p className="font-display text-sm uppercase tracking-widest text-navy/30">
            {config.legalName} &middot; {config.location}
          </p>
          <Link
            href="/login"
            className="font-display text-xs uppercase tracking-wider text-navy/15 transition-colors hover:text-navy/30"
          >
            team login
          </Link>
        </div>
      </footer>
    </div>
  );
}
