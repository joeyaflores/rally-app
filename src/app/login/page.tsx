"use client";

import Image from "next/image";
import { signIn } from "@/lib/auth-client";
import config from "@rally";

export default function LoginPage() {
  return (
    <div className="noise-bg flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Image
            src="/logo-mascot.png"
            alt={config.fullName}
            width={100}
            height={125}
            className="h-24 w-auto"
          />
          <div className="text-center">
            <h1 className="font-display text-xl font-bold uppercase tracking-wide text-navy">
              {config.fullName}
            </h1>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              Team Dashboard
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
          <button
            onClick={() =>
              signIn.social({ provider: "google", callbackURL: "/" })
            }
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-navy px-4 py-3 text-sm font-medium uppercase tracking-wide text-white transition-colors hover:bg-navy/90"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign In with Google
          </button>

          <p className="mt-4 text-center text-xs uppercase tracking-wider text-muted-foreground">
            Team members only
          </p>
        </div>

        <p className="mt-6 text-center font-display text-xs uppercase tracking-widest text-muted-foreground/50">
          {config.legalName} &middot; {config.location}
        </p>
      </div>
    </div>
  );
}
