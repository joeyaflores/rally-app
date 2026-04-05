"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Pin, PinOff, Archive, Trash2, Plus, Check, CalendarDays } from "lucide-react";
import type { Note, ChecklistItem } from "@/lib/notes";
import { updateNote, archiveNote, deleteNote } from "@/lib/notes";
import { DatePicker } from "./date-picker";

function formatShortDate(dateStr: string): string {
  const due = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / 86400000
  );
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tmrw";
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ChecklistRow({
  item,
  onToggle,
  onUpdate,
  onRemove,
  onDateChange,
}: {
  item: ChecklistItem;
  onToggle: () => void;
  onUpdate: (text: string) => void;
  onRemove: () => void;
  onDateChange: (date: string | null) => void;
}) {
  const hasDate = !!item.dueDate;
  const isOverdue =
    hasDate &&
    !item.checked &&
    new Date(item.dueDate + "T00:00:00") <
      new Date(new Date().toDateString());

  return (
    <div className="group flex items-center gap-2.5 py-1">
      <button
        onClick={onToggle}
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2 transition-colors ${
          item.checked
            ? "border-navy bg-navy text-white"
            : "border-border hover:border-navy/50"
        }`}
      >
        {item.checked ? <Check className="h-3 w-3" /> : null}
      </button>
      <input
        type="text"
        value={item.text}
        onChange={(e) => onUpdate(e.target.value)}
        className={`flex-1 bg-transparent text-sm outline-none ${
          item.checked ? "text-muted-foreground line-through" : "text-foreground"
        }`}
        placeholder="to do..."
      />

      {/* Due date picker */}
      <DatePicker value={item.dueDate} onChange={onDateChange}>
        {hasDate ? (
          <span
            className={`flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              isOverdue
                ? "bg-warm-muted text-warm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarDays className="h-3 w-3" />
            {formatShortDate(item.dueDate!)}
          </span>
        ) : (
          <span className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-secondary hover:text-navy">
            <CalendarDays className="h-4 w-4" />
          </span>
        )}
      </DatePicker>

      <button
        onClick={onRemove}
        className="shrink-0 text-muted-foreground opacity-100 transition-opacity hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

export function NoteCard({ note }: { note: Note }) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(note.checklist);
  const [pinned, setPinned] = useState(note.pinned);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const save = useCallback(
    (data: { title?: string; body?: string; checklist?: ChecklistItem[]; pinned?: boolean }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        updateNote(note.id, data);
      }, 500);
    },
    [note.id]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // Auto-resize body textarea
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.style.height = "auto";
      bodyRef.current.style.height = bodyRef.current.scrollHeight + "px";
    }
  }, [body, expanded]);

  function handleTitleChange(val: string) {
    setTitle(val);
    save({ title: val });
  }

  function handleBodyChange(val: string) {
    setBody(val);
    save({ body: val });
  }

  function handleChecklistChange(updated: ChecklistItem[]) {
    setChecklist(updated);
    save({ checklist: updated });
  }

  function toggleItem(id: string) {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    handleChecklistChange(updated);
  }

  function updateItemText(id: string, text: string) {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, text } : item
    );
    handleChecklistChange(updated);
  }

  function removeItem(id: string) {
    handleChecklistChange(checklist.filter((item) => item.id !== id));
  }

  function updateItemDate(id: string, date: string | null) {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, dueDate: date } : item
    );
    handleChecklistChange(updated);
  }

  function addItem() {
    const newItem: ChecklistItem = {
      id: globalThis.crypto.randomUUID(),
      text: "",
      checked: false,
    };
    handleChecklistChange([...checklist, newItem]);
  }

  async function handlePin() {
    const next = !pinned;
    setPinned(next);
    await updateNote(note.id, { pinned: next });
  }

  async function handleArchive() {
    await archiveNote(note.id);
  }

  async function handleDelete() {
    await deleteNote(note.id);
  }

  const checkedCount = checklist.filter((i) => i.checked).length;
  const totalCount = checklist.length;
  const hasChecklist = totalCount > 0;

  return (
    <div
      className={`group rounded-2xl border border-border/50 bg-white shadow-sm transition-all ${
        expanded ? "ring-1 ring-navy/10" : "hover:border-navy/20"
      } ${pinned ? "border-l-[3px] border-l-warm" : ""}`}
    >
      {/* Header — always visible */}
      <div
        className="flex cursor-pointer items-start justify-between gap-3 px-5 pt-4 pb-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="min-w-0 flex-1">
          {expanded ? (
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent font-display text-base tracking-tight text-navy outline-none"
              placeholder="untitled"
            />
          ) : (
            <p className="truncate font-display text-base tracking-tight text-navy">
              {title || "untitled"}
            </p>
          )}
          {!expanded && body && (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
              {body}
            </p>
          )}
          {!expanded && hasChecklist && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {checkedCount}/{totalCount} done
            </p>
          )}
        </div>
        {pinned && !expanded && (
          <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warm" />
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-4">
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => handleBodyChange(e.target.value)}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50"
            placeholder="write something..."
            rows={2}
          />

          {/* Checklist */}
          {hasChecklist && (
            <div className="mt-3 space-y-0.5">
              {checklist.map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleItem(item.id)}
                  onUpdate={(text) => updateItemText(item.id, text)}
                  onRemove={() => removeItem(item.id)}
                  onDateChange={(date) => updateItemDate(item.id, date)}
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
            <button
              onClick={addItem}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-navy"
            >
              <Plus className="h-3.5 w-3.5" />
              add checklist item
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePin}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-navy"
                title={pinned ? "Unpin" : "Pin"}
              >
                {pinned ? (
                  <PinOff className="h-3.5 w-3.5" />
                ) : (
                  <Pin className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={handleArchive}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title="Archive"
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-danger"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
