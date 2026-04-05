import { requireAuth } from "@/lib/require-auth";
import { getLatestMonth, getMonthData, getMonthSnapshots, hasAnyData } from "@/lib/analytics";
import { PageHeader } from "@/components/page-header";
import { AnalyticsEditor } from "@/components/admin/analytics-editor";

export default async function AdminPage() {
  await requireAuth();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [latest, seeded] = await Promise.all([
    getLatestMonth(),
    hasAnyData(),
  ]);

  const year = latest?.year ?? currentYear;
  const month = latest?.month ?? currentMonth;
  const [data, snapshots] = await Promise.all([
    getMonthData(year, month),
    getMonthSnapshots(year, month),
  ]);

  return (
    <div className="noise-bg min-h-screen bg-background">
      <PageHeader title="analytics" backHref="/" />

      <main className="animate-fade-up relative z-10 mx-auto max-w-4xl space-y-12 px-6 pb-20 pt-8 motion-reduce:animate-none sm:pb-8">
        <AnalyticsEditor
          initialYear={year}
          initialMonth={month}
          initialData={data}
          initialSnapshots={snapshots}
          needsSeed={!seeded}
        />
      </main>
    </div>
  );
}
