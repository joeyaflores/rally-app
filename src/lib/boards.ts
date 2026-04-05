"use server";

import { getDb } from "./db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { requireAuth } from "./require-auth";
import type {
  Board,
  BoardWithMeta,
  BoardItem,
  BoardType,
  BoardItemType,
} from "./board-types";
import type { ContentPost } from "./calendar-types";

function rowToBoard(row: Record<string, unknown>): Board {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    board_type: row.board_type as BoardType,
    cover_url: row.cover_url as string,
    event_date: (row.event_date as string) || null,
    archived: (row.archived as number) === 1,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function queryBoards(db: ReturnType<typeof getDb>, limit?: number): BoardWithMeta[] {
  const sql = `SELECT b.*,
    COUNT(bi.id) as item_count,
    CASE WHEN b.cover_url != '' THEN b.cover_url
         ELSE (SELECT bi2.content FROM board_items bi2 WHERE bi2.board_id = b.id AND bi2.item_type = 'image' ORDER BY bi2.position LIMIT 1)
    END as cover
  FROM boards b
  LEFT JOIN board_items bi ON bi.board_id = b.id
  WHERE b.archived = 0
  GROUP BY b.id
  ORDER BY b.updated_at DESC${limit ? " LIMIT ?" : ""}`;

  const rows = (limit ? db.prepare(sql).all(limit) : db.prepare(sql).all()) as Record<string, unknown>[];

  return rows.map((row) => ({
    ...rowToBoard(row),
    item_count: (row.item_count as number) || 0,
    cover: (row.cover as string) || "",
  }));
}

export async function getBoards(): Promise<BoardWithMeta[]> {
  await requireAuth();
  return queryBoards(getDb());
}

export async function getBoard(id: string): Promise<Board | null> {
  await requireAuth();
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM boards WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return rowToBoard(row);
}

export async function getBoardItems(boardId: string): Promise<BoardItem[]> {
  await requireAuth();
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM board_items WHERE board_id = ? ORDER BY position DESC, created_at DESC"
    )
    .all(boardId) as BoardItem[];
}

export async function createBoard(
  title: string,
  boardType: BoardType,
  options?: { description?: string; event_date?: string }
): Promise<Board> {
  await requireAuth();
  const db = getDb();
  const id = crypto.randomUUID();

  db.prepare(
    "INSERT INTO boards (id, title, board_type, description, event_date) VALUES (?, ?, ?, ?, ?)"
  ).run(
    id,
    title,
    boardType,
    options?.description ?? "",
    options?.event_date ?? null
  );

  revalidatePath("/boards");
  revalidatePath("/");
  const row = db
    .prepare("SELECT * FROM boards WHERE id = ?")
    .get(id) as Record<string, unknown>;
  return rowToBoard(row);
}

export async function updateBoard(
  id: string,
  data: {
    title?: string;
    description?: string;
    board_type?: BoardType;
    cover_url?: string;
    event_date?: string | null;
  }
): Promise<void> {
  await requireAuth();
  const db = getDb();
  const sets: string[] = ["updated_at = datetime('now')"];
  const values: unknown[] = [];

  if (data.title !== undefined) {
    sets.push("title = ?");
    values.push(data.title);
  }
  if (data.description !== undefined) {
    sets.push("description = ?");
    values.push(data.description);
  }
  if (data.board_type !== undefined) {
    sets.push("board_type = ?");
    values.push(data.board_type);
  }
  if (data.cover_url !== undefined) {
    sets.push("cover_url = ?");
    values.push(data.cover_url);
  }
  if (data.event_date !== undefined) {
    sets.push("event_date = ?");
    values.push(data.event_date);
  }

  values.push(id);
  db.prepare(`UPDATE boards SET ${sets.join(", ")} WHERE id = ?`).run(
    ...values
  );
  revalidatePath("/boards");
  revalidatePath(`/boards/${id}`);
  revalidatePath("/");
}

export async function archiveBoard(id: string): Promise<void> {
  await requireAuth();
  const db = getDb();
  db.prepare(
    "UPDATE boards SET archived = 1, updated_at = datetime('now') WHERE id = ?"
  ).run(id);
  revalidatePath("/boards");
  revalidatePath("/");
}

export async function addBoardItem(
  boardId: string,
  itemType: BoardItemType,
  content: string,
  title: string
): Promise<BoardItem> {
  await requireAuth();
  const db = getDb();
  const id = crypto.randomUUID();

  const last = db
    .prepare(
      "SELECT MAX(position) as max_pos FROM board_items WHERE board_id = ?"
    )
    .get(boardId) as { max_pos: number | null };
  const position = (last?.max_pos ?? -1) + 1;

  db.prepare(
    "INSERT INTO board_items (id, board_id, item_type, content, title, position) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, boardId, itemType, content, title, position);

  db.prepare(
    "UPDATE boards SET updated_at = datetime('now') WHERE id = ?"
  ).run(boardId);

  revalidatePath(`/boards/${boardId}`);
  revalidatePath("/boards");
  return db
    .prepare("SELECT * FROM board_items WHERE id = ?")
    .get(id) as BoardItem;
}

export async function removeBoardItem(itemId: string): Promise<void> {
  await requireAuth();
  const db = getDb();
  const item = db
    .prepare("SELECT board_id FROM board_items WHERE id = ?")
    .get(itemId) as { board_id: string } | undefined;
  if (!item) return;

  db.prepare("DELETE FROM board_items WHERE id = ?").run(itemId);
  db.prepare(
    "UPDATE boards SET updated_at = datetime('now') WHERE id = ?"
  ).run(item.board_id);
  revalidatePath(`/boards/${item.board_id}`);
  revalidatePath("/boards");
}

export async function updateBoardItem(
  itemId: string,
  data: { title?: string; content?: string }
): Promise<void> {
  await requireAuth();
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined) {
    sets.push("title = ?");
    values.push(data.title);
  }
  if (data.content !== undefined) {
    sets.push("content = ?");
    values.push(data.content);
  }

  if (sets.length === 0) return;

  values.push(itemId);
  db.prepare(`UPDATE board_items SET ${sets.join(", ")} WHERE id = ?`).run(
    ...values
  );

  const item = db
    .prepare("SELECT board_id FROM board_items WHERE id = ?")
    .get(itemId) as { board_id: string } | undefined;
  if (item) {
    revalidatePath(`/boards/${item.board_id}`);
  }
}

export async function getRecentPosts(limit = 30): Promise<ContentPost[]> {
  await requireAuth();
  const db = getDb();
  return db
    .prepare(
      `SELECT id, post_date, platform, title, creator, status, scope
       FROM content_posts
       ORDER BY post_date DESC, created_at DESC
       LIMIT ?`
    )
    .all(limit) as ContentPost[];
}

export async function getActiveBoards(limit = 3): Promise<BoardWithMeta[]> {
  await requireAuth();
  return queryBoards(getDb(), limit);
}
