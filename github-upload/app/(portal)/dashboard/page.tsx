import { SyncButton } from "@/components/sync-button";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { WeekSelector } from "@/components/week-selector";
import { updatePayoutStatusAction } from "@/app/actions";
import { getDashboardData } from "@/lib/data";
import { formatCurrency, formatNumber } from "@/lib/utils";

type PageProps = {
  searchParams?: Promise<{
    week?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const { week, rows, summary } = await getDashboardData(resolvedSearchParams.week);

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Dashboard</h2>
          <p className="page-copy">A weekly snapshot of who posted Shorts, how much is owed, and what has been paid.</p>
        </div>
        <div className="toolbar">
          <WeekSelector action="/dashboard" selectedWeek={week} />
          <a className="button button-secondary" href={`/api/payouts/export?week=${week.start}`}>
            Export CSV
          </a>
          <SyncButton />
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Amount Owed" value={formatCurrency(summary.totalAmountOwed)} helper={week.label} />
        <StatCard label="Creators Owed" value={formatNumber(summary.totalCreatorsOwed)} helper="With payout activity" />
        <StatCard label="Shorts Posted" value={formatNumber(summary.totalShorts)} helper="Videos under 60 seconds" />
        <StatCard label="Total Views" value={formatNumber(summary.totalViews)} helper="Across all Shorts this week" />
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Weekly payout detail</h3>
            <p className="panel-copy">{week.label}</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Creator</th>
                <th>YouTube Channel</th>
                <th>Campaign</th>
                <th>Shorts</th>
                <th>Views</th>
                <th>Rate / Short</th>
                <th>Total Owed</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.creators?.name ?? "Unknown creator"}</td>
                  <td>
                    <a href={row.creators?.youtube_channel_url ?? "#"} target="_blank" rel="noreferrer">
                      {row.creators?.youtube_channel_id ?? "Open channel"}
                    </a>
                  </td>
                  <td>{row.campaigns?.name ?? "Unassigned"}</td>
                  <td>{formatNumber(row.shorts_count)}</td>
                  <td>{formatNumber(row.total_views)}</td>
                  <td>{formatCurrency(row.rate_per_short)}</td>
                  <td>{formatCurrency(row.total_owed)}</td>
                  <td>
                    <StatusPill
                      label={row.status === "paid" ? "Paid" : "Unpaid"}
                      tone={row.status === "paid" ? "paid" : "unpaid"}
                    />
                  </td>
                  <td>
                    <form action={updatePayoutStatusAction}>
                      <input type="hidden" name="payoutId" value={row.id} />
                      <input type="hidden" name="nextStatus" value={row.status === "paid" ? "unpaid" : "paid"} />
                      <input type="hidden" name="redirectTo" value={`/dashboard?week=${week.start}`} />
                      <button className="button button-secondary button-small" type="submit">
                        {row.status === "paid" ? "Mark Unpaid" : "Mark Paid"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-cell">
                    No payout rows yet for this week.
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
