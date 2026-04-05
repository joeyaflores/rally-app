"use client";

import { useState, useCallback } from "react";
import { Share2, Check } from "lucide-react";

interface ShareLinkProps {
  url: string;
  title: string;
  text: string;
  label?: string;
  className?: string;
}

export function ShareLink({
  url,
  title,
  text,
  label = "share",
  className,
}: ShareLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [url, title, text]);

  return (
    <button
      onClick={handleShare}
      className={
        className ??
        "flex shrink-0 items-center gap-1.5 rounded-lg border border-border/50 bg-secondary/30 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      }
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
          <span>copied</span>
        </>
      ) : (
        <>
          <Share2 className="h-3 w-3" aria-hidden="true" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
