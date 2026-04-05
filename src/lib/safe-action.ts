import * as Sentry from "@sentry/nextjs";

export async function safeAction<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    Sentry.captureException(error, { tags: { action: name } });
    throw error;
  }
}
