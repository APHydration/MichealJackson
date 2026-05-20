export type WeekRange = {
  start: string;
  end: string;
  label: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  helper?: string;
};

export type SyncSummary = {
  creatorsProcessed: number;
  creatorsSucceeded: number;
  creatorsFailed: number;
  videosUpserted: number;
  payoutsUpserted: number;
  errors: string[];
};

export type CreatorRow = {
  id: string;
  name: string;
  email: string | null;
  campaign_id: string | null;
  youtube_channel_url: string | null;
  youtube_channel_id: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  rate_per_short: number;
  active: boolean;
  payment_notes: string | null;
  last_synced_at: string | null;
};

export type CampaignRow = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
};

export type YoutubeVideoRecord = {
  creator_id: string;
  campaign_id: string | null;
  youtube_video_id: string;
  title: string;
  youtube_url: string;
  published_at: string;
  duration_seconds: number;
  is_short: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
};
