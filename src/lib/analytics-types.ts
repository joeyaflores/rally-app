export interface IGMetrics {
  followers: number;
  posts: number;
  reels: number;
  totalViews: number;
  viewsFromFollowers: number;
  viewsFromNonFollowers: number;
  accountsReached: number;
  profileVisits: number;
  externalLinkTaps: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  reposts: number;
}

export interface TTMetrics {
  followers: number;
  tiktoks: number;
  totalViews: number;
  profileViews: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface StravaMetrics {
  members: number;
  posts: number;
}

export interface AttendanceEvent {
  id: string;
  event_date: string;
  day: string;
  attendance: number;
  note: string;
}

export interface MonthData {
  ig: IGMetrics | null;
  tt: TTMetrics | null;
  strava: StravaMetrics | null;
  events: AttendanceEvent[];
}

export interface MetricSnapshot {
  id: string;
  platform: string;
  year: number;
  month: number;
  metrics: Record<string, number>;
  recorded_at: string;
}

/** Shape returned by getDashboardData() for the main dashboard. */
export interface DashboardData {
  lastUpdated: string;
  currentMonth: string;
  previousMonth: string;
  /** Month with actual platform metrics (may differ from currentMonth). */
  platformMonth: string;
  platformPrevMonth: string;
  isPartial: boolean;
  dayOfMonth: number;
  daysInMonth: number;
  lastUpdatedShort: string;
  ig: { prev: IGMetrics; curr: IGMetrics };
  tt: { prev: TTMetrics; curr: TTMetrics };
  strava: { members: number; posts: { prev: number; curr: number } };
  events: { date: string; day: string; attendance: number }[];
  allEvents: { date: string; day: string; attendance: number; month: string; note: string }[];
}

export const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const EMPTY_IG: IGMetrics = {
  followers: 0, posts: 0, reels: 0, totalViews: 0,
  viewsFromFollowers: 0, viewsFromNonFollowers: 0,
  accountsReached: 0, profileVisits: 0, externalLinkTaps: 0,
  likes: 0, comments: 0, saves: 0, shares: 0, reposts: 0,
};

export const EMPTY_TT: TTMetrics = {
  followers: 0, tiktoks: 0, totalViews: 0, profileViews: 0,
  likes: 0, comments: 0, shares: 0,
};

export const EMPTY_STRAVA: StravaMetrics = { members: 0, posts: 0 };

export interface PostComment {
  username: string;
  text: string;
  likesCount: number;
  timestamp: string;
}

export interface SocialPost {
  id: string;
  platform: string;
  external_id: string;
  url: string;
  caption: string;
  thumbnail_url: string;
  post_type: string;
  hashtags: string[];
  mentions: string[];
  latest_comments: PostComment[];
  posted_at: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  duration: number;
  location: string;
  music: string;
  dimensions_height: number;
  dimensions_width: number;
  scraped_at: string;
}
