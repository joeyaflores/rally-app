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

      {/* Warm radial glow — sunset-like depth emanating from top */}
      <div className="absolute inset-0 z-[2] overflow-hidden">
        <div
          className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/4 rounded-full sm:h-[600px] sm:w-[600px]"
          style={{
            background: "radial-gradient(circle, rgba(212,112,63,0.12) 0%, transparent 70%)",
            animation: "warm-pulse 8s ease-in-out infinite",
          }}
        />
      </div>

      {/* Decorative orbs with gentle drift */}
      <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
        <div
          className={`absolute -right-24 -top-24 h-72 w-72 rounded-full ${t.circle1}`}
          style={{ animation: "drift 20s ease-in-out infinite" }}
        />
        <div
          className={`absolute -bottom-32 -left-16 h-80 w-80 rounded-full ${t.circle2}`}
          style={{ animation: "drift-reverse 25s ease-in-out infinite" }}
        />
        {/* Small warm accent orb */}
        <div
          className="absolute right-8 top-1/3 h-32 w-32 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(212,112,63,0.04) 0%, transparent 70%)",
            animation: "drift 15s ease-in-out 3s infinite",
          }}
        />
      </div>

      <div
        className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col px-6 pt-14 sm:pt-20"
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Club identity — stacked, centered, refined */}
        <div
          className="animate-fade-up text-center"
          style={{ animationDelay: "80ms" }}
        >
          <Image
            src="/logo-mascot.png"
            alt=""
            width={80}
            height={100}
            className="mx-auto h-20 w-auto brightness-0 invert opacity-50 drop-shadow-[0_0_30px_rgba(212,112,63,0.15)] sm:h-24"
          />
          <p className="mt-3 font-display text-[0.6rem] font-medium uppercase tracking-[0.3em] text-white/30 sm:text-[0.65rem]">
            {config.fullName}
          </p>
        </div>

        {/* Event hero — title + subtitle */}
        {session && (
          <div
            className="animate-fade-up mt-10 text-center"
            style={{ animationDelay: "160ms" }}
          >
            <h1 className="font-display text-3xl font-bold uppercase leading-[1.1] tracking-wide text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.15)] sm:text-4xl">
              {session.title}
            </h1>
            {session.subtitle && (
              <p className="mt-3 text-sm leading-relaxed text-white/40 sm:text-base">
                {session.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Decorative divider — warm accent dot */}
        {session && (
          <div
            className="animate-fade-up mx-auto mt-8 flex items-center gap-3"
            style={{ animationDelay: "220ms" }}
          >
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/10" />
            <div className="h-1 w-1 rounded-full bg-warm/50" />
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/10" />
          </div>
        )}

        {/* Main content area */}
        <div className="flex flex-1 items-center justify-center py-8">
          <div
            className="w-full animate-fade-up"
            style={{ animationDelay: "280ms" }}
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
                  className="mx-auto mb-8 h-36 w-auto brightness-0 invert opacity-10 sm:h-40"
                />
                <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white/50">
                  no active check-in
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/25">
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
