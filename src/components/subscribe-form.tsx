"use client";

import { useState } from "react";
import { Instagram } from "lucide-react";
import { subscribe } from "@/lib/subscribers";
import { socials } from "@/lib/socials";
import { TikTokIcon, StravaIcon } from "@/components/icons";
import config from "@rally";

const SOCIALS = [
  { href: socials.instagram.url, label: "Instagram", icon: Instagram },
  { href: socials.tiktok.url, label: "TikTok", icon: TikTokIcon },
  { href: socials.strava.url, label: "Strava", icon: StravaIcon },
] as const;

function SocialLinks() {
  return (
    <div className="mt-3.5 flex items-center gap-2.5">
      <span className="font-display text-xs font-bold uppercase tracking-wider text-navy/40">or find us on</span>
      <div className="flex items-center gap-2">
        {SOCIALS.map(({ href, label, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="text-navy/50 transition-colors hover:text-navy"
          >
            <Icon className="h-3.5 w-3.5" />
          </a>
        ))}
      </div>
    </div>
  );
}

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setError("");

    const result = await subscribe(email, honeypot);

    if (result.ok) {
      setState("success");
    } else {
      setError(result.error ?? "Something went wrong.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div>
        <p className="font-display text-sm tracking-wide text-navy/70">
          {config.joinPage.successMessage}
        </p>
        <SocialLinks />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-2.5 font-display text-xs font-bold uppercase tracking-[0.2em] text-navy/60 sm:text-sm">
        {config.joinPage.emailCaptureLabel}
      </p>
      {/* Honeypot — hidden from humans, filled by bots */}
      <input
        type="text"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute h-0 w-0 overflow-hidden opacity-0"
      />
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder="your email…"
          required
          autoComplete="email"
          spellCheck={false}
          aria-label="Email address"
          className="min-w-0 flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus-visible:border-navy/30 focus-visible:ring-1 focus-visible:ring-navy/20"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="shrink-0 rounded-xl bg-navy px-4 py-2.5 font-display text-sm uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 sm:px-5"
        >
          {state === "loading" ? "\u2026" : "join"}
        </button>
      </div>
      {state === "error" && (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      )}
      <SocialLinks />
    </form>
  );
}
