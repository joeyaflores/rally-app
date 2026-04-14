"use client";

import { useState, useMemo } from "react";
import {
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Instagram,
  ExternalLink,
  ChevronDown,
  Play,
} from "lucide-react";
import { TikTokIcon } from "@/components/icons";
import { formatDate, interactions } from "@/lib/format";
import type { SocialPost } from "@/lib/analytics-types";

// ─── Types ───

type PlatformFilter = "all" | "instagram" | "tiktok";

// ─── Constants ───

const PLATFORM_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string }
> = {
  instagram: { icon: Instagram, color: "#E1306C" },
  tiktok: { icon: TikTokIcon, color: "#000000" },
};

const FILTERS: PlatformFilter[] = ["all", "instagram", "tiktok"];

// ─── Helpers ───

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isVideo(post: SocialPost): boolean {
  const t = post.post_type.toLowerCase();
  return t === "video" || t === "reel" || post.duration > 0;
}

function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  (e.target as HTMLImageElement).style.display = "none";
}

function thumbSrc(post: SocialPost): string {
  if (!post.thumbnail_url) return "";
  return `/api/img/${post.id}`;
}

// ─── Top Performer ───

function TopPerformer({ post, followers }: { post: SocialPost; followers: Record<string, number> }) {
  const platform = PLATFORM_META[post.platform];
  const Icon = platform?.icon;
  const total = interactions(post);
  const platFollowers = followers[post.platform] ?? 0;
  const engRate =
    post.views > 0 ? ((total / post.views) * 100).toFixed(1) : null;
  const likeRate =
    !engRate && platFollowers > 0
      ? ((post.likes / platFollowers) * 100).toFixed(1)
      : null;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-navy shadow-lg">
      {/* Warm accent bar */}
      <div className="absolute bottom-0 left-0 top-0 z-10 w-1 bg-white/20" />

      <div className="relative flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <div
          className="relative aspect-[4/3] w-full shrink-0 overflow-hidden sm:aspect-auto sm:w-52 md:w-60"
          style={{
            background: `linear-gradient(135deg, ${platform?.color ?? "#29741d"}20, ${platform?.color ?? "#29741d"}40)`,
          }}
        >
          {post.thumbnail_url && (
            <img
              src={thumbSrc(post)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={hideOnError}
            />
          )}

          {/* #1 badge */}
          <div className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
            <span className="font-stat text-lg leading-none text-navy">
              1
            </span>
          </div>

          {/* Platform + date */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
            {Icon && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm">
                <Icon
                  className="h-3 w-3"
                  style={{ color: platform.color }}
                />
              </div>
            )}
            {post.posted_at && (
              <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                {formatDate(post.posted_at)}
              </span>
            )}
          </div>

          {/* Duration badge */}
          {isVideo(post) && post.duration > 0 && (
            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-sm">
              <Play className="h-2.5 w-2.5 text-white" fill="white" />
              <span className="text-[10px] font-medium text-white">
                {formatDuration(post.duration)}
              </span>
            </div>
          )}

          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Stats + details */}
        <div className="relative flex flex-1 flex-col p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {post.views > 0 && (
              <div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 text-white/30" />
                  <p className="text-[10px] font-medium text-white/40">
                    views
                  </p>
                </div>
                <p className="font-stat text-2xl tracking-wide text-white sm:text-3xl">
                  {post.views.toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-white/30" />
                <p className="text-[10px] font-medium text-white/40">likes</p>
              </div>
              <p className="font-stat text-2xl tracking-wide text-white sm:text-3xl">
                {post.likes.toLocaleString()}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3 text-white/30" />
                <p className="text-[10px] font-medium text-white/40">
                  comments
                </p>
              </div>
              <p className="font-stat text-2xl tracking-wide text-white sm:text-3xl">
                {post.comments.toLocaleString()}
              </p>
            </div>
            {post.shares > 0 && (
              <div>
                <div className="flex items-center gap-1">
                  <Share2 className="h-3 w-3 text-white/30" />
                  <p className="text-[10px] font-medium text-white/40">
                    shares
                  </p>
                </div>
                <p className="font-stat text-2xl tracking-wide text-white sm:text-3xl">
                  {post.shares.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Engagement / like rate */}
          {(engRate || likeRate) && (
            <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-white/10 px-3 py-1">
              <span className="text-[10px] text-white/50">
                {engRate ? "eng rate" : "like rate"}
              </span>
              <span className="font-stat text-sm tracking-wide text-white">
                {engRate ?? likeRate}%
              </span>
            </div>
          )}

          {/* Caption */}
          {post.caption && (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/60">
              {post.caption}
            </p>
          )}

          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.hashtags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[10px] text-white/40"
                >
                  #{tag}
                </span>
              ))}
              {post.hashtags.length > 6 && (
                <span className="text-[10px] text-white/25">
                  +{post.hashtags.length - 6}
                </span>
              )}
            </div>
          )}

          {/* Link */}
          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 self-start text-xs text-white/40 transition-colors hover:text-white/70"
            >
              view post <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/[0.03]" />
      <div className="pointer-events-none absolute right-10 top-20 h-16 w-16 rounded-full bg-white/[0.02]" />
    </div>
  );
}

// ─── Post Cell ───

function PostCell({
  post,
  rank,
  expanded,
  onToggle,
  delay,
  followers,
}: {
  post: SocialPost;
  rank: number;
  expanded: boolean;
  onToggle: () => void;
  delay: number;
  followers: Record<string, number>;
}) {
  const platform = PLATFORM_META[post.platform];
  const Icon = platform?.icon;
  const platFollowers = followers[post.platform] ?? 0;

  return (
    <div
      className="animate-fade-up motion-reduce:animate-none"
      style={{
        animationDelay: `${500 + delay * 60}ms`,
        animationFillMode: "both",
      }}
    >
      <div
        className={`group overflow-hidden rounded-2xl bg-white transition-all duration-200 hover:-translate-y-0.5 ${
          expanded ? "shadow-md" : "shadow-sm"
        }`}
      >
        {/* Clickable area */}
        <button
          onClick={onToggle}
          className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy/30"
        >
          {/* Thumbnail */}
          <div
            className="relative aspect-[4/5] overflow-hidden"
            style={{
              background: `linear-gradient(145deg, ${platform?.color ?? "#29741d"}12, ${platform?.color ?? "#29741d"}28)`,
            }}
          >
            {post.thumbnail_url && (
              <img
                src={thumbSrc(post)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={hideOnError}
              />
            )}

            {/* Dark gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Stats overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="font-stat text-2xl leading-none tracking-wide text-white">
                {post.views > 0
                  ? post.views.toLocaleString()
                  : post.likes.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-white/50">
                {post.views > 0 ? "views" : "likes"}
              </p>
              <div className="mt-1.5 flex items-center gap-3">
                {post.views > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-white/60">
                    <Heart className="h-2.5 w-2.5" />
                    {post.likes.toLocaleString()}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[10px] text-white/60">
                  <MessageCircle className="h-2.5 w-2.5" />
                  {post.comments.toLocaleString()}
                </span>
                {post.shares > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-white/60">
                    <Share2 className="h-2.5 w-2.5" />
                    {post.shares.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Platform badge + rank */}
            <div className="absolute left-2.5 right-2.5 top-2.5 flex items-center justify-between">
              {Icon && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm">
                  <Icon
                    className="h-2.5 w-2.5"
                    style={{ color: platform.color }}
                  />
                </div>
              )}
              <span className="font-stat text-sm leading-none text-white/40">
                {rank}
              </span>
            </div>

            {/* Duration badge */}
            {isVideo(post) && post.duration > 0 && (
              <div className="absolute bottom-14 right-2.5 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">
                <Play className="h-2 w-2 text-white" fill="white" />
                <span className="text-[9px] font-medium text-white">
                  {formatDuration(post.duration)}
                </span>
              </div>
            )}
          </div>

          {/* Date + chevron */}
          <div className="flex items-center justify-between px-3 py-2.5">
            {post.posted_at ? (
              <span className="text-[10px] text-muted-foreground/50">
                {formatDate(post.posted_at)}
              </span>
            ) : (
              <span />
            )}
            <ChevronDown
              className={`h-3 w-3 text-muted-foreground/30 transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Expandable detail panel */}
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="border-t border-border/30 px-3 pb-3 pt-2.5">
              {/* Caption */}
              {post.caption && (
                <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground/70">
                  {post.caption}
                </p>
              )}

              {/* Hashtags */}
              {post.hashtags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {post.hashtags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                  {post.hashtags.length > 5 && (
                    <span className="px-1 text-[10px] text-muted-foreground/40">
                      +{post.hashtags.length - 5}
                    </span>
                  )}
                </div>
              )}

              {/* Engagement / like rate */}
              {post.views > 0 ? (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary/70 px-2 py-0.5">
                  <span className="text-[10px] text-muted-foreground/50">
                    eng rate
                  </span>
                  <span className="font-stat text-xs tracking-wide text-navy">
                    {((interactions(post) / post.views) * 100).toFixed(1)}%
                  </span>
                </div>
              ) : platFollowers > 0 ? (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary/70 px-2 py-0.5">
                  <span className="text-[10px] text-muted-foreground/50">
                    like rate
                  </span>
                  <span className="font-stat text-xs tracking-wide text-navy">
                    {((post.likes / platFollowers) * 100).toFixed(1)}%
                  </span>
                </div>
              ) : null}

              {/* Link */}
              {post.url && (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 inline-flex items-center gap-1 text-[10px] text-navy/40 transition-colors hover:text-navy"
                >
                  view post <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───

export function PostScoreboard({ posts, followers }: { posts: SocialPost[]; followers: Record<string, number> }) {
  const [filter, setFilter] = useState<PlatformFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const filtered =
      filter === "all"
        ? posts
        : posts.filter((p) => p.platform === filter);
    return [...filtered].sort(
      (a, b) => interactions(b) - interactions(a)
    );
  }, [posts, filter]);

  if (posts.length === 0) return null;

  return (
    <div
      className="animate-fade-up motion-reduce:animate-none"
      style={{ animationDelay: "450ms", animationFillMode: "both" }}
    >
      {/* Header + filter pills */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-medium uppercase tracking-widest text-muted-foreground">
          what&apos;s hitting
        </h2>
        <div className="flex gap-1.5">
          {FILTERS.map((key) => (
            <button
              key={key}
              onClick={() => {
                setFilter(key);
                setExpandedId(null);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                filter === key
                  ? "bg-navy text-white"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground/40">
          no {filter} posts yet
        </p>
      ) : (
        <>
          {/* Top performer spotlight */}
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
            top performer — most interactions
          </p>
          <TopPerformer post={sorted[0]} followers={followers} />

          {/* Grid */}
          {sorted.length > 1 && (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {sorted.slice(1).map((post, i) => (
                <PostCell
                  key={post.id}
                  post={post}
                  rank={i + 2}
                  expanded={expandedId === post.id}
                  onToggle={() =>
                    setExpandedId((prev) =>
                      prev === post.id ? null : post.id
                    )
                  }
                  delay={i}
                  followers={followers}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
