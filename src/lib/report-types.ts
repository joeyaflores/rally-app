import type { SocialPost } from "./analytics-types";
import type { Vendor } from "./checkin";

export interface ReportHighlight {
  label: string;
  value: string;
  suffix?: string;
}

export interface ReportSponsor {
  name: string;
  brand: string;
  role: string;
  logo_url?: string;
}

export interface EventReport {
  id: string;
  token: string;
  title: string;
  event_date: string;
  location: string;
  description: string;
  session_id: string | null;
  board_id: string | null;
  hero_image_url: string;
  highlights: ReportHighlight[];
  sponsors: ReportSponsor[];
  vendors: Vendor[];
  images: string[];
  excluded_post_ids: string[];
  drive_url: string;
  content_start: string | null;
  content_end: string | null;
  metrics_year: number | null;
  metrics_month: number | null;
  published: number;
  created_at: string;
  updated_at: string;
}

export interface ReportAttendance {
  total: number;
  newNeighbors: number;
  returning: number;
}

export interface ReportMetrics {
  ig: {
    followers: number;
    totalViews: number;
    accountsReached: number;
    engagement: number;
    posts: number;
  } | null;
  tt: {
    followers: number;
    totalViews: number;
    likes: number;
    shares: number;
    tiktoks: number;
  } | null;
  strava: {
    members: number;
  } | null;
}

export interface ReportPageData {
  report: EventReport;
  attendance: ReportAttendance | null;
  metrics: ReportMetrics | null;
  boardImages: string[];
  posts: SocialPost[];
}
