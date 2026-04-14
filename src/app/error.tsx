"use client";

import Image from "next/image";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="noise-bg flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-danger/[0.04]" />
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-navy/[0.03]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <Image
          src="/logo-mascot.png"
          alt="Más Millas mascot"
          width={120}
          height={150}
          className="h-24 w-auto opacity-50 grayscale sm:h-28"
        />

        <div className="text-center">
          <p className="font-display text-lg tracking-tight text-navy">
            something went wrong
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            we tripped — give it another shot
          </p>
        </div>

        <button
          onClick={reset}
          className="rounded-full bg-navy px-6 py-2.5 text-sm text-white transition-opacity hover:opacity-80"
        >
          try again
        </button>
      </div>
    </div>
  );
}
