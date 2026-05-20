import { deleteCreatorAction, updateCreatorAction } from "@/app/actions";
import { StatusPill } from "@/components/status-pill";
import { getCreatorDetail } from "@/lib/data";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CreatorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { creator, campaigns, payouts } = await getCreatorDetail(id);

  if (!creator) {
    notFound();
  }

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Creator Detail</p>
          <h2>{creator.name}</h2>
          <p className="page-copy">Update creator info, keep the stable channel ID in place, and review recent payout history.</p>
        </div>
        <Link className="button button-secondary" href="/creators">
          Back to Creators
        </Link>
      </div>

      <section className="panel panel-split">
        <div>
          <div className="panel-header">
            <div>
              <h3>Edit creator</h3>
              <p className="panel-copy">Last synced {formatDateTime(creator.last_synced_at)}</p>
            </div>
          </div>

          <form action={updateCreatorAction} className="grid-form">
            <input type="hidden" name="id" value={creator.id} />
            <label className="field">
              <span className="field-label">Name</span>
              <input className="input" name="name" defaultValue={creator.name} required />
            </label>
            <label className="field">
              <span className="field-label">Email</span>
              <input className="input" name="email" type="email" defaultValue={creator.email ?? ""} />
            </label>
            <label className="field">
              <span className="field-label">Campaign</span>
              <select className="input" name="campaignId" defaultValue={creator.campaign_id ?? ""}>
                <option value="">Unassigned</option>
                {campaigns.map((campaign: any) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Rate per Short</span>
              <input
                className="input"
                name="ratePerShort"
                type="number"
                min="0"
                step="0.01"
                defaultValue={creator.rate_per_short}
                required
              />
            </label>
            <label className="field field-span-2">
              <span className="field-label">YouTube channel URL</span>
              <input className="input" name="youtubeChannelUrl" defaultValue={creator.youtube_channel_url ?? ""} />
            </label>
            <label className="field field-span-2">
              <span className="field-label">YouTube channel ID</span>
              <input className="input" name="youtubeChannelId" defaultValue={creator.youtube_channel_id ?? ""} />
            </label>
            <label className="field">
              <span className="field-label">Instagram handle</span>
              <input className="input" name="instagramHandle" defaultValue={creator.instagram_handle ?? ""} />
            </label>
            <label className="field">
              <span className="field-label">TikTok handle</span>
              <input className="input" name="tiktokHandle" defaultValue={creator.tiktok_handle ?? ""} />
            </label>
            <label className="field field-span-2">
              <span className="field-label">Payment notes</span>
              <textarea className="input textarea" name="paymentNotes" defaultValue={creator.payment_notes ?? ""} />
            </label>
            <label className="checkbox">
              <input type="checkbox" name="active" defaultChecked={creator.active} />
              <span>Active creator</span>
            </label>
            <div className="form-actions">
              <button className="button button-primary" type="submit">
                Update Creator
              </button>
            </div>
          </form>
        </div>

        <aside className="detail-sidebar">
          <div className="detail-card">
            <p className="detail-label">Current status</p>
            <StatusPill label={creator.active ? "Active" : "Inactive"} tone={creator.active ? "active" : "inactive"} />
          </div>
          <div className="detail-card">
            <p className="detail-label">Delete creator</p>
            <p className="panel-copy">This removes the creator and synced data tied to that record.</p>
            <form action={deleteCreatorAction}>
              <input type="hidden" name="id" value={creator.id} />
              <button className="button button-danger button-full" type="submit">
                Delete Creator
              </button>
            </form>
          </div>
        </aside>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Recent payout rows</h3>
            <p className="panel-copy">Latest automatically generated weekly totals for this creator.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Week Start</th>
                <th>Shorts</th>
                <th>Views</th>
                <th>Total Owed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout: any) => (
                <tr key={payout.id}>
                  <td>{payout.week_start_date}</td>
                  <td>{formatNumber(payout.shorts_count)}</td>
                  <td>{formatNumber(payout.total_views)}</td>
                  <td>{formatCurrency(payout.total_owed)}</td>
                  <td>
                    <StatusPill label={payout.status === "paid" ? "Paid" : "Unpaid"} tone={payout.status === "paid" ? "paid" : "unpaid"} />
                  </td>
                </tr>
              ))}
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    No payout rows yet.
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
