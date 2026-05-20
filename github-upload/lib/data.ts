import { createAdminClient } from "@/lib/supabase/admin";
import { getEnvChecklist } from "@/lib/env";
import { getWeekRange } from "@/lib/utils";

function maybeSingle<T>(data: T[] | null | undefined) {
  return data?.[0] ?? null;
}

export async function getDashboardData(week?: string) {
  const supabase = createAdminClient();
  const selectedWeek = getWeekRange(week);

  const { data: payouts, error } = await supabase
    .from("weekly_payouts")
    .select(
      "id, creator_id, campaign_id, shorts_count, total_views, rate_per_short, total_owed, status, paid_date, notes, creators(name, youtube_channel_id, youtube_channel_url), campaigns(name)",
    )
    .eq("week_start_date", selectedWeek.start)
    .order("total_owed", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (payouts ?? []) as any[];
  const owedRows = rows.filter((row) => Number(row.total_owed ?? 0) > 0);

  return {
    week: selectedWeek,
    rows,
    summary: {
      totalAmountOwed: owedRows.reduce((sum, row) => sum + Number(row.total_owed ?? 0), 0),
      totalCreatorsOwed: owedRows.length,
      totalShorts: owedRows.reduce((sum, row) => sum + Number(row.shorts_count ?? 0), 0),
      totalViews: owedRows.reduce((sum, row) => sum + Number(row.total_views ?? 0), 0),
    },
  };
}

export async function getCreatorsPageData() {
  const supabase = createAdminClient();
  const [{ data: creators, error: creatorsError }, { data: campaigns, error: campaignsError }] = await Promise.all([
    supabase
      .from("creators")
      .select(
        "id, name, email, campaign_id, youtube_channel_url, youtube_channel_id, instagram_handle, tiktok_handle, rate_per_short, active, payment_notes, last_synced_at, campaigns(name)",
      )
      .order("name", { ascending: true }),
    supabase.from("campaigns").select("id, name, active").order("name", { ascending: true }),
  ]);

  if (creatorsError) {
    throw creatorsError;
  }

  if (campaignsError) {
    throw campaignsError;
  }

  return {
    creators: (creators ?? []) as any[],
    campaigns: (campaigns ?? []) as any[],
  };
}

export async function getCreatorDetail(id: string) {
  const supabase = createAdminClient();
  const [{ data: creator, error: creatorError }, { data: campaigns, error: campaignsError }, { data: payouts, error: payoutsError }] =
    await Promise.all([
      supabase
        .from("creators")
        .select(
          "id, name, email, campaign_id, youtube_channel_url, youtube_channel_id, instagram_handle, tiktok_handle, rate_per_short, active, payment_notes, last_synced_at",
        )
        .eq("id", id),
      supabase.from("campaigns").select("id, name, active").order("name", { ascending: true }),
      supabase
        .from("weekly_payouts")
        .select("id, week_start_date, total_owed, shorts_count, total_views, status")
        .eq("creator_id", id)
        .order("week_start_date", { ascending: false })
        .limit(8),
    ]);

  if (creatorError) {
    throw creatorError;
  }

  if (campaignsError) {
    throw campaignsError;
  }

  if (payoutsError) {
    throw payoutsError;
  }

  return {
    creator: maybeSingle(creator as any[]),
    campaigns: (campaigns ?? []) as any[],
    payouts: (payouts ?? []) as any[],
  };
}

export async function getCampaignsPageData() {
  const supabase = createAdminClient();
  const [{ data: campaigns, error: campaignsError }, { data: creators, error: creatorsError }] = await Promise.all([
    supabase.from("campaigns").select("id, name, description, active").order("name", { ascending: true }),
    supabase.from("creators").select("id, campaign_id, active, rate_per_short").order("name", { ascending: true }),
  ]);

  if (campaignsError) {
    throw campaignsError;
  }

  if (creatorsError) {
    throw creatorsError;
  }

  return {
    campaigns: (campaigns ?? []) as any[],
    creators: (creators ?? []) as any[],
  };
}

export async function getCampaignDetail(id: string) {
  const supabase = createAdminClient();
  const [{ data: campaign, error: campaignError }, { data: creators, error: creatorsError }] = await Promise.all([
    supabase.from("campaigns").select("id, name, description, active").eq("id", id),
    supabase
      .from("creators")
      .select("id, name, email, active, rate_per_short")
      .eq("campaign_id", id)
      .order("name", { ascending: true }),
  ]);

  if (campaignError) {
    throw campaignError;
  }

  if (creatorsError) {
    throw creatorsError;
  }

  return {
    campaign: maybeSingle(campaign as any[]),
    creators: (creators ?? []) as any[],
  };
}

export async function getVideosPageData(week?: string) {
  const supabase = createAdminClient();
  const selectedWeek = getWeekRange(week);
  const from = `${selectedWeek.start}T00:00:00Z`;
  const until = `${selectedWeek.end}T23:59:59Z`;

  const { data, error } = await supabase
    .from("videos")
    .select(
      "id, title, youtube_url, published_at, duration_seconds, is_short, view_count, like_count, comment_count, last_synced_at, creators(name), campaigns(name)",
    )
    .gte("published_at", from)
    .lte("published_at", until)
    .order("published_at", { ascending: false })
    .limit(300);

  if (error) {
    throw error;
  }

  return {
    week: selectedWeek,
    videos: (data ?? []) as any[],
  };
}

export async function getWeeklyPayoutsPageData(week?: string) {
  return getDashboardData(week);
}

export async function getSettingsPageData() {
  const supabase = createAdminClient();
  const [
    { count: creatorCount, error: creatorsError },
    { count: campaignCount, error: campaignsError },
    { count: videoCount, error: videosError },
    { data: syncRuns, error: syncRunsError },
  ] = await Promise.all([
    supabase.from("creators").select("*", { count: "exact", head: true }),
    supabase.from("campaigns").select("*", { count: "exact", head: true }),
    supabase.from("videos").select("*", { count: "exact", head: true }),
    supabase.from("sync_runs").select("*").order("started_at", { ascending: false }).limit(10),
  ]);

  if (creatorsError) {
    throw creatorsError;
  }

  if (campaignsError) {
    throw campaignsError;
  }

  if (videosError) {
    throw videosError;
  }

  if (syncRunsError) {
    throw syncRunsError;
  }

  return {
    counts: {
      creators: creatorCount ?? 0,
      campaigns: campaignCount ?? 0,
      videos: videoCount ?? 0,
    },
    syncRuns: (syncRuns ?? []) as any[],
    envChecklist: getEnvChecklist(),
  };
}
