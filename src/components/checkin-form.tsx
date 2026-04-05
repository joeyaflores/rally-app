"use client";

import { useState, useEffect } from "react";
import { submitCheckin } from "@/lib/checkin";
import { getMilestone } from "@/lib/milestones";
import config from "@rally";

interface Props {
  sessionId: string;
  eventDetails?: string;
}

const LS_KEY = config.checkin.localStorageKey;

interface SavedInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

function getSaved(): SavedInfo | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Support legacy format (name + email only)
    if (parsed.firstName && parsed.email) return parsed;
    if (parsed.name && parsed.email) {
      const migrated: SavedInfo = {
        firstName: parsed.name,
        lastName: "",
        email: parsed.email,
        phone: "",
      };
      localStorage.setItem(LS_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {}
  return null;
}

const INPUT_CLASS =
  "w-full rounded-2xl border border-white/[0.08] bg-white/[0.06] px-5 py-4 text-base text-white placeholder:text-white/30 outline-none transition-colors focus-visible:border-white/20 focus-visible:bg-white/[0.08] focus-visible:ring-1 focus-visible:ring-white/20";

export function CheckinForm({ sessionId, eventDetails }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<SavedInfo | null>(null);
  const [useManual, setUseManual] = useState(false);
  const [totalCheckins, setTotalCheckins] = useState(0);

  useEffect(() => {
    const s = getSaved();
    if (s) {
      setSaved(s);
      setFirstName(s.firstName);
      setLastName(s.lastName);
      setEmail(s.email);
      setPhone(s.phone);
    }
  }, []);

  async function doCheckin(first: string, last: string, mail: string, tel: string) {
    setState("loading");
    setError("");

    const result = await submitCheckin({
      sessionId,
      firstName: first,
      lastName: last,
      email: mail,
      phone: tel,
    });

    if (result.ok) {
      try {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({
            firstName: first.trim(),
            lastName: last.trim(),
            email: mail.trim().toLowerCase(),
            phone: tel.trim(),
          })
        );
      } catch {}
      setTotalCheckins(result.totalCheckins ?? 1);
      setState(result.alreadyCheckedIn ? "already" : "success");
      setFirstName(first);
    } else {
      setError(result.error ?? "Something went wrong.");
      setState("error");
    }
  }

  // ─── Confirmation Screen ───
  if (state === "success" || state === "already") {
    const isFirstEver = totalCheckins === 1;
    const milestone = totalCheckins > 1 ? getMilestone(totalCheckins) : null;

    return (
      <div className="text-center">
        {/* Animated ring + checkmark */}
        <div className="relative mx-auto mb-8 h-24 w-24">
          {/* Pulse ring that radiates outward */}
          <div
            className="absolute inset-0 rounded-full border border-white/20"
            style={{
              animation: "checkin-pulse-out 1.2s ease-out 0.4s both",
            }}
          />
          {/* Main ring */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-white/20"
            style={{
              animation: "checkin-ring 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both, checkin-glow 1.2s ease-out 0.3s both",
            }}
          >
            {/* Animated checkmark */}
            <svg
              className="h-12 w-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M5 13l4 4L19 7"
                style={{
                  strokeDasharray: 24,
                  strokeDashoffset: 24,
                  animation: "checkin-draw 0.4s ease-out 0.35s forwards",
                }}
              />
            </svg>
          </div>
        </div>

        {/* Headline — different for first-timer vs returning */}
        <div style={{ animation: "fade-up 0.5s ease-out 0.5s both" }}>
          {state === "already" ? (
            <h2 className="font-display text-2xl tracking-wide text-white sm:text-3xl">
              already checked in
            </h2>
          ) : isFirstEver ? (
            <h2 className="font-display text-2xl tracking-wide text-white sm:text-3xl">
              {config.checkin.welcomeMessage}
            </h2>
          ) : (
            <h2 className="font-display text-2xl tracking-wide text-white sm:text-3xl">
              you&rsquo;re checked in
            </h2>
          )}
        </div>

        {/* Personal detail — first-timer gets warm welcome, regulars get their run count */}
        <div style={{ animation: "fade-up 0.5s ease-out 0.7s both" }}>
          {isFirstEver ? (
            <p className="mt-3 text-sm text-white/50">
              {config.terms.greeting}, {firstName.trim().toLowerCase()}. this is your first run with us.
            </p>
          ) : (
            <p className="mt-3 text-sm text-white/50">
              {config.terms.greeting}, {firstName.trim().toLowerCase()}.
              <span className="ml-1 text-white/70">
                run #{totalCheckins}
              </span>
            </p>
          )}
        </div>

        {/* Milestone badge for regulars */}
        {milestone && (
          <div style={{ animation: "fade-up 0.5s ease-out 0.9s both" }}>
            <span className={`mt-4 inline-block rounded-full px-4 py-1.5 text-xs font-medium ${milestone.darkColor}`}>
              {milestone.label}
            </span>
          </div>
        )}

        {/* Event details — unlocked after check-in */}
        {eventDetails && (
          <div
            className="mt-8"
            style={{ animation: "fade-up 0.6s ease-out 1.1s both" }}
          >
            <div className="mx-auto mb-4 h-px w-12 bg-white/10" />
            <p className="mb-4 font-stat text-xs tracking-[0.3em] uppercase text-white/30 sm:text-sm">
              today&apos;s run
            </p>
            <div className="space-y-3 text-base leading-relaxed text-white/50">
              {eventDetails.split("\n").filter(Boolean).map((line, i) => (
                <p
                  key={i}
                  style={{ animation: `fade-up 0.4s ease-out ${1.2 + i * 0.08}s both` }}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const showQuickCheckin = saved && !useManual && state !== "error";

  return (
    <div className="w-full">
      {/* Quick check-in for returning runners */}
      {showQuickCheckin && (
        <div className="mb-8 text-center">
          <p className="mb-3 text-sm text-white/50">
            welcome back, {saved.firstName.toLowerCase()}
          </p>
          <button
            onClick={() => doCheckin(saved.firstName, saved.lastName, saved.email, saved.phone)}
            disabled={state === "loading"}
            className="w-full rounded-2xl bg-white px-6 py-4 font-display text-lg tracking-wide text-navy shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {state === "loading" ? "\u2026" : "i\u2019m here"}
          </button>
          <button
            onClick={() => setUseManual(true)}
            className="mt-3 text-xs text-white/30 transition-colors hover:text-white/50"
          >
            not {saved.firstName.toLowerCase()}? check in manually
          </button>
        </div>
      )}

      {/* Full form */}
      {!showQuickCheckin && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            doCheckin(firstName, lastName, email, phone);
          }}
          className="space-y-3"
        >
          {/* First + Last name row */}
          <div className="flex gap-3">
            <input
              type="text"
              name="firstName"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (state === "error") setState("idle");
              }}
              placeholder="first name"
              required
              autoComplete="given-name"
              aria-label="First name"
              className={INPUT_CLASS}
            />
            <input
              type="text"
              name="lastName"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (state === "error") setState("idle");
              }}
              placeholder="last name"
              required
              autoComplete="family-name"
              aria-label="Last name"
              className={INPUT_CLASS}
            />
          </div>

          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === "error") setState("idle");
            }}
            placeholder="email"
            required
            autoComplete="email"
            spellCheck={false}
            aria-label="Email address"
            className={INPUT_CLASS}
          />

          <input
            type="tel"
            name="phone"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (state === "error") setState("idle");
            }}
            placeholder="phone"
            autoComplete="tel"
            aria-label="Phone number"
            className={INPUT_CLASS}
          />

          {state === "error" && (
            <p className="text-center text-xs text-red-300/70">{error}</p>
          )}

          <button
            type="submit"
            disabled={state === "loading"}
            className="mt-1 w-full rounded-2xl bg-white px-6 py-4 font-display text-lg tracking-wide text-navy shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {state === "loading" ? "\u2026" : "check in"}
          </button>

          <p className="text-center text-[0.65rem] leading-relaxed text-white/25">
            {config.checkin.privacyNotice}
          </p>
        </form>
      )}
    </div>
  );
}
