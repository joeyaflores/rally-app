import { Suspense } from "react";
import { requireAuth } from "@/lib/require-auth";
import { HeroStats } from "@/components/hero-stats";
import { PlatformCard } from "@/components/platform-card";
import dynamic from "next/dynamic";

const AttendanceChart = dynamic(
  () => import("@/components/attendance-chart").then((mod) => mod.AttendanceChart),
  { loading: () => <div className="h-[300px] animate-pulse rounded-2xl bg-secondary/50" /> }
);
import { WeeklyRuns } from "@/components/weekly-runs";
import { PinnedPreview } from "@/components/notes/pinned-preview";
import { GrowthProjection } from "@/components/growth-projection";
import { FollowerChart } from "@/components/follower-chart";
import { getDashboardData, brand } from "@/lib/data";
import config from "@rally";
import { getPinnedNotes, getUpcomingTasks } from "@/lib/notes";
import { UpcomingTasks } from "@/components/upcoming-tasks";
import { WeeklyContent } from "@/components/weekly-content";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { getThisWeekPosts } from "@/lib/calendar";
import { getActiveBoards } from "@/lib/boards";
import { Instagram } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TikTokIcon, StravaIcon } from "@/components/icons";
import { BoardsPreview } from "@/components/boards-preview";

export default async function Home() {
  await requireAuth();

  const data = getDashboardData();
  const [pinnedNotes, upcomingTasks, thisWeekPosts, activeBoards] = await Promise.all([
    getPinnedNotes(),
    getUpcomingTasks(),
    getThisWeekPosts(),
    getActiveBoards(4),
  ]);

  const pulseContent = (
    <>
      {/* What's Ahead */}
      <UpcomingTasks tasks={upcomingTasks} />

      {/* This Week's Content */}
      <WeeklyContent posts={thisWeekPosts} />

      {/* Active Boards */}
      <BoardsPreview boards={activeBoards} />

      {/* Pinned Notes */}
      <PinnedPreview notes={pinnedNotes} />
    </>
  );

  const growthContent = (
    <>
      {/* Hero Stats */}
      <section>
        <HeroStats data={data} />
      </section>

      {/* Platform Breakdown */}
      <section>
        <h2 className="mb-4 font-display text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {config.terms.community}
          <span className="ml-2 normal-case tracking-normal text-muted-foreground/50 max-sm:mt-0.5 max-sm:block max-sm:ml-0">
            {data.platformPrevMonth.toLowerCase()} → {data.platformMonth.toLowerCase()}
            <span className="mx-1.5 text-muted-foreground/20">·</span>
            <span className="text-muted-foreground/30">
              updated {data.lastUpdatedShort}
            </span>
          </span>
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <PlatformCard
            title="Instagram"
            icon={<Instagram className="h-5 w-5" />}
            color="#E1306C"
            handle={config.socials.instagram.handle}
            url={config.socials.instagram.url}
            delay={300}
            engagementRate={{
              current: data.ig.curr.totalViews ? ((data.ig.curr.likes + data.ig.curr.comments + data.ig.curr.shares + data.ig.curr.saves) / data.ig.curr.totalViews) * 100 : 0,
              previous: data.ig.prev.totalViews ? ((data.ig.prev.likes + data.ig.prev.comments + data.ig.prev.shares + data.ig.prev.saves) / data.ig.prev.totalViews) * 100 : 0,
            }}
            metrics={[
              { label: "Followers", current: data.ig.curr.followers, previous: data.ig.prev.followers },
              { label: "Total Views", current: data.ig.curr.totalViews, previous: data.ig.prev.totalViews },
              { label: "Accounts Reached", current: data.ig.curr.accountsReached, previous: data.ig.prev.accountsReached },
              { label: "Likes", current: data.ig.curr.likes, previous: data.ig.prev.likes },
              { label: "Shares", current: data.ig.curr.shares, previous: data.ig.prev.shares },
              { label: "Saves", current: data.ig.curr.saves, previous: data.ig.prev.saves },
            ]}
          />
          <PlatformCard
            title="TikTok"
            icon={<TikTokIcon />}
            color="#000000"
            handle={config.socials.tiktok.handle}
            url={config.socials.tiktok.url}
            delay={400}
            engagementRate={{
              current: data.tt.curr.totalViews ? ((data.tt.curr.likes + data.tt.curr.comments + data.tt.curr.shares) / data.tt.curr.totalViews) * 100 : 0,
              previous: data.tt.prev.totalViews ? ((data.tt.prev.likes + data.tt.prev.comments + data.tt.prev.shares) / data.tt.prev.totalViews) * 100 : 0,
            }}
            metrics={[
              { label: "Followers", current: data.tt.curr.followers, previous: data.tt.prev.followers },
              { label: "Total Views", current: data.tt.curr.totalViews, previous: data.tt.prev.totalViews },
              { label: "Likes", current: data.tt.curr.likes, previous: data.tt.prev.likes },
              { label: "Comments", current: data.tt.curr.comments, previous: data.tt.prev.comments },
              { label: "Shares", current: data.tt.curr.shares, previous: data.tt.prev.shares },
            ]}
          />
          <PlatformCard
            title="Strava"
            icon={<StravaIcon />}
            color="#FC4C02"
            handle={config.socials.strava.handle}
            url={config.socials.strava.url}
            delay={500}
            metrics={[
              { label: config.terms.member.charAt(0).toUpperCase() + config.terms.member.slice(1), current: data.strava.members, previous: 0 },
              { label: "Posts", current: data.strava.posts.curr, previous: data.strava.posts.prev },
            ]}
          />
        </div>
      </section>

      {/* Community Growth */}
      <section>
        <FollowerChart
          data={[
            {
              month: data.platformPrevMonth.slice(0, 3),
              instagram: data.ig.prev.followers,
              tiktok: data.tt.prev.followers,
              strava: data.strava.members,
              total: data.ig.prev.followers + data.tt.prev.followers + data.strava.members,
            },
            {
              month: data.platformMonth.slice(0, 3),
              instagram: data.ig.curr.followers,
              tiktok: data.tt.curr.followers,
              strava: data.strava.members,
              total: data.ig.curr.followers + data.tt.curr.followers + data.strava.members,
            },
          ]}
        />
      </section>

      {/* Attendance + Weekly Runs */}
      <section className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <AttendanceChart events={data.allEvents} />
        </div>
        <div className="lg:col-span-2">
          <WeeklyRuns />
        </div>
      </section>

      {/* Growth Projection */}
      <section>
        <GrowthProjection
          currentFollowers={data.ig.curr.followers + data.tt.curr.followers + data.strava.members}
          previousFollowers={data.ig.prev.followers + data.tt.prev.followers + data.strava.members}
          currentMonth={data.platformMonth}
        />
      </section>
    </>
  );

  return (
    <div className="noise-bg min-h-screen bg-background">
      <PageHeader title={config.name} />

      <main className="relative z-10 mx-auto max-w-7xl space-y-8 px-6 pb-20 pt-8 sm:pb-8">
        <Suspense>
          <DashboardTabs
            pulseContent={pulseContent}
            growthContent={growthContent}
          />
        </Suspense>

        {/* Footer */}
        <footer className="border-t border-border/50 pb-8 pt-6 text-center text-xs text-muted-foreground">
          <span className="font-display">{brand.name}</span> llc &middot; {brand.location}
        </footer>
      </main>
    </div>
  );
}
