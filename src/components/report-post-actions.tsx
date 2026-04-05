"use client";

import { useState, useTransition } from "react";
import { X, ImagePlus, Check, Pencil, Trash2 } from "lucide-react";
import { excludePostFromReport, updateReportDriveUrl } from "@/lib/reports";

export function PostDismiss({
  reportId,
  postId,
}: {
  reportId: string;
  postId: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleDismiss() {
    startTransition(async () => {
      await excludePostFromReport(reportId, postId);
    });
  }

  if (pending) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-sm">
        <p className="text-xs font-medium text-white/80">removing…</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleDismiss}
      className="absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white/60 opacity-0 backdrop-blur-sm transition-all hover:bg-red-500/80 hover:text-white group-hover:opacity-100"
      title="Remove from report"
    >
      <X className="h-3 w-3" />
    </button>
  );
}

export function DriveUrlEditor({
  reportId,
  initialUrl,
}: {
  reportId: string;
  initialUrl: string;
}) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(initialUrl);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateReportDriveUrl(reportId, url);
      setEditing(false);
    });
  }

  function handleRemove() {
    startTransition(async () => {
      await updateReportDriveUrl(reportId, "");
      setUrl("");
      setEditing(false);
    });
  }

  // Editing mode — inline URL input
  if (editing) {
    return (
      <div className="animate-fade-up mt-6 flex items-center gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
          autoFocus
          className="flex-1 rounded-xl border border-border/50 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-navy/30 focus:outline-none focus:ring-2 focus:ring-navy/10"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <button
          onClick={handleSave}
          disabled={pending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy text-white transition-colors hover:bg-navy-light disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-white text-muted-foreground transition-colors hover:bg-background"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // No URL set — show "add album" button (editor-only, so always visible here)
  if (!url) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-dashed border-navy/20 bg-navy/[0.03] px-4 py-2.5 text-xs text-navy/50 transition-colors hover:border-navy/40 hover:bg-navy/[0.06] hover:text-navy/70"
      >
        <ImagePlus className="h-3.5 w-3.5" />
        add photo album link
      </button>
    );
  }

  // URL exists — show edit/remove controls (editor-only)
  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-muted-foreground/50 transition-colors hover:bg-background hover:text-muted-foreground"
      >
        <Pencil className="h-2.5 w-2.5" />
        edit link
      </button>
      <button
        onClick={handleRemove}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-muted-foreground/50 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
      >
        <Trash2 className="h-2.5 w-2.5" />
        remove
      </button>
    </div>
  );
}
