"use server";

import * as Sentry from "@sentry/nextjs";
import { ApifyClient } from "apify-client";
import { getDb } from "./db";
import { requireAuth } from "./require-auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import type { IGMetrics, TTMetrics, SocialPost } from "./analytics-types";
import { log } from "./log";
import { safeAction } from "./safe-action";
import config from "@rally";

function getClient() {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN not set");
  return new ApifyClient({ token });
}

// ─── Instagram ───

interface IGProfileResult {
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
}

/** Shared shape for posts from both profile scraper (latestPosts) and post scraper. */
interface IGPost {
  id?: string;
  shortCode?: string;
  url?: string;
  caption?: string;
  displayUrl?: string;
  type?: string;
  productType?: string;
  timestamp?: string;
  likesCount?: number;
  commentsCount?: number;
  videoViewCount?: number;
  videoPlayCount?: number;
  videoDuration?: number;
  locationName?: string;
  hashtags?: string[];
  mentions?: string[];
  dimensionsHeight?: number;
  dimensionsWidth?: number;
  latestComments?: Array<{
    text?: string;
    timestamp?: string;
    likesCount?: number;
    ownerUsername?: string;
    owner?: { username?: string };
  }>;
}

export async function scrapeInstagram(
  username = config.scrapeHandles.instagram
): Promise<Partial<IGMetrics> | null> {
  await requireAuth();
  const client = getClient();

  // Profile scraper (follower count) + post scraper (accurate post data) in parallel
  const [profileRun, postRun] = await Promise.all([
    client.actor("apify/instagram-profile-scraper").call(
      { usernames: [username] },
      { timeout: 120 }
    ),
    client.actor("apify/instagram-post-scraper").call(
      { username: [username], resultsLimit: 50, onlyPostsNewerThan: "60 days" },
      { timeout: 180 }
    ).catch((err) => {
      log.error("IG post scraper failed", err, { action: "scrapeInstagram" });
      return null;
    }),
  ]);

  const { items: profileItems } = await client.dataset(profileRun.defaultDatasetId).listItems();
  if (profileItems.length === 0) return null;
  const profile = profileItems[0] as IGProfileResult;

  // Use dedicated post scraper results (50 posts), or fall back to profile's latestPosts (~12)
  let posts: IGPost[];
  if (postRun) {
    const { items } = await client.dataset(postRun.defaultDatasetId).listItems();
    posts = items as IGPost[];
  } else {
    const profileFull = profileItems[0] as IGProfileResult & { latestPosts?: IGPost[] };
    posts = profileFull.latestPosts ?? [];
  }

  // Aggregate engagement from recent posts (last ~30 days)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString();

  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let postCount = 0;
  let reelCount = 0;

  for (const post of posts) {
    if (post.timestamp && post.timestamp < cutoffStr) continue;

    totalViews += post.videoPlayCount || post.videoViewCount || 0;
    totalLikes += post.likesCount || 0;
    totalComments += post.commentsCount || 0;
    postCount++;
    if (post.type === "Video" || post.type === "Reel" || post.productType === "reels") reelCount++;
  }

  // ─── Save individual posts ───
  const db = getDb();
  const upsertPost = db.prepare(
    `INSERT INTO social_posts (id, platform, external_id, url, caption, thumbnail_url, post_type, hashtags, mentions, latest_comments, posted_at, views, likes, comments, shares, duration, location, music, dimensions_height, dimensions_width, scraped_at)
     VALUES (?, 'instagram', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, '', ?, ?, datetime('now'))
     ON CONFLICT(platform, external_id) DO UPDATE SET
       views = excluded.views, likes = excluded.likes, comments = excluded.comments,
       caption = excluded.caption, thumbnail_url = excluded.thumbnail_url,
       latest_comments = excluded.latest_comments, scraped_at = excluded.scraped_at`
  );
  try {
    db.transaction(() => {
      for (const post of posts) {
        const externalId = post.shortCode || post.id || "";
        if (!externalId) continue;
        // Normalize comments to a compact shape
        const comments = (post.latestComments || []).slice(0, 5).map((c) => ({
          username: c.ownerUsername || c.owner?.username || "",
          text: c.text || "",
          likesCount: c.likesCount || 0,
          timestamp: c.timestamp || "",
        }));
        upsertPost.run(
          crypto.randomUUID(),
          externalId,
          post.url || (post.shortCode ? `https://www.instagram.com/p/${post.shortCode}/` : ""),
          post.caption || "",
          post.displayUrl || "",
          post.type || post.productType || "",
          JSON.stringify(post.hashtags || []),
          JSON.stringify(post.mentions || []),
          JSON.stringify(comments),
          post.timestamp || "",
          post.videoPlayCount || post.videoViewCount || 0,
          post.likesCount || 0,
          post.commentsCount || 0,
          post.videoDuration || 0,
          post.locationName || "",
          post.dimensionsHeight || 0,
          post.dimensionsWidth || 0,
        );
      }
    })();
  } catch (err) {
    log.error("Failed to save IG posts", err, { action: "scrapeInstagram" });
  }

  return {
    followers: profile.followersCount ?? 0,
    posts: postCount - reelCount,
    reels: reelCount,
    totalViews,
    likes: totalLikes,
    comments: totalComments,
    // These can't be scraped — private Instagram Insights only
    // Admin fills these in manually
    viewsFromFollowers: 0,
    viewsFromNonFollowers: 0,
    accountsReached: 0,
    profileVisits: 0,
    externalLinkTaps: 0,
    saves: 0,
    shares: 0,
    reposts: 0,
  };
}

// ─── TikTok ───

// Clockworks TikTok profile scraper returns individual video items.
// Profile stats live in authorMeta of each video.
interface TTVideoResult {
  authorMeta?: {
    fans?: number;
    heart?: number;
    video?: number;
  };
  playCount?: number;
  diggCount?: number;
  commentCount?: number;
  shareCount?: number;
  createTime?: number;
  createTimeISO?: string;
  // Post-level fields
  id?: string;
  text?: string;
  desc?: string;
  webVideoUrl?: string;
  covers?: string[];
  videoMeta?: {
    coverUrl?: string;
    duration?: number;
    height?: number;
    width?: number;
  };
  hashtags?: Array<{ id?: string; name?: string }>;
  mentions?: Array<{ id?: string; secUid?: string }>;
  musicMeta?: {
    musicName?: string;
    musicAuthor?: string;
    musicId?: string;
  };
}

export async function scrapeTikTok(
  username = config.scrapeHandles.tiktok
): Promise<Partial<TTMetrics> | null> {
  await requireAuth();
  const client = getClient();

  const run = await client.actor("clockworks/tiktok-profile-scraper").call(
    { profiles: [username], resultsPerPage: 30 },
    { timeout: 120 }
  );

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  if (items.length === 0) return null;

  const videos = items as TTVideoResult[];

  // Profile stats from first video's authorMeta
  const author = videos[0]?.authorMeta;
  const followers = author?.fans ?? 0;
  const videoCount = author?.video ?? 0;

  // Aggregate recent video metrics (last 30 days)
  const cutoff = Math.floor(Date.now() / 1000) - 30 * 86400;

  let totalViews = 0;
  let monthLikes = 0;
  let monthComments = 0;
  let monthShares = 0;
  let monthTiktoks = 0;

  for (const video of videos) {
    if (video.createTime && video.createTime < cutoff) continue;
    totalViews += video.playCount ?? 0;
    monthLikes += video.diggCount ?? 0;
    monthComments += video.commentCount ?? 0;
    monthShares += video.shareCount ?? 0;
    monthTiktoks++;
  }

  // ─── Save individual videos ───
  const db = getDb();
  const upsertPost = db.prepare(
    `INSERT INTO social_posts (id, platform, external_id, url, caption, thumbnail_url, post_type, hashtags, mentions, posted_at, views, likes, comments, shares, duration, location, music, dimensions_height, dimensions_width, scraped_at)
     VALUES (?, 'tiktok', ?, ?, ?, ?, 'video', ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, datetime('now'))
     ON CONFLICT(platform, external_id) DO UPDATE SET
       views = excluded.views, likes = excluded.likes, comments = excluded.comments, shares = excluded.shares,
       caption = excluded.caption, thumbnail_url = excluded.thumbnail_url, scraped_at = excluded.scraped_at`
  );
  try {
    db.transaction(() => {
      for (const video of videos) {
        const externalId = video.id || "";
        if (!externalId) continue;
        const caption = video.text || video.desc || "";
        const thumbnail = video.videoMeta?.coverUrl || (video.covers?.[0] ?? "");
        const hashtags = (video.hashtags || []).map((h) => h.name || "").filter(Boolean);
        const mentions = (video.mentions || []).map((m) => m.id || "").filter(Boolean);
        const musicStr = video.musicMeta
          ? [video.musicMeta.musicName, video.musicMeta.musicAuthor].filter(Boolean).join(" – ")
          : "";
        const postedAt = video.createTimeISO
          || (video.createTime ? new Date(video.createTime * 1000).toISOString() : "");
        upsertPost.run(
          crypto.randomUUID(),
          externalId,
          video.webVideoUrl || "",
          caption,
          thumbnail,
          JSON.stringify(hashtags),
          JSON.stringify(mentions),
          postedAt,
          video.playCount || 0,
          video.diggCount || 0,
          video.commentCount || 0,
          video.shareCount || 0,
          video.videoMeta?.duration || 0,
          musicStr,
          video.videoMeta?.height || 0,
          video.videoMeta?.width || 0,
        );
      }
    })();
  } catch (err) {
    log.error("Failed to save TT posts", err, { action: "scrapeTikTok" });
  }

  return {
    followers,
    tiktoks: monthTiktoks || videoCount,
    totalViews,
    // profileViews is private — admin fills manually
    profileViews: 0,
    likes: monthLikes,
    comments: monthComments,
    shares: monthShares,
  };
}

// ─── Combined sync & save ───

export interface SyncResult {
  ig: Partial<IGMetrics> | null;
  tt: Partial<TTMetrics> | null;
  error?: string;
}

/** Scrape both platforms and save results to platform_metrics + metric_snapshots. */
export async function syncAndSave(): Promise<SyncResult> {
  return safeAction("syncAndSave", async () => {
  await requireAuth();
  log.info("Apify sync started", { action: "syncAndSave" });

  const errors: string[] = [];
  const [ig, tt] = await Promise.all([
    scrapeInstagram().catch((err) => {
      Sentry.captureException(err, { tags: { action: "scrapeInstagram" } });
      log.error("IG scrape failed", err, { action: "syncAndSave" });
      errors.push(`IG: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }),
    scrapeTikTok().catch((err) => {
      Sentry.captureException(err, { tags: { action: "scrapeTikTok" } });
      log.error("TT scrape failed", err, { action: "syncAndSave" });
      errors.push(`TT: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }),
  ]);

  // Persist to DB
  const db = getDb();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const upsert = db.prepare(
    `INSERT INTO platform_metrics (id, platform, year, month, metrics, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(platform, year, month)
     DO UPDATE SET metrics = excluded.metrics, updated_at = datetime('now')`
  );
  const snap = db.prepare(
    `INSERT INTO metric_snapshots (id, platform, year, month, metrics, recorded_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`
  );

  const tx = db.transaction(() => {
    for (const [platform, data] of [["instagram", ig], ["tiktok", tt]] as const) {
      if (!data) continue;
      const json = JSON.stringify(data);
      upsert.run(crypto.randomUUID(), platform, year, month, json);
      snap.run(crypto.randomUUID(), platform, year, month, json);
    }
  });
  tx();

  revalidatePath("/");
  revalidatePath("/analytics");
  revalidatePath("/admin");

  log.info("Apify sync complete", {
    action: "syncAndSave",
    ig: ig ? "ok" : "failed",
    tt: tt ? "ok" : "failed",
  });

  return {
    ig,
    tt,
    error: errors.length > 0 ? errors.join("; ") : undefined,
  };
  });
}

/** Alias for backward compatibility with admin analytics editor. */
export async function syncFromApify(): Promise<SyncResult> {
  return syncAndSave();
}

// ─── Query functions for analytics page ───

export interface PlatformSnapshot {
  platform: string;
  metrics: Record<string, number>;
  recorded_at: string;
}

export interface GrowthPoint {
  date: string;
  instagram?: number;
  tiktok?: number;
  strava?: number;
}

/** Get the most recent snapshot per platform. */
export async function getLatestSnapshots(): Promise<PlatformSnapshot[]> {
  await requireAuth();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT s.platform, s.metrics, s.recorded_at
       FROM metric_snapshots s
       INNER JOIN (
         SELECT platform, MAX(recorded_at) as max_ts
         FROM metric_snapshots
         GROUP BY platform
       ) latest ON s.platform = latest.platform AND s.recorded_at = latest.max_ts`
    )
    .all() as { platform: string; metrics: string; recorded_at: string }[];

  return rows.map((r) => ({
    platform: r.platform,
    metrics: JSON.parse(r.metrics),
    recorded_at: r.recorded_at,
  }));
}

/** Get follower counts over time for the growth chart. */
export async function getGrowthHistory(): Promise<GrowthPoint[]> {
  await requireAuth();
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  const rows = db
    .prepare(
      `SELECT platform, metrics, recorded_at
       FROM metric_snapshots
       WHERE recorded_at >= ?
       ORDER BY recorded_at ASC`
    )
    .all(cutoffDate) as { platform: string; metrics: string; recorded_at: string }[];

  // Group by date, extract follower/member counts
  const dateMap = new Map<string, GrowthPoint>();
  for (const row of rows) {
    const date = row.recorded_at.split(" ")[0]; // YYYY-MM-DD
    const m = JSON.parse(row.metrics);
    if (!dateMap.has(date)) dateMap.set(date, { date });
    const point = dateMap.get(date)!;

    if (row.platform === "instagram") point.instagram = m.followers;
    if (row.platform === "tiktok") point.tiktok = m.followers ?? m.fans;
    if (row.platform === "strava") point.strava = m.members;
  }

  return Array.from(dateMap.values());
}

// Keys the client needs for trend comparison (oldest entry)
const TREND_KEYS = new Set(["followers", "members", "fans", "totalViews", "likes", "comments", "shares"]);
// Keys the client needs for the sync history table (all entries)
const TABLE_KEYS = new Set(["followers", "members", "fans"]);

function pickKeys(metrics: Record<string, number>, keys: Set<string>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of keys) {
    if (k in metrics) out[k] = metrics[k];
  }
  return out;
}

/** Get snapshots for trend comparison + history table, trimmed to only the fields the client uses. */
export async function getSnapshotHistory(
  limit = 20
): Promise<{ recorded_at: string; platforms: Record<string, Record<string, number>> }[]> {
  await requireAuth();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT platform, metrics, recorded_at
       FROM metric_snapshots
       ORDER BY recorded_at DESC
       LIMIT ?`
    )
    .all(limit * 3) as { platform: string; metrics: string; recorded_at: string }[]; // 3 platforms per sync

  // Group by recorded_at timestamp
  const groups = new Map<string, Record<string, Record<string, number>>>();
  for (const row of rows) {
    const ts = row.recorded_at;
    if (!groups.has(ts)) groups.set(ts, {});
    groups.get(ts)![row.platform] = JSON.parse(row.metrics);
  }

  const entries = Array.from(groups.entries())
    .map(([recorded_at, platforms]) => ({ recorded_at, platforms }))
    .slice(0, limit);

  // Trim: oldest entry keeps trend keys (used for % change), rest keep only table keys
  for (let i = 0; i < entries.length; i++) {
    const keys = i === entries.length - 1 ? TREND_KEYS : TABLE_KEYS;
    const platforms = entries[i].platforms;
    for (const p of Object.keys(platforms)) {
      platforms[p] = pickKeys(platforms[p], keys);
    }
  }

  return entries;
}

// ─── Post-level queries ───

/** Get recent scraped posts, optionally filtered by platform. */
export async function getRecentPosts(
  platform?: string,
  limit = 20
): Promise<SocialPost[]> {
  await requireAuth();
  const db = getDb();

  const rows = platform
    ? db.prepare(
        `SELECT * FROM social_posts WHERE platform = ? ORDER BY posted_at DESC LIMIT ?`
      ).all(platform, limit)
    : db.prepare(
        `SELECT * FROM social_posts ORDER BY posted_at DESC LIMIT ?`
      ).all(limit);

  return (rows as Record<string, unknown>[]).map((r) => ({
    ...(r as unknown as SocialPost),
    hashtags: JSON.parse(r.hashtags as string),
    mentions: JSON.parse(r.mentions as string),
    latest_comments: JSON.parse((r.latest_comments as string) || "[]"),
  }));
}
