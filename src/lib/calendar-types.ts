export type Platform = "instagram" | "tiktok" | "strava";
export type PostStatus = "idea" | "drafted" | "posted";
export type Creator = string;
export type PostScope = "club" | "personal";

export interface ContentPost {
  id: string;
  post_date: string;
  platform: Platform;
  title: string;
  body: string;
  caption: string;
  creator: string;
  status: PostStatus;
  scope: PostScope;
  created_at: string;
  updated_at: string;
}
