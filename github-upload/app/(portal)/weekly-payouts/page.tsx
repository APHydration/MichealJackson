import { updatePayoutNotesAction, updatePayoutStatusAction } from "@/app/actions";
import { StatusPill } from "@/components/status-pill";
import { WeekSelector } from "@/components/week-selector";
import { getWeeklyPayoutsPageData } from "@/lib/data";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

type PageProps = {
  searchParams?: Promise<{
    week?: string;
  }>;
};

export default async function WeeklyPayoutsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const { week, rows, summary } = await getWeeklyPayoutsPageData(resolvedSearchParams.week);

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Accounting Queue</p>
          <h2>Weekly Payouts</h2>
          <p className="page-copy">Review the selected week, add internal notes if needed, and mark payouts as paid.</p>
        </div>
        <div className="toolbar">
          <WeekSelector action="/weekly-payouts" selectedWeek={week} />
          <a className="button button-secondary" href={`/api/payouts/export?week=${week.start}`}>
            Export CSV
          </a>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>{week.label}</h3>
            <p className="panel-copy">
              {formatNumber(summary.totalCreatorsOwed)} creators owed, {formatCurrency(summary.totalAmountOwed)} total.
            </p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Campaign</th>
                <th>Shorts</th>
                <th>Views</th>
                <th>Rate</th>
                <th>Total Owed</th>
                <th>Status</th>
                <th>Paid Date</th>
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.creators?.name ?? "Unknown creator"}</td>
                  <td>{row.campaigns?.name ?? "Unassigned"}</td>
                  <td>{formatNumber(row.shorts_count)}</td>
                  <td>{formatNumber(row.total_views)}</td>
                  <td>{formatCurrency(row.rate_per_short)}</td>
                  <td>{formatCurrency(row.total_owed)}</td>
                  <td>
                    <StatusPill label={row.status === "paid" ? "Paid" : "Unpaid"} tone={row.status === "paid" ? "paid" : "unpaid"} />
                  </td>
                  <td>{formatDate(row.paid_date)}</td>
                  <td>
                    <form action={updatePayoutNotesAction} className="inline-form">
                      <input type="hidden" name="payoutId" value={row.id} />
                      <input type="hidden" name="redirectTo" value={`/weekly-payouts?week=${week.start}`} />
                      <input className="input input-compact" name="notes" defaultValue={row.notes ?? ""} placeholder="Internal note" />
                      <button className="button button-secondary button-small" type="submit">
                        Save
                      </button>
                    </form>
                  </td>
                  <td>
                    <form action={updatePayoutStatusAction}>
                      <input type="hidden" name="payoutId" value={row.id} />
                      <input type="hidden" name="nextStatus" value={row.status === "paid" ? "unpaid" : "paid"} />
                      <input type="hidden" name="redirectTo" value={`/weekly-payouts?week=${week.start}`} />
                      <button className="button button-primary button-small" type="submit">
                        {row.status === "paid" ? "Mark Unpaid" : "Mark Paid"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="empty-cell">
                    No payout rows found for the selected week.
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
