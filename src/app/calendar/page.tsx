import { requireAuth } from "@/lib/require-auth";
import { getMonthPosts } from "@/lib/calendar";
import { PageHeader } from "@/components/page-header";
import { ContentCalendar } from "@/components/calendar/content-calendar";

export default async function CalendarPage() {
  await requireAuth();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const posts = await getMonthPosts(year, month);

  return (
    <div className="noise-bg min-h-screen bg-background">
      <PageHeader title="content calendar" backHref="/" />

      <main className="animate-fade-up relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-8 motion-reduce:animate-none sm:pb-8">
        <ContentCalendar
          initialYear={year}
          initialMonth={month}
          initialPosts={posts}
        />
      </main>
    </div>
  );
}
