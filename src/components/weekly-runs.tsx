import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { weeklyRuns } from "@/lib/data";
import { MapPin, Clock, Route } from "lucide-react";
import { ShareJoinLink } from "@/components/share-join-link";
import config from "@rally";

export function WeeklyRuns() {
  return (
    <Card
      className="animate-fade-up border-0 shadow-sm"
      style={{ animationDelay: "700ms" }}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="font-display text-lg font-bold uppercase tracking-wide">
              weekly runs
            </CardTitle>
            <p className="font-display text-sm uppercase text-muted-foreground">
              {config.terms.welcome} — show up as you are
            </p>
          </div>
          <ShareJoinLink />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {weeklyRuns.map((run) => (
          <div
            key={run.name}
            className={`rounded-xl border border-border/50 bg-secondary/30 p-4 border-l-[3px] ${
              run.day === "Monday"
                ? "border-l-navy"
                : "border-l-warm"
            }`}
          >
            <p className="font-display text-base font-bold uppercase tracking-wide text-navy">
              {run.name}
            </p>
            <div className="mt-2.5 space-y-1.5">
              <div className="flex items-center gap-2 font-display text-sm uppercase text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {run.day}s at {run.time}
                </span>
              </div>
              <div className="flex items-start gap-2 font-display text-sm uppercase text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{run.location}</span>
              </div>
              <div className="flex items-center gap-2 font-display text-sm uppercase text-muted-foreground">
                <Route className="h-3.5 w-3.5 shrink-0" />
                <span>{run.distance}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
