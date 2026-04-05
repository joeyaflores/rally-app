import QRCode from "qrcode";
import { requireAuth } from "@/lib/require-auth";
import { getActiveSession, getCheckinSessions } from "@/lib/checkin";
import { getReportsBySessionIds } from "@/lib/reports";
import { links } from "@/lib/socials";
import { PageHeader } from "@/components/page-header";
import { CheckinLive } from "@/components/checkin-live";
import { CheckinQR } from "@/components/checkin-qr";
import config from "@rally";

// Static URL + options → generate once at module scope
const qrDataUrlPromise = QRCode.toDataURL(links.checkin, {
  width: 560,
  margin: 2,
  color: { dark: config.theme.primary, light: "#FFFFFF" },
});

export default async function CheckinLivePage() {
  const [, active, sessions, qrDataUrl] = await Promise.all([
    requireAuth(),
    getActiveSession(),
    getCheckinSessions(),
    qrDataUrlPromise,
  ]);

  // Batch-load report status for past sessions
  const closedIds = sessions.filter((s) => s.status === "closed").map((s) => s.id);
  const sessionReports = await getReportsBySessionIds(closedIds);

  return (
    <div className="noise-bg min-h-screen bg-background">
      <PageHeader title="check-in" backHref="/" />

      <main className="animate-fade-up relative z-10 mx-auto max-w-2xl space-y-12 px-6 pb-20 pt-8 motion-reduce:animate-none sm:pb-8">
        {active && <CheckinQR qrDataUrl={qrDataUrl} />}
        <CheckinLive
          initialActive={active}
          initialSessions={sessions}
          initialSessionReports={sessionReports}
        />
      </main>
    </div>
  );
}
