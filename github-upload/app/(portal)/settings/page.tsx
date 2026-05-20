import { SyncButton } from "@/components/sync-button";
import { StatusPill } from "@/components/status-pill";
import { getSettingsPageData } from "@/lib/data";
import { getEnvSnapshot } from "@/lib/env";
import { formatDateTime, formatNumber, maskSecret } from "@/lib/utils";

export default async function SettingsPage() {
  const { counts, syncRuns, envChecklist } = await getSettingsPageData();
  const env = getEnvSnapshot();

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h2>Settings</h2>
          <p className="page-copy">Check environment readiness, trigger a sync, and verify that cron automation is pointed at the right route.</p>
        </div>
        <SyncButton />
      </div>

      <div className="stat-grid">
        <StatCardShim label="Creators" value={formatNumber(counts.creators)} helper="Tracked creator records" />
        <StatCardShim label="Campaigns" value={formatNumber(counts.campaigns)} helper="Campaign buckets" />
        <StatCardShim label="Videos" value={formatNumber(counts.videos)} helper="Synced YouTube uploads" />
      </div>

      <section className="panel panel-split">
        <div>
          <div className="panel-header">
            <div>
              <h3>Environment checklist</h3>
              <p className="panel-copy">These values must be present for auth, sync, and cron to work.</p>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {envChecklist.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>
                      <StatusPill label={item.present ? "Present" : "Missing"} tone={item.present ? "active" : "failed"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="detail-sidebar">
          <div className="detail-card">
            <p className="detail-label">Cron endpoint</p>
            <p className="detail-value">{`${env.appUrl}/api/cron/sync`}</p>
            <p className="panel-copy">Call this once per day with the bearer token below.</p>
          </div>
          <div className="detail-card">
            <p className="detail-label">Cron secret</p>
            <p className="detail-value">{maskSecret(env.cronSecret)}</p>
          </div>
          <div className="detail-card">
            <p className="detail-label">YouTube lookback</p>
            <p className="detail-value">{env.youtubeSyncLookbackDays} days</p>
          </div>
        </aside>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Recent sync runs</h3>
            <p className="panel-copy">Daily cron and manual sync attempts land here for quick auditing.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Started</th>
                <th>Finished</th>
                <th>Status</th>
                <th>Creators</th>
                <th>Videos</th>
                <th>Payout Rows</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
                {syncRuns.map((run: any) => {
                const tone =
                  run.status === "completed"
                    ? "completed"
                    : run.status === "running"
                      ? "running"
                      : run.status === "completed_with_errors"
                        ? "completed_with_errors"
                        : run.status === "failed"
                          ? "failed"
                          : "unpaid";

                return (
                  <tr key={run.id}>
                    <td>{formatDateTime(run.started_at)}</td>
                    <td>{formatDateTime(run.finished_at)}</td>
                    <td>
                      <StatusPill label={run.status} tone={tone} />
                    </td>
                    <td>{formatNumber(run.creators_processed)}</td>
                    <td>{formatNumber(run.videos_upserted)}</td>
                    <td>{formatNumber(run.payouts_upserted)}</td>
                    <td>{run.error_message ?? "—"}</td>
                  </tr>
                );
              })}
              {syncRuns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    No sync runs recorded yet.
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

function StatCardShim({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <article className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {helper ? <p className="stat-helper">{helper}</p> : null}
    </article>
  );
}
