"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  StickyNote,
  LayoutGrid,
  Users,
  BarChart3,
  ClipboardCheck,
} from "lucide-react";
import config from "@rally";

const NAV_ITEMS = [
  { href: "/", label: "home", icon: Home },
  { href: "/calendar", label: "calendar", icon: CalendarDays },
  { href: "/notes", label: "notes", icon: StickyNote },
  { href: "/boards", label: "boards", icon: LayoutGrid },
  { href: "/partners", label: config.terms.member, icon: Users },
  { href: "/analytics", label: "analytics", icon: BarChart3 },
  { href: "/checkin/live", label: "check-in", icon: ClipboardCheck },
];

/* Desktop: labeled links rendered inside the header */
export function DashboardNav() {
  return (
    <nav className="hidden items-center gap-0.5 sm:flex">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-[color] hover:text-navy"
        >
          <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-display tracking-wide">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

/* Mobile: floating pill rendered in root layout */
export function MobileNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/login") || pathname.startsWith("/auth") || pathname.startsWith("/join") || pathname === "/checkin" || pathname.startsWith("/report")) return null;

  return (
    <nav className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 animate-fade-up motion-reduce:animate-none sm:hidden">
      <div className="flex items-center gap-0.5 rounded-full border border-border/60 bg-white/90 px-1.5 py-1 shadow-md shadow-navy/5 backdrop-blur-sm [touch-action:manipulation] [-webkit-tap-highlight-color:rgba(19,44,131,0.08)]">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`rounded-full p-2.5 transition-[color,background-color] ${
                active
                  ? "bg-navy text-white"
                  : "text-muted-foreground/50 active:bg-navy active:text-white"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
