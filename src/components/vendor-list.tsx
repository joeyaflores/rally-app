import type { Vendor } from "@/lib/checkin";

const IG_GLYPH = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
);

const ARROW_GLYPH = (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    className="h-3.5 w-3.5 shrink-0 text-navy/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-navy"
    aria-hidden
  >
    <path d="M5 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface Props {
  vendors: Vendor[];
  label?: string;
  baseDelay?: number;
}

export function VendorList({ vendors, label = "Today's vendors", baseDelay = 1.0 }: Props) {
  if (vendors.length === 0) return null;

  return (
    <div
      className="mt-8"
      style={{ animation: `fade-up 0.6s ease-out ${baseDelay}s both` }}
    >
      <div className="mx-auto mb-4 h-px w-12 bg-navy/30" />
      <p className="mb-4 text-center font-stat text-xs uppercase tracking-[0.3em] text-navy/70 sm:text-sm">
        {label}
      </p>
      <ul className="space-y-2.5">
        {vendors.map((v, i) => (
          <li
            key={`${v.instagram}-${i}`}
            style={{ animation: `fade-up 0.4s ease-out ${baseDelay + 0.12 + i * 0.07}s both` }}
          >
            <a
              href={`https://instagram.com/${v.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-navy/10 bg-background px-4 py-3.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/25 hover:bg-white hover:shadow-md active:translate-y-0"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-warm/30 to-warm/10 text-warm-dark transition-all duration-200 group-hover:from-warm/45 group-hover:to-warm/20" style={{ color: "var(--color-warm)" }}>
                {IG_GLYPH}
              </span>

              <span className="relative min-w-0 flex-1">
                <span className="block truncate font-display text-base leading-tight tracking-tight text-navy sm:text-lg">
                  {v.name || `@${v.instagram}`}
                </span>
                <span className="mt-0.5 block truncate text-xs text-navy/65">
                  @{v.instagram}
                </span>
              </span>

              {ARROW_GLYPH}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
