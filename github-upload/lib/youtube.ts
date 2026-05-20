import { getEnv } from "@/lib/env";
import { buildYoutubeChannelUrl, buildYoutubeVideoUrl } from "@/lib/utils";

type PlaylistItem = {
  contentDetails?: {
    videoId?: string;
    videoPublishedAt?: string;
  };
  snippet?: {
    publishedAt?: string;
  };
};

type VideoDetail = {
  id: string;
  snippet?: {
    title?: string;
    publishedAt?: string;
  };
  contentDetails?: {
    duration?: string;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
};

const API_BASE = "https://youtube.googleapis.com/youtube/v3";

async function youtubeFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const { youtubeApiKey } = getEnv();
  const searchParams = new URLSearchParams({
    ...params,
    key: youtubeApiKey,
  });

  const response = await fetch(`${API_BASE}${path}?${searchParams.toString()}`, {
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`YouTube API error (${response.status}): ${message}`);
  }

  return (await response.json()) as T;
}

function parseIsoDuration(value: string): number {
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) {
    return 0;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function extractChannelReference(input: string) {
  let raw = input.trim();

  if (/^(www\.)?youtube\.com\//i.test(raw)) {
    raw = `https://${raw}`;
  }

  if (/^UC[\w-]{20,}$/.test(raw)) {
    return { type: "channelId" as const, value: raw };
  }

  if (raw.startsWith("@")) {
    return { type: "handle" as const, value: raw.slice(1) };
  }

  if (!raw.startsWith("http")) {
    return { type: "search" as const, value: raw };
  }

  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    return { type: "search" as const, value: raw };
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const first = segments[0] ?? "";
  const second = segments[1] ?? "";

  if (first === "channel" && second) {
    return { type: "channelId" as const, value: second };
  }

  if (first.startsWith("@")) {
    return { type: "handle" as const, value: first.slice(1) };
  }

  if (first === "user" && second) {
    return { type: "username" as const, value: second };
  }

  if (first === "c" && second) {
    return { type: "search" as const, value: second };
  }

  return { type: "search" as const, value: first || raw };
}

export async function resolveChannelId(channelInput: string): Promise<string> {
  const reference = extractChannelReference(channelInput);

  if (reference.type === "channelId") {
    return reference.value;
  }

  if (reference.type === "handle") {
    const response = await youtubeFetch<{ items?: Array<{ id?: string }> }>("/channels", {
      part: "id",
      forHandle: reference.value,
      maxResults: "1",
    });
    const id = response.items?.[0]?.id;

    if (id) {
      return id;
    }
  }

  if (reference.type === "username") {
    const response = await youtubeFetch<{ items?: Array<{ id?: string }> }>("/channels", {
      part: "id",
      forUsername: reference.value,
      maxResults: "1",
    });
    const id = response.items?.[0]?.id;

    if (id) {
      return id;
    }
  }

  const searchResponse = await youtubeFetch<{ items?: Array<{ snippet?: { channelId?: string } }> }>("/search", {
    part: "snippet",
    type: "channel",
    q: reference.value,
    maxResults: "1",
  });

  const searchedChannelId = searchResponse.items?.[0]?.snippet?.channelId;

  if (!searchedChannelId) {
    throw new Error(`Could not resolve a YouTube channel ID from "${channelInput}".`);
  }

  return searchedChannelId;
}

export async function fetchRecentChannelVideos(channelId: string, lookbackDays: number) {
  const channelResponse = await youtubeFetch<{
    items?: Array<{
      contentDetails?: {
        relatedPlaylists?: {
          uploads?: string;
        };
      };
      snippet?: {
        title?: string;
      };
    }>;
  }>("/channels", {
    part: "contentDetails,snippet",
    id: channelId,
  });

  const channel = channelResponse.items?.[0];
  const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    throw new Error(`No uploads playlist found for channel ${channelId}.`);
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - lookbackDays);

  const collectedVideoIds: string[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < 5; page += 1) {
    const playlistResponse = await youtubeFetch<{
      nextPageToken?: string;
      items?: PlaylistItem[];
    }>("/playlistItems", {
      part: "contentDetails,snippet",
      playlistId: uploadsPlaylistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });

    const items = playlistResponse.items ?? [];
    const hasRecentVideo = items.some((item) => {
      const publishedAt = item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt;
      return publishedAt ? new Date(publishedAt) >= cutoff : false;
    });

    items.forEach((item) => {
      const publishedAt = item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt;
      const videoId = item.contentDetails?.videoId;

      if (videoId && publishedAt && new Date(publishedAt) >= cutoff) {
        collectedVideoIds.push(videoId);
      }
    });

    if (!playlistResponse.nextPageToken || !hasRecentVideo) {
      break;
    }

    pageToken = playlistResponse.nextPageToken;
  }

  const uniqueVideoIds = [...new Set(collectedVideoIds)];
  const detailedVideos: VideoDetail[] = [];

  for (let index = 0; index < uniqueVideoIds.length; index += 50) {
    const slice = uniqueVideoIds.slice(index, index + 50);
    const videoResponse = await youtubeFetch<{ items?: VideoDetail[] }>("/videos", {
      part: "snippet,contentDetails,statistics",
      id: slice.join(","),
      maxResults: "50",
    });
    detailedVideos.push(...(videoResponse.items ?? []));
  }

  return {
    channelId,
    channelTitle: channel?.snippet?.title ?? channelId,
    channelUrl: buildYoutubeChannelUrl(channelId),
    videos: detailedVideos.map((video) => {
      const durationSeconds = parseIsoDuration(video.contentDetails?.duration ?? "PT0S");
      return {
        youtube_video_id: video.id,
        title: video.snippet?.title ?? "Untitled video",
        youtube_url: buildYoutubeVideoUrl(video.id),
        published_at: video.snippet?.publishedAt ?? new Date().toISOString(),
        duration_seconds: durationSeconds,
        is_short: durationSeconds < 60,
        view_count: Number(video.statistics?.viewCount ?? 0),
        like_count: Number(video.statistics?.likeCount ?? 0),
        comment_count: Number(video.statistics?.commentCount ?? 0),
      };
    }),
  };
}
