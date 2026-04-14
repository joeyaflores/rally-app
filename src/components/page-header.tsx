import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { DashboardNav } from "@/components/dashboard-nav";
import { SignOutButton } from "@/components/sign-out-button";
import config from "@rally";

export function PageHeader({
  title,
  backHref,
  children,
}: {
  title: string;
  backHref?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="border-b border-border/50 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2.5">
          {backHref && (
            <Link
              href={backHref}
              className="rounded-lg p-1.5 text-muted-foreground transition-[color,background-color] hover:bg-secondary hover:text-foreground sm:hidden"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Back</span>
            </Link>
          )}
          <Image
            src="/logo-mascot.png"
            alt={config.fullName}
            width={80}
            height={100}
            className="h-14 w-auto sm:h-16"
          />
          <h1 className="font-display text-lg font-bold uppercase tracking-wide text-navy sm:text-xl">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <DashboardNav />
          <div className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
          {children}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
