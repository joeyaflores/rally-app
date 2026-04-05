import Link from "next/link";
import { ImageIcon } from "lucide-react";
import type { BoardWithMeta, BoardType } from "@/lib/board-types";

const TYPE_CONFIG: Record<
  BoardType,
  { label: string; gradient: string }
> = {
  event: {
    label: "event",
    gradient: "from-warm to-[#FFB347]",
  },
  campaign: {
    label: "campaign",
    gradient: "from-navy to-[#1e3a8a]",
  },
  merch: {
    label: "merch",
    gradient: "from-[#059669] to-[#0d9488]",
  },
  general: {
    label: "general",
    gradient: "from-[#64748b] to-[#94a3b8]",
  },
};

export function BoardCard({ board }: { board: BoardWithMeta }) {
  const cfg = TYPE_CONFIG[board.board_type];

  return (
    <Link href={`/boards/${board.id}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
        {/* Background */}
        {board.cover ? (
          <img
            src={board.cover}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${cfg.gradient}`}
          >
            <ImageIcon className="h-10 w-10 text-white/20" />
          </div>
        )}

        {/* Bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-10">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {cfg.label}
            </span>
            <span className="text-[10px] text-white/50">
              {board.item_count} item{board.item_count !== 1 ? "s" : ""}
            </span>
          </div>
          <h3 className="font-display text-lg leading-tight tracking-tight text-white">
            {board.title || "untitled"}
          </h3>
          {board.event_date && (
            <p className="mt-0.5 text-[11px] text-white/50">
              {new Date(board.event_date + "T00:00:00").toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric" }
              )}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
