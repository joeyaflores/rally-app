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

      {/* Decorative orbs — organic background movement */}
      <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
        <div
          className={`absolute -right-24 -top-24 h-72 w-72 rounded-full ${t.circle1}`}
          style={{ animation: "drift 20s ease-in-out infinite" }}
        />
        <div
          className={`absolute -bottom-32 -left-16 h-80 w-80 rounded-full ${t.circle2}`}
          style={{ animation: "drift-reverse 25s ease-in-out infinite" }}
        />
      </div>

      <div
        className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col px-6 pt-10 sm:pt-16"
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Mascot hero — full color with golden halo */}
        <div
          className="animate-fade-up text-center"
          style={{ animationDelay: "80ms" }}
        >
          <div className="relative mx-auto w-fit">
            {/* Golden halo behind mascot */}
            <div
              className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-56 sm:w-56"
              style={{
                background: "radial-gradient(circle, rgba(226,184,8,0.14) 0%, rgba(244,205,11,0.06) 40%, transparent 70%)",
                animation: "warm-pulse 8s ease-in-out infinite",
              }}
            />
            <Image
              src="/logo-mascot.png"
              alt={`${config.fullName} mascot`}
              width={160}
              height={200}
              className="relative h-28 w-auto drop-shadow-[0_4px_24px_rgba(0,0,0,0.3)] sm:h-36"
              priority
            />
          </div>

          <p className="mt-4 font-display text-[0.65rem] font-medium uppercase tracking-[0.3em] text-warm-light/85 sm:text-xs">
            {config.fullName}
          </p>
        </div>

        {/* Event hero — title + subtitle */}
        {session && (
          <div
            className="animate-fade-up mt-8 text-center sm:mt-10"
            style={{ animationDelay: "160ms" }}
          >
            <h1 className="font-display text-3xl font-bold leading-[1.1] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.15)] sm:text-4xl">
              {session.title}
            </h1>
            {session.subtitle && (
              <p className="mt-2.5 text-sm leading-relaxed text-white/85 sm:text-base">
                {session.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Main content area */}
        <div className="flex flex-1 flex-col pb-8 pt-10 sm:pt-14">
          <div
            className="w-full animate-fade-up"
            style={{ animationDelay: "240ms" }}
          >
            {session ? (
              <CheckinForm
                sessionId={session.id}
                eventDetails={session.event_details}
                vendors={session.vendors}
              />
            ) : (
              <div className="text-center">
                <div className="relative mx-auto mb-6 w-fit">
                  <div
                    className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      background: "radial-gradient(circle, rgba(226,184,8,0.06) 0%, transparent 60%)",
                    }}
                  />
                  <Image
                    src="/logo-mascot.png"
                    alt=""
                    width={160}
                    height={200}
                    className="relative h-36 w-auto opacity-20 saturate-50 sm:h-40"
                  />
                </div>
                <h2 className="font-display text-xl font-bold text-white/85">
                  no active check-in
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/65">
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
