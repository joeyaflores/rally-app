"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createBoard } from "@/lib/boards";
import type { BoardType } from "@/lib/board-types";

const TYPES: { id: BoardType; label: string; color: string }[] = [
  { id: "event", label: "event", color: "#FF6B35" },
  { id: "campaign", label: "campaign", color: "#132C83" },
  { id: "merch", label: "merch", color: "#059669" },
  { id: "general", label: "general", color: "#6B7280" },
];

export function CreateBoardForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<BoardType>("general");
  const [eventDate, setEventDate] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);

    try {
      const board = await createBoard(title.trim() || "untitled board", type, {
        event_date: type === "event" && eventDate ? eventDate : undefined,
      });
      router.push(`/boards/${board.id}`);
    } catch {
      setCreating(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border/40 bg-white/50 py-4 text-sm text-muted-foreground/50 transition-all hover:border-navy/20 hover:bg-white hover:text-muted-foreground"
      >
        <Plus className="h-4 w-4" />
        new board
      </button>
    );
  }

  return (
    <form
      onSubmit={handleCreate}
      className="animate-fade-up rounded-2xl border border-border/50 bg-white p-5 shadow-sm"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="board name"
        className="mb-4 w-full bg-transparent font-display text-xl tracking-tight text-navy outline-none placeholder:text-navy/20"
        autoFocus
      />

      {/* Type selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-all"
            style={{
              backgroundColor:
                type === t.id ? t.color : "transparent",
              color: type === t.id ? "#fff" : t.color,
              border: `1.5px solid ${t.color}${type === t.id ? "" : "40"}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Event date */}
      {type === "event" && (
        <div className="mb-4">
          <label className="mb-1 block text-[11px] text-muted-foreground/60">
            event date
          </label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="rounded-lg border border-border/50 px-3 py-1.5 text-sm outline-none focus:border-navy/30"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={creating}
          className="rounded-xl bg-navy px-5 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
        >
          {creating ? "creating..." : "create board"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTitle("");
            setType("general");
            setEventDate("");
          }}
          className="rounded-xl px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary"
        >
          cancel
        </button>
      </div>
    </form>
  );
}
