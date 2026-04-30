"use client";

import { Plus, Trash2, AtSign } from "lucide-react";
import type { Vendor } from "@/lib/checkin";

interface Props {
  vendors: Vendor[];
  onChange: (next: Vendor[]) => void;
}

export function VendorEditor({ vendors, onChange }: Props) {
  function update(i: number, patch: Partial<Vendor>) {
    onChange(vendors.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }
  function add() {
    onChange([...vendors, { name: "", instagram: "" }]);
  }
  function remove(i: number) {
    onChange(vendors.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <p className="mb-2 font-display text-[11px] uppercase text-foreground">
        vendors
      </p>
      <div className="space-y-2">
        {vendors.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={v.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="vendor name"
              aria-label={`Vendor ${i + 1} display name`}
              className="flex-1 rounded-lg border border-border/50 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-foreground/60 focus-visible:border-navy/30 focus-visible:ring-1 focus-visible:ring-navy/10"
            />
            <div className="relative flex-1">
              <AtSign
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/55"
                aria-hidden
              />
              <input
                type="text"
                value={v.instagram}
                onChange={(e) => update(i, { instagram: e.target.value })}
                placeholder="ig handle"
                aria-label={`Vendor ${i + 1} Instagram handle`}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full rounded-lg border border-border/50 bg-white py-2 pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-foreground/60 focus-visible:border-navy/30 focus-visible:ring-1 focus-visible:ring-navy/10"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove vendor ${i + 1}`}
              className="shrink-0 rounded-lg p-2 text-foreground/55 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 px-3 py-2 font-display text-[11px] uppercase tracking-wider text-foreground transition-colors hover:border-navy/30 hover:bg-secondary/30"
        >
          <Plus className="h-3 w-3" />
          add vendor
        </button>
      </div>
    </div>
  );
}
