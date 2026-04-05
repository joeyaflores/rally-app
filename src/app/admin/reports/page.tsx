import { requireAuth } from "@/lib/require-auth";
import { getReports } from "@/lib/reports";
import { getCheckinSessions } from "@/lib/checkin";
import { PageHeader } from "@/components/page-header";
import { ReportBuilder } from "@/components/admin/report-builder";
import { BASE_URL } from "@/lib/socials";

export default async function AdminReportsPage() {
  await requireAuth();

  const [reports, rawSessions] = await Promise.all([
    getReports(),
    getCheckinSessions(20),
  ]);

  // server-serialization: only send the 4 fields the client component uses
  const sessions = rawSessions.map((s) => ({
    id: s.id,
    title: s.title,
    session_date: s.session_date,
    checkin_count: s.checkin_count,
  }));

  return (
    <div className="noise-bg min-h-screen bg-background">
      <PageHeader title="event reports" backHref="/" />

      <main className="animate-fade-up relative z-10 mx-auto max-w-3xl space-y-8 px-6 pb-20 pt-8 motion-reduce:animate-none sm:pb-8">
        {/* Existing reports */}
        {reports.length > 0 && (
          <section>
            <h2 className="font-display text-lg tracking-tight text-navy">
              reports
            </h2>
            <div className="mt-3 space-y-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
                >
                  <div>
                    <p className="font-display text-sm tracking-tight text-navy">
                      {r.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.event_date} &middot;{" "}
                      {r.published ? (
                        <span className="text-emerald-600">published</span>
                      ) : (
                        <span className="text-amber-600">draft</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/admin/reports/${r.id}/edit`}
                      className="rounded-lg border border-border/50 px-3 py-1.5 font-display text-xs tracking-wide text-navy transition-colors hover:bg-secondary"
                    >
                      edit
                    </a>
                    {r.published ? (
                      <a
                        href={`${BASE_URL}/report/${r.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-navy px-3 py-1.5 font-display text-xs tracking-wide text-white transition-colors hover:bg-navy-light"
                      >
                        view
                      </a>
                    ) : (
                      <span className="rounded-lg bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
                        draft
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Create new report */}
        <ReportBuilder sessions={sessions} />
      </main>
    </div>
  );
}
