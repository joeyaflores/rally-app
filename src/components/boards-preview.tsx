import Link from "next/link";
import { ArrowRight, ImageIcon, CalendarDays } from "lucide-react";
import type { BoardWithMeta, BoardType } from "@/lib/board-types";

const TYPE_STYLE: Record<BoardType, { label: string; gradient: string }> = {
  event: {
    label: "event",
    gradient: "from-warm via-warm-light to-gold",
  },
  campaign: {
    label: "campaign",
    gradient: "from-navy via-navy-light to-[#3B5EC9]",
  },
  merch: {
    label: "merch",
    gradient: "from-[#059669] via-[#0d9488] to-[#2dd4bf]",
  },
  general: {
    label: "general",
    gradient: "from-[#475569] via-[#64748b] to-[#94a3b8]",
  },
};

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function BoardThumb({ board }: { board: BoardWithMeta }) {
  const cfg = TYPE_STYLE[board.board_type];

  return (
    <Link
      href={`/boards/${board.id}`}
      className="group relative block shrink-0 snap-start"
    >
      <div className="relative h-[140px] w-[200px] overflow-hidden rounded-2xl shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md sm:h-[160px] sm:w-[240px]">
        {/* Cover */}
        {board.cover ? (
          <img
            src={board.cover}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${cfg.gradient}`}>
            <ImageIcon className="h-8 w-8 text-white/15" />
          </div>
        )}

        {/* Scrim overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Type pill — top left */}
        <div className="absolute left-2.5 top-2.5">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
            {cfg.label}
          </span>
        </div>

        {/* Info — bottom */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="truncate font-display text-[15px] leading-tight tracking-tight text-white sm:text-base">
            {board.title || "untitled"}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] text-white/50">
              {board.item_count} item{board.item_count !== 1 ? "s" : ""}
            </span>
            {board.event_date && (
              <>
                <span className="text-[10px] text-white/20">&middot;</span>
                <span className="flex items-center gap-0.5 text-[10px] text-white/50">
                  <CalendarDays className="h-2.5 w-2.5" />
                  {formatEventDate(board.event_date)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function BoardsPreview({ boards }: { boards: BoardWithMeta[] }) {
  if (boards.length === 0) {
    return (
      <section className="animate-fade-up" style={{ animationDelay: "250ms" }}>
        <div className="mb-3 px-1">
          <h2 className="font-display text-sm font-medium uppercase tracking-widest text-muted-foreground">
            active boards
          </h2>
        </div>
        <Link
          href="/boards"
          className="group block rounded-2xl border border-dashed border-border/40 bg-white/50 px-5 py-5 text-center transition-all hover:border-navy/20 hover:bg-white"
        >
          <p className="font-display text-sm font-medium uppercase text-muted-foreground/40">
            no active boards yet
          </p>
          <p className="mt-1 font-display text-xs uppercase text-muted-foreground/30 transition-colors group-hover:text-navy/50">
            create a board &rarr;
          </p>
        </Link>
      </section>
    );
  }

  return (
    <section className="animate-fade-up" style={{ animationDelay: "250ms" }}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-sm font-medium uppercase tracking-widest text-muted-foreground">
          active boards
          <span className="ml-2 normal-case tracking-normal text-muted-foreground/40">
            {boards.length} board{boards.length !== 1 ? "s" : ""}
          </span>
        </h2>
        <Link
          href="/boards"
          className="flex items-center gap-1 font-display text-xs uppercase text-muted-foreground transition-colors hover:text-navy"
        >
          all boards
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Scrollable shelf */}
      <div className="-mx-6 px-6">
        <div className="flex gap-3 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {boards.map((board) => (
            <BoardThumb key={board.id} board={board} />
          ))}
        </div>
      </div>
    </section>
  );
}
