import type { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";
import { getOpenSession } from "@/lib/checkin";
import { THEMES, safeTheme } from "@/lib/themes";
import { CheckinForm } from "@/components/checkin-form";
import config from "@rally";

export const metadata: Metadata = {
  title: `Check In | ${config.fullName}`,
  description: `Check in to today's run with ${config.fullName}.`,
};

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const session = await getOpenSession();
  const t = THEMES[safeTheme(session?.theme ?? "navy")];

  return (
    <div className="min-h-hero relative flex flex-col overflow-hidden text-white">
      <Script id="checkin-toolbar-tint" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: `document.body.style.backgroundColor='${t.hex}'` }} />
      <div className={`absolute inset-0 ${t.bg}`} />

      {session?.image_url && (
        <div className="absolute inset-0 z-[0]">
          <Image
            src={session.image_url}
            alt=""
            fill
            className="object-cover opacity-20"
          />
          <div className={`absolute inset-0 ${t.bg} opacity-60`} />
        </div>
      )}

      <div className="noise-bg absolute inset-0 z-[1]" />

      <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
        <div className={`absolute -right-24 -top-24 h-72 w-72 rounded-full ${t.circle1}`} />
        <div className={`absolute -bottom-32 -left-16 h-80 w-80 rounded-full ${t.circle2}`} />
      </div>

      <div
        className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col px-6 pt-12 sm:pt-20"
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Club identity */}
        <div
          className="animate-fade-up flex items-center justify-center gap-3"
          style={{ animationDelay: "100ms" }}
        >
          <Image
            src="/logo-mascot.png"
            alt=""
            width={48}
            height={60}
            className="h-10 w-auto brightness-0 invert opacity-60 sm:h-12"
          />
          <p className="font-display text-xs font-bold uppercase tracking-wide text-white/50 sm:text-sm">
            {config.fullName}
          </p>
        </div>

        {/* Event title + subtitle */}
        {session && (
          <div
            className="animate-fade-up mt-8 text-center"
            style={{ animationDelay: "175ms" }}
          >
            <h1 className="font-display text-2xl font-bold uppercase leading-tight tracking-wide text-white sm:text-3xl">
              {session.title}
            </h1>
            {session.subtitle && (
              <p className="mt-2 font-display text-sm uppercase leading-relaxed text-white/40 sm:text-base">
                {session.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-1 items-center justify-center py-8">
          <div
            className="w-full animate-fade-up"
            style={{ animationDelay: "250ms" }}
          >
            {session ? (
              <CheckinForm
                sessionId={session.id}
                eventDetails={session.event_details}
              />
            ) : (
              <div className="text-center">
                <Image
                  src="/logo-mascot.png"
                  alt=""
                  width={120}
                  height={150}
                  className="mx-auto mb-6 h-24 w-auto brightness-0 invert opacity-20 sm:h-28"
                />
                <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white/60">
                  no active check-in
                </h2>
                <p className="mt-3 font-display text-sm uppercase text-white/35">
                  Check-in opens when the run starts.
                  <br />
                  See you out there.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
