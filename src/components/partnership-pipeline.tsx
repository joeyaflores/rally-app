import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { partnerships } from "@/lib/data";
import { Handshake, ChevronRight } from "lucide-react";

const statusStyles = {
  lead: "bg-amber-50 text-amber-700 border-amber-200",
  negotiating: "bg-blue-50 text-blue-700 border-blue-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-zinc-50 text-zinc-600 border-zinc-200",
  passed: "bg-red-50 text-red-600 border-red-200",
};

const statusLabels = {
  lead: "In Discussions",
  negotiating: "Negotiating",
  active: "Active",
  completed: "Completed",
  passed: "Passed",
};

export function PartnershipPipeline() {
  return (
    <Card
      className="animate-fade-up border-0 shadow-sm"
      style={{ animationDelay: "800ms" }}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm-muted">
            <Handshake className="h-5 w-5 text-warm" />
          </div>
          <div>
            <CardTitle className="font-display text-lg tracking-tight">
              brands who believe in community
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {partnerships.length} conversations happening
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          {partnerships.map((partner) => (
            <div
              key={partner.name}
              className="group flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-4 transition-all hover:border-navy/20 hover:bg-secondary/60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy/5 font-display text-lg text-navy">
                  {partner.name[0]}
                </div>
                <div>
                  <p className="font-display text-base tracking-tight">
                    {partner.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {partner.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={statusStyles[partner.status]}
                >
                  {statusLabels[partner.status]}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
