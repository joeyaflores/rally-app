import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/require-auth";
import { getBoard, getBoardItems, getRecentPosts } from "@/lib/boards";
import { PageHeader } from "@/components/page-header";
import { BoardView } from "@/components/boards/board-view";

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();

  const { id } = await params;
  const [board, items, posts] = await Promise.all([
    getBoard(id),
    getBoardItems(id),
    getRecentPosts(),
  ]);

  if (!board) notFound();

  return (
    <div className="noise-bg min-h-screen bg-background">
      <PageHeader title="boards" backHref="/boards" />

      <main className="animate-fade-up relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-8 motion-reduce:animate-none sm:pb-8">
        <BoardView board={board} items={items} posts={posts} />
      </main>
    </div>
  );
}
