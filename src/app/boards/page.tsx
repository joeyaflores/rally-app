import { LayoutGrid } from "lucide-react";
import { requireAuth } from "@/lib/require-auth";
import { getBoards } from "@/lib/boards";
import { PageHeader } from "@/components/page-header";
import { BoardCard } from "@/components/boards/board-card";
import { CreateBoardForm } from "@/components/boards/create-board-form";

export default async function BoardsPage() {
  await requireAuth();

  const boards = await getBoards();

  return (
    <div className="noise-bg min-h-screen bg-background">
      <PageHeader title="boards" backHref="/" />

      <main className="animate-fade-up relative z-10 mx-auto max-w-6xl space-y-6 px-6 pb-20 pt-8 motion-reduce:animate-none sm:pb-8">
        <p className="text-center font-display text-sm uppercase text-muted-foreground">
          collect inspo, links, and notes for events, campaigns, or merch drops.
          <br className="hidden sm:block" />
          {" "}click into any board to add images, paste links, connect content posts, or jot ideas.
        </p>

        <CreateBoardForm />

        {boards.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
              <LayoutGrid className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-display text-sm uppercase text-muted-foreground">
              no boards yet &mdash; create one above
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
