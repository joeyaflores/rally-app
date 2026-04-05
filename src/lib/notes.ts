"use server";

import { getDb } from "./db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { requireAuth } from "./require-auth";

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  dueDate?: string | null;
}

export interface UpcomingTask {
  id: string;
  text: string;
  dueDate: string;
  noteId: string;
  noteTitle: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  checklist: ChecklistItem[];
  pinned: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    title: row.title as string,
    body: row.body as string,
    checklist: JSON.parse((row.checklist as string) || "[]"),
    pinned: (row.pinned as number) === 1,
    archived: (row.archived as number) === 1,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getNotes(): Promise<Note[]> {
  await requireAuth();

  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM notes WHERE archived = 0 ORDER BY pinned DESC, updated_at DESC"
    )
    .all() as Record<string, unknown>[];
  return rows.map(rowToNote);
}

export async function getPinnedNotes(): Promise<Note[]> {
  await requireAuth();

  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM notes WHERE pinned = 1 AND archived = 0 ORDER BY updated_at DESC LIMIT 3"
    )
    .all() as Record<string, unknown>[];
  return rows.map(rowToNote);
}

export async function createNote(
  title: string,
  options?: { dueDate?: string }
): Promise<Note> {
  await requireAuth();

  const db = getDb();
  const id = crypto.randomUUID();
  const trimmed = title.trim() || "untitled";

  let checklist = "[]";
  if (options?.dueDate) {
    checklist = JSON.stringify([
      {
        id: crypto.randomUUID(),
        text: trimmed,
        checked: false,
        dueDate: options.dueDate,
      },
    ]);
  }

  db.prepare(
    "INSERT INTO notes (id, title, checklist) VALUES (?, ?, ?)"
  ).run(id, trimmed, checklist);
  revalidatePath("/notes");
  revalidatePath("/");
  const row = db.prepare("SELECT * FROM notes WHERE id = ?").get(id) as Record<string, unknown>;
  return rowToNote(row);
}

export async function updateNote(
  id: string,
  data: { title?: string; body?: string; checklist?: ChecklistItem[]; pinned?: boolean }
): Promise<void> {
  await requireAuth();

  const db = getDb();
  const sets: string[] = ["updated_at = datetime('now')"];
  const values: unknown[] = [];

  if (data.title !== undefined) {
    sets.push("title = ?");
    values.push(data.title);
  }
  if (data.body !== undefined) {
    sets.push("body = ?");
    values.push(data.body);
  }
  if (data.checklist !== undefined) {
    sets.push("checklist = ?");
    values.push(JSON.stringify(data.checklist));
  }
  if (data.pinned !== undefined) {
    sets.push("pinned = ?");
    values.push(data.pinned ? 1 : 0);
  }

  values.push(id);
  db.prepare(`UPDATE notes SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  revalidatePath("/notes");
  revalidatePath("/");
}

export async function archiveNote(id: string): Promise<void> {
  await requireAuth();

  const db = getDb();
  db.prepare(
    "UPDATE notes SET archived = 1, updated_at = datetime('now') WHERE id = ?"
  ).run(id);
  revalidatePath("/notes");
  revalidatePath("/");
}

export async function deleteNote(id: string): Promise<void> {
  await requireAuth();

  const db = getDb();
  db.prepare("DELETE FROM notes WHERE id = ?").run(id);
  revalidatePath("/notes");
  revalidatePath("/");
}

export async function getUpcomingTasks(limit = 8): Promise<UpcomingTask[]> {
  await requireAuth();

  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM notes WHERE archived = 0")
    .all() as Record<string, unknown>[];

  const tasks: UpcomingTask[] = [];
  for (const row of rows) {
    const note = rowToNote(row);
    for (const item of note.checklist) {
      if (!item.checked && item.dueDate) {
        tasks.push({
          id: item.id,
          text: item.text,
          dueDate: item.dueDate,
          noteId: note.id,
          noteTitle: note.title,
        });
      }
    }
  }

  tasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return tasks.slice(0, limit);
}

export async function toggleChecklistItem(
  noteId: string,
  itemId: string
): Promise<void> {
  await requireAuth();

  const db = getDb();
  const row = db
    .prepare("SELECT checklist FROM notes WHERE id = ?")
    .get(noteId) as { checklist: string } | undefined;
  if (!row) return;

  const checklist: ChecklistItem[] = JSON.parse(row.checklist || "[]");
  const updated = checklist.map((item) =>
    item.id === itemId ? { ...item, checked: !item.checked } : item
  );

  db.prepare(
    "UPDATE notes SET checklist = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(JSON.stringify(updated), noteId);
  revalidatePath("/notes");
  revalidatePath("/");
}
