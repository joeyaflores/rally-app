"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createReport, updateReport, deleteReport } from "@/lib/reports";
import { BASE_URL } from "@/lib/socials";
import type { EventReport, ReportHighlight, ReportSponsor } from "@/lib/report-types";
import config from "@rally";
import { Plus, Trash2, ExternalLink, Copy, Check } from "lucide-react";
import { ReportImageUpload } from "./report-image-upload";

interface SessionSummary {
  id: string;
  title: string;
  session_date: string;
  checkin_count: number;
}

interface ReportBuilderProps {
  sessions: SessionSummary[];
  initialReport?: EventReport;
}

export function ReportBuilder({ sessions, initialReport }: ReportBuilderProps) {
  const router = useRouter();
  const isEditing = !!initialReport;

  const [title, setTitle] = useState(initialReport?.title ?? "");
  const [eventDate, setEventDate] = useState(initialReport?.event_date ?? "");
  const [location, setLocation] = useState(initialReport?.location ?? config.report.defaultLocation);
  const [description, setDescription] = useState(initialReport?.description ?? "");
  const [sessionId, setSessionId] = useState(initialReport?.session_id ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(initialReport?.hero_image_url ?? "");
  const [metricsYear, setMetricsYear] = useState(() => initialReport?.metrics_year ?? new Date().getFullYear());
  const [metricsMonth, setMetricsMonth] = useState(() => initialReport?.metrics_month ?? new Date().getMonth() + 1);
  const [published, setPublished] = useState(initialReport ? !!initialReport.published : true);
  const [highlights, setHighlights] = useState<ReportHighlight[]>(initialReport?.highlights ?? []);
  const [sponsors, setSponsors] = useState<ReportSponsor[]>(initialReport?.sponsors ?? []);
  const [images, setImages] = useState<string[]>(initialReport?.images ?? []);
  const [contentStart, setContentStart] = useState(initialReport?.content_start ?? "");
  const [contentEnd, setContentEnd] = useState(initialReport?.content_end ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<{ token?: string; saved?: boolean; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setResult(null);

    if (isEditing) {
      const res = await updateReport(initialReport.id, {
        title,
        event_date: eventDate,
        location,
        description,
        session_id: sessionId || null,
        hero_image_url: heroImageUrl,
        highlights: highlights.filter((h) => h.label && h.value),
        sponsors: sponsors.filter((s) => s.name || s.brand),
        images,
        content_start: contentStart || null,
        content_end: contentEnd || null,
        metrics_year: metricsYear,
        metrics_month: metricsMonth,
        published,
      });

      setSaving(false);
      if (res.ok) {
        setResult({ saved: true, token: initialReport.token });
        router.refresh();
      } else {
        setResult({ error: res.error || "Failed to save changes" });
      }
    } else {
      const res = await createReport({
        title,
        event_date: eventDate,
        location,
        description,
        session_id: sessionId || undefined,
        hero_image_url: heroImageUrl || undefined,
        highlights: highlights.filter((h) => h.label && h.value),
        sponsors: sponsors.filter((s) => s.name || s.brand),
        images,
        content_start: contentStart || undefined,
        content_end: contentEnd || undefined,
        metrics_year: metricsYear,
        metrics_month: metricsMonth,
        published,
      });

      setSaving(false);
      if (res.ok && res.report) {
        setResult({ token: res.report.token });
      } else {
        setResult({ error: res.error || "Failed to create report" });
      }
    }
  }

  async function handleDelete() {
    if (!initialReport) return;
    if (!window.confirm("Delete this report? This cannot be undone.")) return;
    setDeleting(true);
    await deleteReport(initialReport.id);
    router.push("/admin/reports");
  }

  function addHighlight() {
    setHighlights([...highlights, { label: "", value: "" }]);
  }

  function removeHighlight(i: number) {
    setHighlights(highlights.filter((_, idx) => idx !== i));
  }

  function updateHighlight(i: number, field: keyof ReportHighlight, val: string) {
    const next = [...highlights];
    next[i] = { ...next[i], [field]: val };
    setHighlights(next);
  }

  function addSponsor() {
    setSponsors([...sponsors, { name: "", brand: "", role: "" }]);
  }

  function removeSponsor(i: number) {
    setSponsors(sponsors.filter((_, idx) => idx !== i));
  }

  function updateSponsor(i: number, field: keyof ReportSponsor, val: string) {
    const next = [...sponsors];
    next[i] = { ...next[i], [field]: val };
    setSponsors(next);
  }

  async function handleCopy() {
    const token = result?.token ?? initialReport?.token;
    if (!token) return;
    await navigator.clipboard.writeText(`${BASE_URL}/report/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass =
    "w-full rounded-xl border border-border/50 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-navy/30 focus:outline-none focus:ring-2 focus:ring-navy/10";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5";

  return (
    <section>
      <h2 className="font-display text-lg tracking-tight text-navy">
        {isEditing ? "edit report" : "create report"}
      </h2>

      {/* Success banner — create mode */}
      {result?.token && !isEditing && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">
            Report created!
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white px-3 py-1.5 text-xs text-navy">
              {BASE_URL}/report/{result.token}
            </code>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-emerald-700"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" /> copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> copy
                </>
              )}
            </button>
            <a
              href={`${BASE_URL}/report/${result.token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg bg-navy px-3 py-1.5 text-xs text-white transition-colors hover:bg-navy-light"
            >
              <ExternalLink className="h-3 w-3" /> view
            </a>
          </div>
        </div>
      )}

      {/* Success banner — edit mode */}
      {result?.saved && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">
            Changes saved
          </p>
          <a
            href={`${BASE_URL}/report/${result.token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg bg-navy px-3 py-1.5 text-xs text-white transition-colors hover:bg-navy-light"
          >
            <ExternalLink className="h-3 w-3" /> view report
          </a>
        </div>
      )}

      {result?.error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {result.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-5">
        {/* Title + Date row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>event title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Saturday Long Run"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>event date</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        </div>

        {/* Location + Session */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={config.report.defaultLocation}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>check-in session</label>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className={inputClass}
            >
              <option value="">none (no attendance data)</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} — {s.session_date} ({s.checkin_count} check-ins)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="our biggest monday social run yet — celebrating st. patrick's day with the fort worth running community"
            rows={2}
            className={inputClass + " resize-none"}
          />
        </div>

        {/* Hero image */}
        <div>
          <label className={labelClass}>hero image URL (optional)</label>
          <input
            type="url"
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </div>

        {/* Event photos */}
        <ReportImageUpload images={images} onChange={setImages} />

        {/* Metrics month */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>metrics year</label>
            <input
              type="number"
              value={metricsYear}
              onChange={(e) => setMetricsYear(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>metrics month</label>
            <select
              value={metricsMonth}
              onChange={(e) => setMetricsMonth(Number(e.target.value))}
              className={inputClass}
            >
              {[
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December",
              ].map((name, i) => (
                <option key={i} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content date window */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>content window start (optional)</label>
            <input
              type="date"
              value={contentStart}
              onChange={(e) => setContentStart(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>content window end (optional)</label>
            <input
              type="date"
              value={contentEnd}
              onChange={(e) => setContentEnd(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Custom highlights */}
        <div>
          <div className="flex items-center justify-between">
            <label className={labelClass}>custom highlights</label>
            <button
              type="button"
              onClick={addHighlight}
              className="flex items-center gap-1 text-xs text-navy/60 transition-colors hover:text-navy"
            >
              <Plus className="h-3 w-3" /> add
            </button>
          </div>
          {highlights.map((h, i) => (
            <div key={i} className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={h.value}
                onChange={(e) => updateHighlight(i, "value", e.target.value)}
                placeholder="1"
                className={inputClass + " w-20"}
              />
              <input
                type="text"
                value={h.label}
                onChange={(e) => updateHighlight(i, "label", e.target.value)}
                placeholder="nike shoe raffle"
                className={inputClass + " flex-1"}
              />
              <button
                type="button"
                onClick={() => removeHighlight(i)}
                className="text-muted-foreground/40 transition-colors hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Sponsors */}
        <div>
          <div className="flex items-center justify-between">
            <label className={labelClass}>partners / sponsors</label>
            <button
              type="button"
              onClick={addSponsor}
              className="flex items-center gap-1 text-xs text-navy/60 transition-colors hover:text-navy"
            >
              <Plus className="h-3 w-3" /> add
            </button>
          </div>
          {sponsors.map((s, i) => (
            <div key={i} className="mt-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={s.brand}
                  onChange={(e) => updateSponsor(i, "brand", e.target.value)}
                  placeholder="Fleet Feet"
                  className={inputClass + " flex-1"}
                />
                <input
                  type="text"
                  value={s.role}
                  onChange={(e) => updateSponsor(i, "role", e.target.value)}
                  placeholder="event sponsor"
                  className={inputClass + " flex-1"}
                />
                <button
                  type="button"
                  onClick={() => removeSponsor(i)}
                  className="text-muted-foreground/40 transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                type="url"
                value={s.logo_url || ""}
                onChange={(e) => updateSponsor(i, "logo_url", e.target.value)}
                placeholder="logo URL (optional)"
                className={inputClass + " text-xs text-muted-foreground"}
              />
            </div>
          ))}
        </div>

        {/* Published toggle */}
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 rounded border-border text-navy focus:ring-navy/20"
          />
          <span className="text-muted-foreground">
            {isEditing ? "published" : "publish immediately"}
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || !title || !eventDate}
          className="w-full rounded-xl bg-navy px-6 py-3 font-display text-sm tracking-wide text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-navy-light disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {saving
            ? isEditing ? "saving..." : "creating..."
            : isEditing ? "save changes" : "create report"}
        </button>

        {/* Delete — edit mode only */}
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full rounded-xl border border-red-200 bg-red-50 px-6 py-3 font-display text-sm tracking-wide text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
          >
            {deleting ? "deleting..." : "delete report"}
          </button>
        )}
      </form>
    </section>
  );
}
