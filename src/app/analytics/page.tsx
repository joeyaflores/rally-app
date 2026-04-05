import { Suspense } from "react";
import { requireAuth } from "@/lib/require-auth";
import { getLatestSnapshots, getGrowthHistory, getSnapshotHistory, getRecentPosts } from "@/lib/apify";
import { PageHeader } from "@/components/page-header";
import { SocialAnalytics } from "@/components/social-analytics";
import config from "@rally";

async function AnalyticsContent() {
  const [latest, growth, history, posts] = await Promise.all([
    getLatestSnapshots(),
    getGrowthHistory(),
    getSnapshotHistory(15),
    getRecentPosts(undefined, 30),
  ]);

  return (
    <SocialAnalytics
      initialLatest={latest}
      initialGrowth={growth}
      initialHistory={history}
      initialPosts={posts}
    />
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Sync controls skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-40 rounded-xl bg-muted" />
        <div className="h-4 w-20 rounded bg-muted" />
      </div>
      {/* Hero stats skeleton */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-muted" />
        ))}
      </div>
      {/* Platform cards skeleton */}
      <div className="space-y-4">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  await requireAuth();

  return (
    <div className="noise-bg min-h-screen bg-background">
      <PageHeader title={config.terms.community} backHref="/" />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-8 sm:pb-8">
        <Suspense fallback={<AnalyticsSkeleton />}>
          <AnalyticsContent />
        </Suspense>
      </main>
    </div>
  );
}
