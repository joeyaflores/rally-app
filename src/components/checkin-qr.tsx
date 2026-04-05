"use client";

import { QrCode } from "lucide-react";
import { ShareLink } from "@/components/share-link";
import { links } from "@/lib/socials";
import config from "@rally";

interface CheckinQRProps {
  qrDataUrl: string;
}

export function CheckinQR({ qrDataUrl }: CheckinQRProps) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm">
      <div className="border-b border-border/30 px-5 py-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 font-display text-xs uppercase tracking-widest text-muted-foreground">
            <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
            share check-in
          </h4>
          <ShareLink
            url={links.checkin}
            title={`Check In \u2014 ${config.fullName}`}
            text="Check in to today\u2019s run!"
            label="copy link"
          />
        </div>
      </div>

      <div className="flex flex-col items-center px-5 py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="QR code linking to check-in page"
          width={180}
          height={180}
          className="rounded-xl"
        />
        <p className="mt-3 select-all font-mono text-xs tracking-wide text-muted-foreground/50">
          {links.checkin.replace("https://", "")}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/30">
          runners scan to check in
        </p>
      </div>
    </div>
  );
}
