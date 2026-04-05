type Level = "info" | "warn" | "error";

interface LogPayload {
  level: Level;
  msg: string;
  [key: string]: unknown;
}

function emit(payload: LogPayload) {
  const line = JSON.stringify({ ...payload, ts: new Date().toISOString() });
  if (payload.level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const log = {
  info: (msg: string, data?: Record<string, unknown>) =>
    emit({ level: "info", msg, ...data }),
  warn: (msg: string, data?: Record<string, unknown>) =>
    emit({ level: "warn", msg, ...data }),
  error: (msg: string, error?: unknown, data?: Record<string, unknown>) => {
    const { error: _discard, stack: _discard2, ...safeData } = data ?? {};
    emit({
      level: "error",
      msg,
      ...(error != null
        ? {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          }
        : {}),
      ...safeData,
    });
  },
};
