import { requireAuth } from "@/lib/require-auth";
import { getContacts } from "@/lib/contacts";
import { getRunners } from "@/lib/runners";
import { PageHeader } from "@/components/page-header";
import config from "@rally";
import { NeighborsTabs } from "@/components/neighbors/neighbors-tabs";
import { RunnersList } from "@/components/neighbors/runners-list";
import { ContactDirectory } from "@/components/partners/contact-directory";

export default async function NeighborsPage() {
  const [, contacts, runners] = await Promise.all([
    requireAuth(),
    getContacts(),
    getRunners(),
  ]);

  return (
    <div className="noise-bg min-h-screen bg-background">
      <PageHeader title={config.terms.member} backHref="/" />

      <main className="animate-fade-up relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-8 motion-reduce:animate-none sm:pb-8">
        <NeighborsTabs
          runnersCount={runners.length}
          partnersCount={contacts.length}
          runnersContent={<RunnersList initial={runners} />}
          partnersContent={<ContactDirectory initialContacts={contacts} />}
        />
      </main>
    </div>
  );
}
