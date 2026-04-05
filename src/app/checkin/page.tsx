import type { Metadata } from "next";
import Image from "next/image";
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
      {/* Set body bg for iOS 26 Safari Liquid Glass toolbar tinting */}
      <script dangerouslySetInnerHTML={{ __html: `document.body.style.backgroundColor='${t.hex}'` }} />
      {/* Background color */}
      <div className={`absolute inset-0 ${t.bg}`} />

      {/* Event image overlay */}
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

      {/* Decorative circles */}
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
            src="/logo-icon.svg"
            alt=""
            width={28}
            height={28}
            className="h-5 w-5 opacity-60 invert sm:h-6 sm:w-6"
          />
          <p className="font-display text-xs tracking-wide text-white/50 sm:text-sm">
            {config.name}
          </p>
        </div>

        {/* Event title + subtitle */}
        {session && (
          <div
            className="animate-fade-up mt-8 text-center"
            style={{ animationDelay: "175ms" }}
          >
            <h1 className="font-display text-2xl leading-tight tracking-wide text-white sm:text-3xl">
              {session.title.toLowerCase()}
            </h1>
            {session.subtitle && (
              <p className="mt-2 font-body text-sm leading-relaxed text-white/40 sm:text-base">
                {session.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Main content — centered */}
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
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.05]">
                  <svg className="h-9 w-9 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-display text-xl tracking-wide text-white/60">
                  no active check-in
                </h2>
                <p className="mt-3 text-sm text-white/35">
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
