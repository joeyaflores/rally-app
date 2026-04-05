import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/require-auth";
import { getReportById } from "@/lib/reports";
import { getCheckinSessions } from "@/lib/checkin";
import { PageHeader } from "@/components/page-header";
import { ReportBuilder } from "@/components/admin/report-builder";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditReportPage({ params }: Props) {
  await requireAuth();
  const { id } = await params;

  const [report, rawSessions] = await Promise.all([
    getReportById(id),
    getCheckinSessions(20),
  ]);

  if (!report) notFound();

  const sessions = rawSessions.map((s) => ({
    id: s.id,
    title: s.title,
    session_date: s.session_date,
    checkin_count: s.checkin_count,
  }));

  return (
    <div className="noise-bg min-h-screen bg-background">
      <PageHeader title="edit report" backHref="/admin/reports" />

      <main className="animate-fade-up relative z-10 mx-auto max-w-3xl space-y-8 px-6 pb-20 pt-8 motion-reduce:animate-none sm:pb-8">
        <ReportBuilder sessions={sessions} initialReport={report} />
      </main>
    </div>
  );
}
