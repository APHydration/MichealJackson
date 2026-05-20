import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { WeekSelector } from "@/components/week-selector";
import { getVideosPageData } from "@/lib/data";
import { formatDateTime, formatDuration, formatNumber } from "@/lib/utils";

type PageProps = {
  searchParams?: Promise<{
    week?: string;
  }>;
};

export default async function VideosPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const { week, videos } = await getVideosPageData(resolvedSearchParams.week);
  const shortVideos = videos.filter((video: any) => video.is_short);

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Synced Content</p>
          <h2>Videos</h2>
          <p className="page-copy">Every synced YouTube upload stays stored here, with Shorts identified automatically by duration.</p>
        </div>
        <div className="toolbar">
          <WeekSelector action="/videos" selectedWeek={week} />
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Videos in Week" value={formatNumber(videos.length)} helper={week.label} />
        <StatCard label="Shorts in Week" value={formatNumber(shortVideos.length)} helper="Duration under 60 seconds" />
        <StatCard
          label="Views in Week"
          value={formatNumber(videos.reduce((sum: number, video: any) => sum + Number(video.view_count ?? 0), 0))}
          helper="Current lifetime views from YouTube"
        />
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Video log</h3>
            <p className="panel-copy">{week.label}</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Creator</th>
                <th>Campaign</th>
                <th>Published</th>
                <th>Duration</th>
                <th>Short?</th>
                <th>Views</th>
                <th>Likes</th>
                <th>Comments</th>
                <th>Last Synced</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video: any) => (
                <tr key={video.id}>
                  <td>
                    <a href={video.youtube_url} target="_blank" rel="noreferrer">
                      {video.title}
                    </a>
                  </td>
                  <td>{video.creators?.name ?? "Unknown creator"}</td>
                  <td>{video.campaigns?.name ?? "Unassigned"}</td>
                  <td>{formatDateTime(video.published_at)}</td>
                  <td>{formatDuration(video.duration_seconds)}</td>
                  <td>
                    <StatusPill label={video.is_short ? "Short" : "Long-form"} tone={video.is_short ? "active" : "inactive"} />
                  </td>
                  <td>{formatNumber(video.view_count)}</td>
                  <td>{formatNumber(video.like_count)}</td>
                  <td>{formatNumber(video.comment_count)}</td>
                  <td>{formatDateTime(video.last_synced_at)}</td>
                </tr>
              ))}
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={10} className="empty-cell">
                    No videos found for the selected week.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
