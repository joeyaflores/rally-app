import Link from "next/link";
import { Pin, ArrowRight } from "lucide-react";
import type { Note } from "@/lib/notes";

export function PinnedPreview({ notes }: { notes: Note[] }) {
  if (notes.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-medium uppercase tracking-widest text-muted-foreground">
          pinned notes
        </h2>
        <Link
          href="/notes"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-navy"
        >
          all notes
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {notes.map((note) => {
          const checked = note.checklist.filter((i) => i.checked).length;
          const total = note.checklist.length;
          return (
            <Link
              key={note.id}
              href="/notes"
              className="group rounded-2xl border border-border/50 bg-white p-4 shadow-sm transition-all hover:border-navy/20"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-display text-base tracking-tight text-navy">
                  {note.title || "untitled"}
                </p>
                <Pin className="mt-0.5 h-3 w-3 shrink-0 text-warm" />
              </div>
              {note.body && (
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {note.body}
                </p>
              )}
              {total > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-navy transition-all"
                      style={{ width: `${total > 0 ? (checked / total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {checked}/{total}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
