export type BoardType = "event" | "campaign" | "merch" | "general";
export type BoardItemType = "image" | "link" | "text" | "post";

export interface Board {
  id: string;
  title: string;
  description: string;
  board_type: BoardType;
  cover_url: string;
  event_date: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface BoardWithMeta extends Board {
  item_count: number;
  cover: string;
}

export interface BoardItem {
  id: string;
  board_id: string;
  item_type: BoardItemType;
  content: string;
  title: string;
  position: number;
  created_at: string;
}
