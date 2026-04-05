"use server";

import { getDb } from "./db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { requireAuth } from "./require-auth";
import type { ContentPost, Platform, PostStatus, PostScope } from "./calendar-types";

export async function getMonthPosts(
  year: number,
  month: number
): Promise<ContentPost[]> {
  await requireAuth();
  const db = getDb();

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  return db
    .prepare(
      `SELECT id, post_date, platform, title, body, caption, creator, status, scope, created_at, updated_at
       FROM content_posts
       WHERE post_date >= ? AND post_date < ?
       ORDER BY created_at`
    )
    .all(startDate, endDate) as ContentPost[];
}

export async function createPost(
  postDate: string,
  platform: Platform,
  title: string,
  status: PostStatus = "idea",
  options?: { body?: string; caption?: string; creator?: string; scope?: PostScope }
): Promise<ContentPost> {
  await requireAuth();
  const db = getDb();
  const id = crypto.randomUUID();

  db.prepare(
    `INSERT INTO content_posts (id, post_date, platform, title, content, status, body, caption, creator, scope)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, postDate, platform, title, title, status, options?.body ?? "", options?.caption ?? "", options?.creator ?? "", options?.scope ?? "club");

  revalidatePath("/calendar");
  revalidatePath("/");
  return db
    .prepare("SELECT id, post_date, platform, title, body, caption, creator, status, scope, created_at, updated_at FROM content_posts WHERE id = ?")
    .get(id) as ContentPost;
}

export async function updatePost(
  id: string,
  data: {
    title?: string;
    body?: string;
    caption?: string;
    creator?: string;
    platform?: Platform;
    status?: PostStatus;
    scope?: PostScope;
    post_date?: string;
  }
): Promise<void> {
  await requireAuth();
  const db = getDb();
  const sets: string[] = ["updated_at = datetime('now')"];
  const values: unknown[] = [];

  if (data.title !== undefined) {
    sets.push("title = ?", "content = ?");
    values.push(data.title, data.title);
  }
  if (data.body !== undefined) {
    sets.push("body = ?");
    values.push(data.body);
  }
  if (data.caption !== undefined) {
    sets.push("caption = ?");
    values.push(data.caption);
  }
  if (data.creator !== undefined) {
    sets.push("creator = ?");
    values.push(data.creator);
  }
  if (data.platform !== undefined) {
    sets.push("platform = ?");
    values.push(data.platform);
  }
  if (data.status !== undefined) {
    sets.push("status = ?");
    values.push(data.status);
  }
  if (data.scope !== undefined) {
    sets.push("scope = ?");
    values.push(data.scope);
  }
  if (data.post_date !== undefined) {
    sets.push("post_date = ?");
    values.push(data.post_date);
  }

  values.push(id);
  db.prepare(
    `UPDATE content_posts SET ${sets.join(", ")} WHERE id = ?`
  ).run(...values);
  revalidatePath("/calendar");
  revalidatePath("/");
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getThisWeekPosts(): Promise<ContentPost[]> {
  await requireAuth();
  const db = getDb();

  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + 7);

  return db
    .prepare(
      `SELECT id, post_date, platform, title, body, caption, creator, status, scope, created_at, updated_at
       FROM content_posts
       WHERE post_date >= ? AND post_date < ? AND scope = 'club'
       ORDER BY post_date, created_at`
    )
    .all(toIso(now), toIso(end)) as ContentPost[];
}

export async function deletePost(id: string): Promise<void> {
  await requireAuth();
  const db = getDb();
  db.prepare("DELETE FROM content_posts WHERE id = ?").run(id);
  revalidatePath("/calendar");
  revalidatePath("/");
}
