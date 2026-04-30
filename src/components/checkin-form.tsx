"use client";

import { useState, useEffect } from "react";
import { submitCheckin } from "@/lib/checkin";
import type { Vendor } from "@/lib/checkin";
import { getMilestone } from "@/lib/milestones";
import { VendorList } from "@/components/vendor-list";
import { GrowingCactus } from "@/components/growing-cactus";
import config from "@rally";

interface Props {
  sessionId: string;
  eventDetails?: string;
  vendors?: Vendor[];
}

const LS_KEY = config.checkin.localStorageKey;

interface SavedInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthMonth: number;
  birthDay: number;
}

function getSaved(): SavedInfo | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Support legacy format (name + email only)
    if (parsed.firstName && parsed.email) {
      return {
        firstName: parsed.firstName,
        lastName: parsed.lastName ?? "",
        email: parsed.email,
        phone: parsed.phone ?? "",
        birthMonth: parsed.birthMonth ?? 0,
        birthDay: parsed.birthDay ?? 0,
      };
    }
    if (parsed.name && parsed.email) {
      const migrated: SavedInfo = {
        firstName: parsed.name,
        lastName: "",
        email: parsed.email,
        phone: "",
        birthMonth: 0,
        birthDay: 0,
      };
      localStorage.setItem(LS_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {}
  return null;
}

const INPUT_CLASS =
  "w-full rounded-2xl border border-navy/15 bg-white px-5 py-4 text-[16px] leading-6 text-navy placeholder:text-navy/45 outline-none transition-all duration-200 focus-visible:border-navy/40 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-navy/15";

const SELECT_CLASS =
  "w-full appearance-none rounded-2xl border border-navy/15 bg-white px-5 py-4 pr-10 text-[16px] leading-6 text-navy outline-none transition-all duration-200 focus-visible:border-navy/40 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-navy/15";

// Hoisted static data — never recreated (rendering-hoist-jsx)
const MONTHS = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" },
] as const;

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function CheckinForm({ sessionId, eventDetails, vendors = [] }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthMonth, setBirthMonth] = useState(0);
  const [birthDay, setBirthDay] = useState(0);
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
      setBirthMonth(s.birthMonth);
      setBirthDay(s.birthDay);
    }
  }, []);

  async function doCheckin(first: string, last: string, mail: string, tel: string, bMonth: number, bDay: number) {
    setState("loading");
    setError("");

    const result = await submitCheckin({
      sessionId,
      firstName: first,
      lastName: last,
      email: mail,
      phone: tel,
      birthMonth: bMonth,
      birthDay: bDay,
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
            birthMonth: bMonth,
            birthDay: bDay,
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
        {/* Celebration mark — forest ring + cactus inside */}
        <div aria-hidden className="relative mx-auto mb-6 h-28 w-28 sm:h-32 sm:w-32">
          {/* Pulse ring that radiates outward */}
          <div
            className="absolute inset-0 rounded-full border border-navy/25"
            style={{ animation: "checkin-pulse-out 1.2s ease-out 0.4s both" }}
          />
          {/* Forest ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-navy/55"
            style={{
              animation:
                "checkin-ring 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
              boxShadow: "0 0 24px rgba(41,116,29,0.15)",
            }}
          />
          {/* Warm gold spotlight disc — gives the cool-cream pot a contrasting backdrop */}
          <div
            className="absolute inset-2 flex items-center justify-center rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(244,205,11,0.32) 0%, rgba(226,184,8,0.14) 55%, transparent 100%)",
              animation: "checkin-ring 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both",
            }}
          >
            <GrowingCactus
              checkins={totalCheckins}
              className="h-[5.5rem] w-auto drop-shadow-[0_4px_10px_rgba(41,116,29,0.18)] sm:h-[6.5rem]"
            />
          </div>
        </div>

        {/* Headline — different for first-timer vs returning */}
        <div style={{ animation: "fade-up 0.5s ease-out 0.5s both" }}>
          {state === "already" ? (
            <h2 className="font-display text-2xl tracking-wide text-navy sm:text-3xl">
              Already checked in
            </h2>
          ) : isFirstEver ? (
            <h2 className="font-display text-2xl tracking-wide text-navy sm:text-3xl">
              {config.checkin.welcomeMessage}
            </h2>
          ) : (
            <h2 className="font-display text-2xl tracking-wide text-navy sm:text-3xl">
              You&rsquo;re checked in
            </h2>
          )}
        </div>

        {/* Personal detail — first-timer gets warm welcome, regulars get their run count */}
        <div style={{ animation: "fade-up 0.5s ease-out 0.7s both" }}>
          {isFirstEver ? (
            <p className="mt-3 text-sm text-navy/80">
              Welcome, {firstName.trim()}. This is your first run with us.
            </p>
          ) : (
            <p className="mt-3 text-sm text-navy/80">
              {config.terms.greeting}, {firstName.trim()}{" "}
              <span aria-hidden className="mx-1 text-navy/45">·</span>{" "}
              <span className="font-medium text-navy">Run #{totalCheckins}</span>
            </p>
          )}
        </div>

        {/* Milestone badge for regulars */}
        {milestone && (
          <div style={{ animation: "fade-up 0.5s ease-out 0.9s both" }}>
            <span className={`mt-4 inline-block rounded-full px-4 py-1.5 text-xs font-medium ${milestone.color}`}>
              {milestone.label}
            </span>
          </div>
        )}

        {/* Vendors — local businesses at this run */}
        <VendorList vendors={vendors} baseDelay={1.0} />

        {/* Event details — unlocked after check-in */}
        {eventDetails && (
          <div
            className="mt-8"
            style={{ animation: "fade-up 0.6s ease-out 1.1s both" }}
          >
            <div className="mx-auto mb-4 h-px w-12 bg-warm/50" />
            <p className="mb-4 font-stat text-xs tracking-[0.3em] uppercase text-navy/70 sm:text-sm">
              Today&apos;s run
            </p>
            <div className="space-y-3 text-base leading-relaxed text-navy/85">
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
        <div className="mb-8 mt-8 text-center sm:mt-2">
          <p className="mb-4 text-sm text-navy/75">
            Welcome back, {saved.firstName}
          </p>
          <button
            onClick={() => doCheckin(saved.firstName, saved.lastName, saved.email, saved.phone, saved.birthMonth, saved.birthDay)}
            disabled={state === "loading"}
            className="w-full rounded-2xl bg-navy px-6 py-4 font-display text-lg font-semibold tracking-wide text-warm-muted shadow-lg shadow-navy/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-navy-dark hover:shadow-xl hover:shadow-navy/25 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {state === "loading" ? "\u2026" : "I\u2019m here"}
          </button>
          <button
            onClick={() => setUseManual(true)}
            className="mt-4 text-xs text-navy/65 transition-colors hover:text-navy"
          >
            Not {saved.firstName}? Check in manually
          </button>
        </div>
      )}

      {/* Full form */}
      {!showQuickCheckin && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            doCheckin(firstName, lastName, email, phone, birthMonth, birthDay);
          }}
          className="space-y-4"
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
              placeholder="First name"
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
              placeholder="Last name"
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
            placeholder="Email"
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
            placeholder="Phone"
            autoComplete="tel"
            aria-label="Phone number"
            className={INPUT_CLASS}
          />

          {/* Birthday — labeled section with month + day selects */}
          <fieldset className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <svg className="h-3.5 w-3.5 text-navy/65" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-3-3.87M4 21v-2a4 4 0 0 1 3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75M8 3.13a4 4 0 0 0 0 7.75" />
                <path d="M12 11V3M9 6h6" />
              </svg>
              <legend className="text-[0.7rem] font-medium uppercase tracking-widest text-navy/75">
                Birthday
              </legend>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <select
                  value={birthMonth}
                  onChange={(e) => {
                    setBirthMonth(Number(e.target.value));
                    if (state === "error") setState("idle");
                  }}
                  aria-label="Birth month"
                  className={`${SELECT_CLASS} ${birthMonth === 0 ? "text-navy/45" : ""}`}
                >
                  <option value={0} className="text-navy/65">Month</option>
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value} className="text-navy">
                      {m.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-navy/55">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
              <div className="relative flex-1">
                <select
                  value={birthDay}
                  onChange={(e) => {
                    setBirthDay(Number(e.target.value));
                    if (state === "error") setState("idle");
                  }}
                  aria-label="Birth day"
                  className={`${SELECT_CLASS} ${birthDay === 0 ? "text-navy/45" : ""}`}
                >
                  <option value={0} className="text-navy/65">Day</option>
                  {DAYS.map((d) => (
                    <option key={d} value={d} className="text-navy">
                      {d}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-navy/55">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
          </fieldset>

          {state === "error" && (
            <p className="text-center text-xs text-red-700/85">{error}</p>
          )}

          <button
            type="submit"
            disabled={state === "loading"}
            className="mt-2 w-full rounded-2xl bg-navy px-6 py-4 font-display text-lg font-semibold tracking-wide text-warm-muted shadow-lg shadow-navy/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-navy-dark hover:shadow-xl hover:shadow-navy/25 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {state === "loading" ? "\u2026" : "Check in"}
          </button>

          <p className="text-center text-[0.65rem] leading-relaxed text-navy/55">
            {config.checkin.privacyNotice}
          </p>
        </form>
      )}
    </div>
  );
}
