"use client";

import { useState, useTransition, useMemo } from "react";
import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import { Instagram, RefreshCw, Clock, Eye, Heart, MessageCircle, Share2 } from "lucide-react";
import { TikTokIcon } from "@/components/icons";
import { TrendBadge } from "@/components/trend-badge";
import { PostScoreboard } from "@/components/post-scoreboard";
import { syncAndSave } from "@/lib/apify";
import type { PlatformSnapshot, GrowthPoint } from "@/lib/apify";
import { pctChange } from "@/lib/format";
import type { SocialPost } from "@/lib/analytics-types";

const GrowthChart = dynamic(
  () => import("@/components/growth-chart").then((m) => m.GrowthChart),
  { ssr: false }
);

// ─── Types ───

interface HistoryEntry {
  recorded_at: string;
  platforms: Record<string, Record<string, number>>;
}

interface Props {
  initialLatest: PlatformSnapshot[];
  initialGrowth: GrowthPoint[];
  initialHistory: HistoryEntry[];
  initialPosts: SocialPost[];
}

// ─── Platform config ───

interface PlatformMetric {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface PlatformConfig {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  followerKey: string;
  followerLabel: string;
  metrics: PlatformMetric[];
  engagementKeys: string[];
  postCount: (m: Record<string, number>) => number;
}

const PLATFORMS: PlatformConfig[] = [
  {
    key: "instagram",
    label: "instagram",
    icon: Instagram,
    color: "#E1306C",
    bgColor: "bg-[#E1306C]/[0.08]",
    followerKey: "followers",
    followerLabel: "followers",
    metrics: [
      { key: "totalViews", label: "reel views", icon: Eye },
      { key: "likes", label: "likes", icon: Heart },
      { key: "comments", label: "comments", icon: MessageCircle },
    ],
    engagementKeys: ["likes", "comments"],
    postCount: (m) => (m.posts ?? 0) + (m.reels ?? 0),
  },
  {
    key: "tiktok",
    label: "tiktok",
    icon: TikTokIcon,
    color: "#000000",
    bgColor: "bg-black/[0.06]",
    followerKey: "followers",
    followerLabel: "followers",
    metrics: [
      { key: "totalViews", label: "views", icon: Eye },
      { key: "likes", label: "likes", icon: Heart },
      { key: "comments", label: "comments", icon: MessageCircle },
      { key: "shares", label: "shares", icon: Share2 },
    ],
    engagementKeys: ["likes", "comments", "shares"],
    postCount: (m) => m.tiktoks ?? 0,
  },
];

// ─── Helpers ───

function timeAgo(isoOrSqlite: string): string {
  const normalized = isoOrSqlite.includes("T")
    ? isoOrSqlite
    : isoOrSqlite.replace(" ", "T") + "Z";
  const diff = Date.now() - new Date(normalized).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Component ───

export function SocialAnalytics({
  initialLatest,
  initialGrowth,
  initialHistory,
  initialPosts,
}: Props) {
  const [latest, setLatest] = useState(initialLatest);
  const [growth, setGrowth] = useState(initialGrowth);
  const [history, setHistory] = useState(initialHistory);
  const [syncing, startSync] = useTransition();
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const byPlatform = useMemo(
    () => new Map(latest.map((s) => [s.platform, s])),
    [latest]
  );

  const lastSyncTime = useMemo(
    () =>
      latest.length > 0
        ? latest.reduce((a, b) => (a.recorded_at > b.recorded_at ? a : b)).recorded_at
        : null,
    [latest]
  );

  const followersByPlatform = useMemo(
    () =>
      Object.fromEntries(
        latest.map((s) => [
          s.platform,
          s.metrics[s.platform === "strava" ? "members" : "followers"] ?? 0,
        ])
      ),
    [latest]
  );

  // Previous sync for trend comparison (apples-to-apples)
  const prevMetrics = useMemo(() => {
    if (history.length < 2) return null;
    return history[1].platforms;
  }, [history]);

  // Hero stat: combined follower count with trend
  const heroStats = useMemo(() => {
    const ig = byPlatform.get("instagram")?.metrics;
    const tt = byPlatform.get("tiktok")?.metrics;
    const totalFollowers = (ig?.followers ?? 0) + (tt?.followers ?? 0);

    const prevIG = prevMetrics?.instagram;
    const prevTT = prevMetrics?.tiktok;
    const prevFollowers = (prevIG?.followers ?? 0) + (prevTT?.followers ?? 0);

    return {
      totalFollowers,
      followersTrend: pctChange(totalFollowers, prevFollowers),
    };
  }, [byPlatform, prevMetrics]);

  function handleSync() {
    setSyncResult(null);
    startSync(async () => {
      const result = await syncAndSave();
      const count = (result.ig ? 1 : 0) + (result.tt ? 1 : 0);
      setSyncResult(
        count > 0
          ? `synced ${count} platform${count !== 1 ? "s" : ""}${result.error ? ` (${result.error})` : ""}`
          : result.error ?? "no data returned"
      );

      const now = new Date().toISOString().replace("T", " ").slice(0, 19);
      const newLatest = [...latest];
      if (result.ig) {
        const idx = newLatest.findIndex((s) => s.platform === "instagram");
        const snap = { platform: "instagram", metrics: result.ig as Record<string, number>, recorded_at: now };
        if (idx >= 0) newLatest[idx] = snap;
        else newLatest.push(snap);
      }
      if (result.tt) {
        const idx = newLatest.findIndex((s) => s.platform === "tiktok");
        const snap = { platform: "tiktok", metrics: result.tt as Record<string, number>, recorded_at: now };
        if (idx >= 0) newLatest[idx] = snap;
        else newLatest.push(snap);
      }
      setLatest(newLatest);

      const today = new Date().toISOString().slice(0, 10);
      const newPoint: GrowthPoint = { date: today };
      if (result.ig) newPoint.instagram = result.ig.followers;
      if (result.tt) newPoint.tiktok = result.tt.followers;
      setGrowth((prev) => {
        const existing = prev.findIndex((p) => p.date === today);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], ...newPoint };
          return updated;
        }
        return [...prev, newPoint];
      });

      setTimeout(() => setSyncResult(null), 4000);
    });
  }


  return (
    <div className="space-y-6">
      {/* ─── Sync controls ─── */}
      <div
        className="animate-fade-up motion-reduce:animate-none flex items-center justify-between"
        style={{ animationDelay: "0ms", animationFillMode: "both" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2.5 font-display text-xs tracking-wide text-white transition-all hover:-translate-y-0.5 hover:bg-navy-light disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "syncing\u2026" : "sync from apify"}
          </button>
          {syncResult && (
            <span className="animate-pop-in text-xs text-emerald-600">{syncResult}</span>
          )}
        </div>
        {lastSyncTime && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground/50">
            <Clock className="h-3 w-3" />
            {timeAgo(lastSyncTime)}
          </span>
        )}
      </div>

      {/* ─── Hero stat ─── */}
      <div
        className="animate-fade-up motion-reduce:animate-none relative overflow-hidden rounded-2xl bg-navy text-white"
        style={{ animationDelay: "100ms", animationFillMode: "both" }}
      >
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
        <div className="absolute right-6 top-10 h-10 w-10 rounded-full bg-white/[0.03]" />
        <div className="relative flex items-center justify-between px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-medium text-white/50 sm:text-xs">
              neighbors
            </p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <p className="font-stat text-4xl tracking-wide text-white sm:text-5xl">
                {heroStats.totalFollowers.toLocaleString()}
              </p>
              {heroStats.followersTrend !== 0 && (
                <TrendBadge value={heroStats.followersTrend} className="bg-white/10 text-white" />
              )}
            </div>
          </div>
          <p className="text-[10px] text-white/30 sm:text-xs sm:text-white/40">
            ig + tiktok followers
          </p>
        </div>
      </div>

      {/* ─── Platform cards ─── */}
      <div
        className="animate-fade-up motion-reduce:animate-none"
        style={{ animationDelay: "350ms", animationFillMode: "both" }}
      >
        <h2 className="mb-4 font-display text-sm font-medium uppercase tracking-widest text-muted-foreground">
          by platform
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {PLATFORMS.map((p) => {
            const snap = byPlatform.get(p.key);
            const metrics = snap?.metrics ?? {};
            const followers = metrics[p.followerKey] ?? 0;
            const Icon = p.icon;

            const prevFollowers = prevMetrics?.[p.key]?.[p.followerKey] ?? 0;
            const followerTrend = pctChange(followers, prevFollowers);

            const engagementSum = p.engagementKeys.reduce(
              (sum, k) => sum + (metrics[k] ?? 0),
              0
            );
            const posts = p.postCount(metrics);
            const engagementRate =
              followers > 0 && posts > 0
                ? ((engagementSum / posts) / followers) * 100
                : 0;

            return (
              <div
                key={p.key}
                className="group overflow-hidden rounded-2xl border-0 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
              >
                {/* Top accent */}
                <div className="h-[3px]" style={{ backgroundColor: p.color }} />

                {/* Header + follower count */}
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${p.bgColor}`}
                        style={{ color: p.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-display text-sm tracking-tight text-navy/70">
                        {p.label}
                      </span>
                    </div>
                    {followerTrend !== 0 && <TrendBadge value={followerTrend} />}
                  </div>

                  <p className="mt-3 font-stat text-4xl leading-none tracking-wide text-navy sm:text-5xl">
                    {followers.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/50">
                    {p.followerLabel}
                  </p>
                </div>

                {/* Engagement rate — featured */}
                {engagementRate > 0 && (
                  <div className="border-t border-border/30 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground">
                          avg post eng rate
                        </span>
                        <p className="text-[10px] text-muted-foreground/40">
                          ({p.engagementKeys.join(" + ")}) / posts / followers
                        </p>
                      </div>
                      <span className="font-stat text-2xl tracking-wide text-navy">
                        {engagementRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Metrics — compact grid */}
                {p.metrics.length > 0 && (
                  <div className="border-t border-border/30 px-5 py-4">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {p.metrics.map((m) => {
                        const val = metrics[m.key] ?? 0;
                        const prevVal = prevMetrics?.[p.key]?.[m.key] ?? 0;
                        const trend = pctChange(val, prevVal);
                        const MetricIcon = m.icon;
                        return (
                          <div key={m.key}>
                            <div className="flex items-center gap-1.5">
                              <MetricIcon className="h-3 w-3 text-muted-foreground/40" />
                              <span className="text-[11px] text-muted-foreground/60">
                                {m.label}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-baseline gap-1.5">
                              <span className="font-stat text-lg leading-none tracking-wide text-navy">
                                {val.toLocaleString()}
                              </span>
                              {trend !== 0 && <TrendBadge value={trend} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Post scoreboard ─── */}
      {initialPosts.length > 0 && (
        <PostScoreboard posts={initialPosts} followers={followersByPlatform} />
      )}

      {/* ─── Growth chart (dynamically loaded) ─── */}
      {growth.length > 1 && <GrowthChart data={growth} />}

      {/* ─── Sync history ─── */}
      {history.length > 0 && (
        <div
          className="animate-fade-up motion-reduce:animate-none"
          style={{ animationDelay: "550ms", animationFillMode: "both" }}
        >
          <h2 className="mb-3 font-display text-sm uppercase tracking-widest text-muted-foreground">
            sync history
          </h2>
          <div className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
            <div className="divide-y divide-border/30">
              {history.slice(0, 8).map((entry, i) => {
                const ig = entry.platforms.instagram;
                const tt = entry.platforms.tiktok;

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <span className="text-xs text-muted-foreground/50">
                      {timeAgo(entry.recorded_at)}
                    </span>
                    <div className="flex items-center gap-4">
                      {ig && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: "#E1306C" }}
                          />
                          {(ig.followers ?? 0).toLocaleString()}
                        </span>
                      )}
                      {tt && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-black" />
                          {(tt.followers ?? tt.fans ?? 0).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
