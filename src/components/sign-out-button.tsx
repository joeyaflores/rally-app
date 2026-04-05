"use client";

import { signOut } from "@/lib/auth-client";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ fetchOptions: { onSuccess: () => window.location.assign("/login") } })}
      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      title="Sign out"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
