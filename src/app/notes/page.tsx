import { StickyNote } from "lucide-react";
import { requireAuth } from "@/lib/require-auth";
import { getNotes } from "@/lib/notes";
import { PageHeader } from "@/components/page-header";
import { QuickAdd } from "@/components/notes/quick-add";
import { NoteCard } from "@/components/notes/note-card";

export default async function NotesPage() {
  await requireAuth();

  const notes = await getNotes();
  const pinned = notes.filter((n) => n.pinned);
  const unpinned = notes.filter((n) => !n.pinned);

  return (
    <div className="noise-bg min-h-screen bg-background">
      <PageHeader title="notes" backHref="/" />

      <main className="animate-fade-up relative z-10 mx-auto max-w-3xl space-y-6 px-6 pb-20 pt-8 motion-reduce:animate-none sm:pb-8">
        <QuickAdd />

        {notes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
              <StickyNote className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              no notes yet — type above to create one
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pinned.length > 0 && (
              <div className="space-y-3">
                <p className="font-display text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  pinned
                </p>
                <div className="space-y-3">
                  {pinned.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </div>
            )}
            {unpinned.length > 0 && (
              <div className="space-y-3">
                {pinned.length > 0 && (
                  <p className="font-display text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    recent
                  </p>
                )}
                <div className="space-y-3">
                  {unpinned.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
