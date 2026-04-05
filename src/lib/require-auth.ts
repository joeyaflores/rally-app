import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

/** Cached per-request — multiple calls in the same render deduplicate automatically. */
export const requireAuth = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/join");
  return session;
});
