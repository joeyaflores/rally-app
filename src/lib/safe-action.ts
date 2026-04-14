import * as Sentry from "@sentry/nextjs";
import { unstable_rethrow } from "next/navigation";

export async function safeAction<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    unstable_rethrow(error); // re-throws redirect/notFound — not real errors
    Sentry.captureException(error, { tags: { action: name } });
    throw error;
  }
}
