"use client";

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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="font-display text-sm uppercase tracking-widest text-muted-foreground">
        something went wrong
      </p>
      <button
        onClick={reset}
        className="rounded-full bg-navy px-5 py-2 text-sm text-white transition-opacity hover:opacity-80"
      >
        try again
      </button>
    </div>
  );
}
