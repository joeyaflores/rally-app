"use client";

import { useState, useRef, useEffect } from "react";
import { RefreshCw, Check, X } from "lucide-react";
import { syncFromSheet } from "@/lib/sheets-sync";

export function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  async function handleSync() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSyncing(true);
    setResult(null);
    try {
      const res = await syncFromSheet();
      setResult(res);
      if (res.success) {
        timerRef.current = setTimeout(() => window.location.reload(), 1500);
      } else {
        timerRef.current = setTimeout(() => setResult(null), 4000);
      }
    } catch {
      setResult({ success: false, message: "sync failed" });
      timerRef.current = setTimeout(() => setResult(null), 4000);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {result ? (
        <span
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity ${
            result.success
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {result.success ? (
            <Check className="h-3 w-3" />
          ) : (
            <X className="h-3 w-3" />
          )}
          {result.message}
        </span>
      ) : null}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
        title="Sync from Google Sheets"
      >
        <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
