import { getEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreatorRow, SyncSummary, YoutubeVideoRecord } from "@/lib/types";
import { getBusinessDateString, getWeekRange, startOfWeek, toIsoDate, toMoneyNumber } from "@/lib/utils";
import { fetchRecentChannelVideos, resolveChannelId } from "@/lib/youtube";

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function createSyncRun() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("sync_runs")
    .insert({
      run_type: "daily_sync",
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  return data?.id as string | undefined;
}

async function completeSyncRun(syncRunId: string | undefined, updates: Record<string, unknown>) {
  if (!syncRunId) {
    return;
  }

  const supabase = createAdminClient();
  await supabase.from("sync_runs").update(updates).eq("id", syncRunId);
}

async function syncCreator(creator: CreatorRow, lookbackDays: number) {
  const supabase = createAdminClient();
  const channelId =
    creator.youtube_channel_id?.trim() ||
    (creator.youtube_channel_url ? await resolveChannelId(creator.youtube_channel_url) : "");

  if (!channelId) {
    throw new Error(`Creator "${creator.name}" is missing a YouTube channel ID or resolvable URL.`);
  }

  const channelData = await fetchRecentChannelVideos(channelId, lookbackDays);
  const now = new Date().toISOString();

  const records: YoutubeVideoRecord[] = channelData.videos.map((video) => ({
    creator_id: creator.id,
    campaign_id: creator.campaign_id,
    youtube_video_id: video.youtube_video_id,
    title: video.title,
    youtube_url: video.youtube_url,
    published_at: video.published_at,
    duration_seconds: video.duration_seconds,
    is_short: video.is_short,
    view_count: video.view_count,
    like_count: video.like_count,
    comment_count: video.comment_count,
  }));

  if (records.length > 0) {
    for (const batch of chunk(records, 200)) {
      const payload = batch.map((record) => ({
        ...record,
        last_synced_at: now,
      }));
      const { error } = await supabase.from("videos").upsert(payload, {
        onConflict: "youtube_video_id",
      });

      if (error) {
        throw error;
      }
    }
  }

  const { error: creatorError } = await supabase
    .from("creators")
    .update({
      youtube_channel_id: channelData.channelId,
      youtube_channel_url: channelData.channelUrl,
      last_synced_at: now,
      updated_at: now,
    })
    .eq("id", creator.id);

  if (creatorError) {
    throw creatorError;
  }

  return records.length;
}

export async function recalculateWeeklyPayouts() {
  const supabase = createAdminClient();
  const { youtubeSyncLookbackDays } = getEnv();
  const earliestDate = new Date();
  earliestDate.setUTCDate(earliestDate.getUTCDate() - youtubeSyncLookbackDays);
  const earliestWeek = toIsoDate(startOfWeek(earliestDate));

  const [{ data: creators, error: creatorsError }, { data: videos, error: videosError }, { data: existingPayouts, error: payoutsError }] =
    await Promise.all([
      supabase
        .from("creators")
        .select("id, campaign_id, rate_per_short, active, name")
        .order("name", { ascending: true }),
      supabase
        .from("videos")
        .select("creator_id, campaign_id, published_at, is_short, view_count")
        .gte("published_at", `${earliestWeek}T00:00:00Z`)
        .eq("is_short", true),
      supabase
        .from("weekly_payouts")
        .select("id, creator_id, campaign_id, week_start_date, status, paid_date, notes")
        .gte("week_start_date", earliestWeek),
    ]);

  if (creatorsError) {
    throw creatorsError;
  }

  if (videosError) {
    throw videosError;
  }

  if (payoutsError) {
    throw payoutsError;
  }

  const creatorList = (creators ?? []) as Array<{
    id: string;
    campaign_id: string | null;
    rate_per_short: number;
    active: boolean;
  }>;

  const payoutMap = new Map(
    (existingPayouts ?? []).map((row: any) => [
      `${row.creator_id}:${row.week_start_date}`,
      row,
    ]),
  );

  const weeklyAggregates = new Map<
    string,
    {
      creatorId: string;
      campaignId: string | null;
      weekStart: string;
      shortsCount: number;
      totalViews: number;
    }
  >();

  for (const video of (videos ?? []) as Array<any>) {
    const weekStart = getWeekRange(getBusinessDateString(video.published_at)).start;
    const key = `${video.creator_id}:${weekStart}`;
    const current = weeklyAggregates.get(key) ?? {
      creatorId: video.creator_id,
      campaignId: video.campaign_id ?? null,
      weekStart,
      shortsCount: 0,
      totalViews: 0,
    };

    current.shortsCount += 1;
    current.totalViews += Number(video.view_count ?? 0);
    if (!current.campaignId && video.campaign_id) {
      current.campaignId = video.campaign_id;
    }

    weeklyAggregates.set(key, current);
  }

  const weekRanges: string[] = [];
  const anchor = startOfWeek(new Date());
  const cursor = startOfWeek(earliestDate);

  while (cursor <= anchor) {
    weekRanges.push(toIsoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  const rows = creatorList.flatMap((creator) =>
    weekRanges.map((weekStart) => {
      const aggregate = weeklyAggregates.get(`${creator.id}:${weekStart}`);
      const existing = payoutMap.get(`${creator.id}:${weekStart}`) as
        | {
            campaign_id: string | null;
            status: "paid" | "unpaid";
            paid_date: string | null;
            notes: string | null;
          }
        | undefined;
      const startDate = new Date(`${weekStart}T00:00:00Z`);
      const endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + 6);
      const shortsCount = aggregate?.shortsCount ?? 0;
      const totalViews = aggregate?.totalViews ?? 0;
      const ratePerShort = Number(creator.rate_per_short ?? 0);

      return {
        creator_id: creator.id,
        campaign_id: existing?.campaign_id ?? aggregate?.campaignId ?? creator.campaign_id,
        week_start_date: weekStart,
        week_end_date: toIsoDate(endDate),
        shorts_count: shortsCount,
        total_views: totalViews,
        rate_per_short: toMoneyNumber(String(ratePerShort)),
        total_owed: toMoneyNumber(String(shortsCount * ratePerShort)),
        status: existing?.status ?? "unpaid",
        paid_date: existing?.paid_date ?? null,
        notes: existing?.notes ?? null,
      };
    }),
  );

  if (rows.length > 0) {
    for (const batch of chunk(rows, 200)) {
      const { error } = await supabase.from("weekly_payouts").upsert(batch, {
        onConflict: "creator_id,week_start_date",
      });

      if (error) {
        throw error;
      }
    }
  }

  return rows.length;
}

export async function syncAllCreatorsAndPayouts(): Promise<SyncSummary> {
  const supabase = createAdminClient();
  const { youtubeSyncLookbackDays } = getEnv();
  const syncRunId = await createSyncRun();
  const summary: SyncSummary = {
    creatorsProcessed: 0,
    creatorsSucceeded: 0,
    creatorsFailed: 0,
    videosUpserted: 0,
    payoutsUpserted: 0,
    errors: [],
  };

  try {
    const { data: creators, error } = await supabase
      .from("creators")
      .select(
        "id, name, email, campaign_id, youtube_channel_url, youtube_channel_id, instagram_handle, tiktok_handle, rate_per_short, active, payment_notes, last_synced_at",
      )
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    for (const creator of (creators ?? []) as CreatorRow[]) {
      summary.creatorsProcessed += 1;

      try {
        const upsertedCount = await syncCreator(creator, youtubeSyncLookbackDays);
        summary.creatorsSucceeded += 1;
        summary.videosUpserted += upsertedCount;
      } catch (creatorError) {
        summary.creatorsFailed += 1;
        summary.errors.push(
          creatorError instanceof Error ? `${creator.name}: ${creatorError.message}` : `${creator.name}: Sync failed.`,
        );
      }
    }

    summary.payoutsUpserted = await recalculateWeeklyPayouts();

    await completeSyncRun(syncRunId, {
      status: summary.creatorsFailed > 0 ? "completed_with_errors" : "completed",
      finished_at: new Date().toISOString(),
      creators_processed: summary.creatorsProcessed,
      creators_succeeded: summary.creatorsSucceeded,
      creators_failed: summary.creatorsFailed,
      videos_upserted: summary.videosUpserted,
      payouts_upserted: summary.payoutsUpserted,
      error_message: summary.errors.join("\n") || null,
    });

    return summary;
  } catch (error) {
    await completeSyncRun(syncRunId, {
      status: "failed",
      finished_at: new Date().toISOString(),
      creators_processed: summary.creatorsProcessed,
      creators_succeeded: summary.creatorsSucceeded,
      creators_failed: summary.creatorsFailed,
      videos_upserted: summary.videosUpserted,
      payouts_upserted: summary.payoutsUpserted,
      error_message: error instanceof Error ? error.message : "Unknown sync failure",
    });

    throw error;
  }
}
