"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  Link2,
  Type,
  Hash,
  Plus,
  X,
  Trash2,
  ExternalLink,
  Archive,
  Instagram,
  Search,
  Check,
} from "lucide-react";
import { TikTokIcon, StravaIcon } from "@/components/icons";
import {
  addBoardItem,
  removeBoardItem,
  updateBoardItem,
  updateBoard,
  archiveBoard,
} from "@/lib/boards";
import type { Board, BoardItem, BoardType, BoardItemType } from "@/lib/board-types";
import type { ContentPost, Platform } from "@/lib/calendar-types";

/* ─── Constants ─── */

const TYPE_CONFIG: Record<BoardType, { label: string; color: string }> = {
  event: { label: "event", color: "#FF6B35" },
  campaign: { label: "campaign", color: "#29741d" },
  merch: { label: "merch", color: "#059669" },
  general: { label: "general", color: "#6B7280" },
};

const PLATFORM_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  instagram: {
    label: "IG",
    color: "#E1306C",
    icon: <Instagram className="h-3 w-3" />,
  },
  tiktok: {
    label: "TT",
    color: "#000000",
    icon: <TikTokIcon className="h-3 w-3" />,
  },
  strava: {
    label: "Strava",
    color: "#FC4C02",
    icon: <StravaIcon className="h-3 w-3" />,
  },
};

const STATUS_STYLES: Record<string, string> = {
  idea: "bg-amber-100 text-amber-700",
  drafted: "bg-blue-100 text-blue-700",
  posted: "bg-navy/10 text-navy",
};

type AddMode = "image" | "link" | "text" | "post" | null;

/* ─── Helpers ─── */

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/* ─── Item cards ─── */

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/item:opacity-100"
    >
      <X className="h-3 w-3" />
    </button>
  );
}

function ArchiveConfirm({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startConfirm() {
    setConfirming(true);
    timerRef.current = setTimeout(() => setConfirming(false), 3000);
  }

  function cancel() {
    setConfirming(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function confirm() {
    if (timerRef.current) clearTimeout(timerRef.current);
    onConfirm();
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!confirming) {
    return (
      <button
        onClick={startConfirm}
        className="ml-auto rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-muted-foreground"
        title="Archive board"
      >
        <Archive className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="ml-auto flex animate-fade-up items-center gap-1">
      <span className="mr-0.5 text-[11px] font-medium text-rose-500/80">
        archive?
      </span>
      <button
        onClick={confirm}
        className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/10 text-rose-500 transition-colors hover:bg-rose-500/20"
        title="Confirm archive"
      >
        <Check className="h-3 w-3" />
      </button>
      <button
        onClick={cancel}
        className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-muted-foreground/50 transition-colors hover:bg-secondary/80 hover:text-muted-foreground"
        title="Cancel"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function ImageCard({
  item,
  onDelete,
  onSave,
}: {
  item: BoardItem;
  onDelete: () => void;
  onSave: (data: { title?: string; content?: string }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(item.title);
  const containerRef = useRef<HTMLDivElement>(null);

  function commit() {
    if (caption !== item.title) onSave({ title: caption });
    setEditing(false);
  }

  return (
    <div
      ref={containerRef}
      onClick={() => !editing && setEditing(true)}
      onBlur={(e) => {
        if (editing && !containerRef.current?.contains(e.relatedTarget as Node))
          commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") commit();
      }}
      className={`group/item relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm transition-shadow ${
        editing ? "ring-2 ring-navy/20" : ""
      }`}
    >
      <img
        src={item.content}
        alt={item.title || ""}
        className="w-full"
        loading="lazy"
      />
      {editing ? (
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="add a caption..."
          autoFocus
          className="w-full border-t border-border/30 bg-transparent px-3 py-2 text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/30"
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
        />
      ) : (
        item.title && (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            {item.title}
          </p>
        )
      )}
      <DeleteButton onClick={onDelete} />
    </div>
  );
}

function LinkCard({
  item,
  onDelete,
  onSave,
}: {
  item: BoardItem;
  onDelete: () => void;
  onSave: (data: { title?: string; content?: string }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(item.content);
  const [note, setNote] = useState(item.title);
  const containerRef = useRef<HTMLDivElement>(null);

  function commit() {
    const updates: { title?: string; content?: string } = {};
    if (url !== item.content) updates.content = url;
    if (note !== item.title) updates.title = note;
    if (Object.keys(updates).length > 0) onSave(updates);
    setEditing(false);
  }

  const domain = getDomain(editing ? url : item.content);

  return (
    <div
      ref={containerRef}
      onClick={() => !editing && setEditing(true)}
      onBlur={(e) => {
        if (editing && !containerRef.current?.contains(e.relatedTarget as Node))
          commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") commit();
      }}
      className={`group/item relative cursor-pointer rounded-xl border bg-white p-3 shadow-sm transition-shadow ${
        editing ? "border-navy/20 ring-2 ring-navy/20" : "border-border/50"
      }`}
    >
      {editing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-navy" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-xs font-medium text-navy outline-none placeholder:text-navy/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
              }}
            />
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="add a note..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/30"
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
            }}
          />
        </div>
      ) : (
        <>
          <a
            href={item.content}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 text-xs text-navy transition-colors hover:text-navy/70"
          >
            <Link2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate font-medium">{domain}</span>
            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/40" />
          </a>
          {item.title && (
            <p className="mt-1.5 text-sm text-foreground">{item.title}</p>
          )}
        </>
      )}
      <DeleteButton onClick={onDelete} />
    </div>
  );
}

function TextCard({
  item,
  onDelete,
  onSave,
}: {
  item: BoardItem;
  onDelete: () => void;
  onSave: (data: { title?: string; content?: string }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function commit() {
    if (text !== item.content) onSave({ content: text });
    setEditing(false);
  }

  function autoResize() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }

  useEffect(() => {
    if (editing) autoResize();
  }, [editing]);

  return (
    <div
      ref={containerRef}
      onClick={() => !editing && setEditing(true)}
      onBlur={(e) => {
        if (editing && !containerRef.current?.contains(e.relatedTarget as Node))
          commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") commit();
      }}
      className={`group/item relative cursor-pointer rounded-xl bg-amber-50/80 p-3.5 shadow-sm transition-shadow ${
        editing ? "ring-2 ring-navy/20" : ""
      }`}
    >
      {editing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            autoResize();
          }}
          autoFocus
          className="w-full resize-none bg-transparent text-sm text-foreground outline-none"
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm text-foreground">
          {item.content}
        </p>
      )}
      <DeleteButton onClick={onDelete} />
    </div>
  );
}

function PostCard({
  item,
  post,
  onDelete,
}: {
  item: BoardItem;
  post: ContentPost | undefined;
  onDelete: () => void;
}) {
  if (!post) {
    return (
      <div className="group/item relative rounded-xl border border-border/30 bg-secondary/50 p-3">
        <p className="text-xs text-muted-foreground/50">post unavailable</p>
        <DeleteButton onClick={onDelete} />
      </div>
    );
  }

  const pf = PLATFORM_CONFIG[post.platform];
  const statusClass = STATUS_STYLES[post.status] || "";

  return (
    <div
      className="group/item relative rounded-xl border-l-[3px] bg-white p-3 shadow-sm"
      style={{ borderLeftColor: pf?.color || "#6B7280" }}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        {pf && (
          <span style={{ color: pf.color }}>{pf.icon}</span>
        )}
        <span className="text-[10px] font-medium text-muted-foreground">
          {pf?.label || post.platform}
        </span>
        <span
          className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-medium ${statusClass}`}
        >
          {post.status}
        </span>
      </div>
      <p className="text-sm font-medium text-foreground">
        {post.title || "untitled"}
      </p>
      {post.creator && (
        <p className="mt-0.5 text-[11px] text-muted-foreground/60">
          {post.creator}
        </p>
      )}
      <p className="mt-1 text-[10px] text-muted-foreground/40">
        {new Date(post.post_date + "T00:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </p>
      <DeleteButton onClick={onDelete} />
    </div>
  );
}

/* ─── Main component ─── */

export function BoardView({
  board,
  items: initialItems,
  posts,
}: {
  board: Board;
  items: BoardItem[];
  posts: ContentPost[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description);

  // Image form
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Link form
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  // Text form
  const [textContent, setTextContent] = useState("");

  // Post form
  const [postSearch, setPostSearch] = useState("");

  // Debounced metadata save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSave = useCallback(
    (data: { title?: string; description?: string }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => updateBoard(board.id, data), 500);
    },
    [board.id]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function resetAdd() {
    setAddMode(null);
    setImageUrl("");
    setImageCaption("");
    setLinkUrl("");
    setLinkTitle("");
    setTextContent("");
    setPostSearch("");
  }

  /* ── Handlers ── */

  async function handleAddImage(url: string, caption: string) {
    if (!url.trim()) return;
    const item = await addBoardItem(board.id, "image", url.trim(), caption);
    setItems((prev) => [item, ...prev]);
    resetAdd();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      await handleAddImage(url, "");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleAddLink() {
    if (!linkUrl.trim()) return;
    const item = await addBoardItem(
      board.id,
      "link",
      linkUrl.trim(),
      linkTitle.trim()
    );
    setItems((prev) => [item, ...prev]);
    resetAdd();
  }

  async function handleAddText() {
    if (!textContent.trim()) return;
    const item = await addBoardItem(
      board.id,
      "text",
      textContent.trim(),
      ""
    );
    setItems((prev) => [item, ...prev]);
    resetAdd();
  }

  async function handleConnectPost(postId: string) {
    const item = await addBoardItem(board.id, "post", postId, "");
    setItems((prev) => [item, ...prev]);
    resetAdd();
  }

  async function handleDelete(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    await removeBoardItem(itemId);
  }

  async function handleUpdateItem(
    itemId: string,
    data: { title?: string; content?: string }
  ) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, ...data } : i))
    );
    await updateBoardItem(itemId, data);
  }

  async function handleArchive() {
    await archiveBoard(board.id);
    router.push("/boards");
  }

  /* ── Computed ── */

  const postsMap = new Map(posts.map((p) => [p.id, p]));
  const connectedPostIds = new Set(
    items.filter((i) => i.item_type === "post").map((i) => i.content)
  );
  const availablePosts = posts.filter((p) => !connectedPostIds.has(p.id));
  const filteredPosts = postSearch
    ? availablePosts.filter(
        (p) =>
          p.title.toLowerCase().includes(postSearch.toLowerCase()) ||
          p.platform.includes(postSearch.toLowerCase()) ||
          (p.creator && p.creator.toLowerCase().includes(postSearch.toLowerCase()))
      )
    : availablePosts.slice(0, 10);

  const typeConfig = TYPE_CONFIG[board.board_type];

  /* ── Render ── */

  return (
    <div>
      {/* Board header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-medium text-white"
            style={{ backgroundColor: typeConfig.color }}
          >
            {typeConfig.label}
          </span>
          {board.event_date && (
            <span className="text-xs text-muted-foreground/60">
              {new Date(board.event_date + "T00:00:00").toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric" }
              )}
            </span>
          )}
          <ArchiveConfirm onConfirm={handleArchive} />
        </div>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            debouncedSave({ title: e.target.value });
          }}
          placeholder="untitled board"
          className="w-full bg-transparent font-display text-2xl tracking-tight text-navy outline-none placeholder:text-navy/20"
        />
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            debouncedSave({ description: e.target.value });
          }}
          placeholder="add a description..."
          className="mt-1 w-full resize-none bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/30"
          rows={1}
        />
      </div>

      {/* Add toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["image", "link", "text", "post"] as const).map((mode) => {
          const icons = {
            image: <ImagePlus className="h-3 w-3" />,
            link: <Link2 className="h-3 w-3" />,
            text: <Type className="h-3 w-3" />,
            post: <Hash className="h-3 w-3" />,
          };
          return (
            <button
              key={mode}
              onClick={() => setAddMode(addMode === mode ? null : mode)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                addMode === mode
                  ? "bg-navy text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {icons[mode]}
              {mode}
            </button>
          );
        })}
      </div>

      {/* Add forms */}
      {addMode === "image" && (
        <div className="mb-6 animate-fade-up rounded-2xl border border-border/50 bg-white p-4 shadow-sm">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/40 py-8 transition-colors hover:border-navy/30"
          >
            <ImagePlus className="h-6 w-6 text-muted-foreground/30" />
            <span className="text-sm text-muted-foreground/50">
              {uploading ? "uploading..." : "click to upload"}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[11px] text-muted-foreground/40">
              or paste URL
            </span>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="min-w-0 flex-1 rounded-lg border border-border/50 px-3 py-1.5 text-sm outline-none focus:border-navy/30"
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  handleAddImage(imageUrl, imageCaption);
              }}
            />
            <button
              onClick={() => handleAddImage(imageUrl, imageCaption)}
              disabled={!imageUrl.trim()}
              className="shrink-0 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white transition-opacity disabled:opacity-30"
            >
              add
            </button>
          </div>
        </div>
      )}

      {addMode === "link" && (
        <div className="mb-6 animate-fade-up rounded-2xl border border-border/50 bg-white p-4 shadow-sm">
          <div className="space-y-2">
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="paste URL — instagram, pinterest, tiktok, anything..."
              className="w-full rounded-lg border border-border/50 px-3 py-2 text-sm outline-none focus:border-navy/30"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddLink();
              }}
            />
            <input
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="add a note (optional)"
              className="w-full rounded-lg border border-border/50 px-3 py-2 text-sm outline-none focus:border-navy/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddLink();
              }}
            />
            <button
              onClick={handleAddLink}
              disabled={!linkUrl.trim()}
              className="rounded-lg bg-navy px-4 py-1.5 text-xs font-medium text-white transition-opacity disabled:opacity-30"
            >
              add link
            </button>
          </div>
        </div>
      )}

      {addMode === "text" && (
        <div className="mb-6 animate-fade-up rounded-2xl border border-border/50 bg-white p-4 shadow-sm">
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="ideas, shot list, notes..."
            className="mb-2 w-full resize-none rounded-lg border border-border/50 px-3 py-2 text-sm outline-none focus:border-navy/30"
            rows={3}
            autoFocus
          />
          <button
            onClick={handleAddText}
            disabled={!textContent.trim()}
            className="rounded-lg bg-navy px-4 py-1.5 text-xs font-medium text-white transition-opacity disabled:opacity-30"
          >
            add note
          </button>
        </div>
      )}

      {addMode === "post" && (
        <div className="mb-6 animate-fade-up rounded-2xl border border-border/50 bg-white p-4 shadow-sm">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
            <input
              value={postSearch}
              onChange={(e) => setPostSearch(e.target.value)}
              placeholder="search content posts..."
              className="w-full rounded-lg border border-border/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-navy/30"
              autoFocus
            />
          </div>
          {filteredPosts.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground/40">
              {availablePosts.length === 0
                ? "all posts connected"
                : "no matching posts"}
            </p>
          ) : (
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {filteredPosts.map((post) => {
                const pf = PLATFORM_CONFIG[post.platform];
                return (
                  <button
                    key={post.id}
                    onClick={() => handleConnectPost(post.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-secondary"
                  >
                    {pf && (
                      <span style={{ color: pf.color }}>{pf.icon}</span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {post.title || "untitled"}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${STATUS_STYLES[post.status] || ""}`}
                    >
                      {post.status}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground/40">
                      {new Date(
                        post.post_date + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Masonry grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/40 bg-white/50 py-16 text-center">
          <ImagePlus className="h-8 w-8 text-muted-foreground/20" />
          <div>
            <p className="text-sm text-muted-foreground/50">
              start adding inspiration, links, and ideas
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/30">
              upload images, paste links, add notes, or connect content posts
            </p>
          </div>
        </div>
      ) : (
        <div
          className="columns-2 md:columns-3 lg:columns-4"
          style={{ columnGap: "0.75rem" }}
        >
          {items.map((item) => (
            <div key={item.id} className="mb-3 break-inside-avoid">
              {item.item_type === "image" && (
                <ImageCard
                  item={item}
                  onDelete={() => handleDelete(item.id)}
                  onSave={(data) => handleUpdateItem(item.id, data)}
                />
              )}
              {item.item_type === "link" && (
                <LinkCard
                  item={item}
                  onDelete={() => handleDelete(item.id)}
                  onSave={(data) => handleUpdateItem(item.id, data)}
                />
              )}
              {item.item_type === "text" && (
                <TextCard
                  item={item}
                  onDelete={() => handleDelete(item.id)}
                  onSave={(data) => handleUpdateItem(item.id, data)}
                />
              )}
              {item.item_type === "post" && (
                <PostCard
                  item={item}
                  post={postsMap.get(item.content)}
                  onDelete={() => handleDelete(item.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
