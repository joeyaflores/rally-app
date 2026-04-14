"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import config from "@rally";

const errorMessages: Record<string, { heading: string; body: string }> = {
  unable_to_create_session: config.authErrors.unauthorized,
  default: config.authErrors.default,
};

function ErrorContent() {
  const params = useSearchParams();
  const code = params.get("error") ?? "default";
  const { heading, body } = errorMessages[code] ?? errorMessages.default;

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image
          src="/logo-mascot.png"
          alt={config.fullName}
          width={80}
          height={100}
          className="h-20 w-auto opacity-30 grayscale"
        />
        <div className="text-center">
          <h1 className="font-display text-2xl tracking-tight text-navy">
            {heading}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {body}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
        <Link
          href="/login"
          className="flex w-full items-center justify-center rounded-xl bg-navy px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-navy/90"
        >
          try again
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {config.legalName.toLowerCase()} &middot; {config.location.toLowerCase()}
      </p>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="noise-bg flex min-h-screen items-center justify-center bg-background px-4">
      <Suspense fallback={null}>
        <ErrorContent />
      </Suspense>
    </div>
  );
}
