import Image from "next/image";
import Link from "next/link";
import config from "@rally";

export default function NotFound() {
  return (
    <div className="noise-bg flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-warm/[0.06]" />
        <div className="absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-navy/[0.03]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <Image
          src="/logo-mascot.png"
          alt={`${config.fullName} mascot`}
          width={160}
          height={200}
          className="h-32 w-auto opacity-80 sm:h-40"
          priority
        />

        <div className="text-center">
          <p className="font-stat text-7xl tracking-wide text-navy sm:text-8xl">
            404
          </p>
          <p className="mt-2 font-display text-sm uppercase tracking-widest text-muted-foreground">
            wrong trail, runner
          </p>
        </div>

        <Link
          href="/"
          className="rounded-full bg-navy px-6 py-2.5 text-sm text-white transition-opacity hover:opacity-80"
        >
          back to base
        </Link>

        <p className="text-xs text-muted-foreground/50">
          {config.fullName.toLowerCase()} &middot; {config.location.toLowerCase()}
        </p>
      </div>
    </div>
  );
}
