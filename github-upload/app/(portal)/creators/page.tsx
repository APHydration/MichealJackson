import { createCreatorAction, deleteCreatorAction } from "@/app/actions";
import { StatusPill } from "@/components/status-pill";
import { getCreatorsPageData } from "@/lib/data";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default async function CreatorsPage() {
  const { creators, campaigns } = await getCreatorsPageData();

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Creator Management</p>
          <h2>Creators</h2>
          <p className="page-copy">Add each subsidiary creator once, then let daily syncs keep Shorts and payouts current.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Add creator</h3>
            <p className="panel-copy">Channel ID is preferred, but a channel URL or @handle URL can be resolved automatically.</p>
          </div>
        </div>

        <form action={createCreatorAction} className="grid-form">
          <label className="field">
            <span className="field-label">Name</span>
            <input className="input" name="name" placeholder="Creator name" required />
          </label>
          <label className="field">
            <span className="field-label">Email</span>
            <input className="input" name="email" type="email" placeholder="creator@example.com" />
          </label>
          <label className="field">
            <span className="field-label">Campaign</span>
            <select className="input" name="campaignId" defaultValue="">
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
            <input className="input" name="ratePerShort" type="number" min="0" step="0.01" placeholder="25.00" required />
          </label>
          <label className="field field-span-2">
            <span className="field-label">YouTube channel URL</span>
            <input className="input" name="youtubeChannelUrl" placeholder="https://www.youtube.com/@creator" />
          </label>
          <label className="field field-span-2">
            <span className="field-label">YouTube channel ID</span>
            <input className="input" name="youtubeChannelId" placeholder="UCxxxxxxxxxxxxxxxxxxxxxx" />
          </label>
          <label className="field">
            <span className="field-label">Instagram handle</span>
            <input className="input" name="instagramHandle" placeholder="@creator" />
          </label>
          <label className="field">
            <span className="field-label">TikTok handle</span>
            <input className="input" name="tiktokHandle" placeholder="@creator" />
          </label>
          <label className="field field-span-2">
            <span className="field-label">Payment notes</span>
            <textarea className="input textarea" name="paymentNotes" placeholder="ACH details, vendor notes, or special reminders." />
          </label>
          <label className="checkbox">
            <input type="checkbox" name="active" defaultChecked />
            <span>Active creator</span>
          </label>
          <div className="form-actions">
            <button className="button button-primary" type="submit">
              Save Creator
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>All creators</h3>
            <p className="panel-copy">{creators.length} creator accounts in the system.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Campaign</th>
                <th>Channel ID</th>
                <th>Rate</th>
                <th>Last Sync</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {creators.map((creator: any) => (
                <tr key={creator.id}>
                  <td>{creator.name}</td>
                  <td>{creator.campaigns?.name ?? "Unassigned"}</td>
                  <td>{creator.youtube_channel_id ?? "Missing"}</td>
                  <td>{formatCurrency(creator.rate_per_short)}</td>
                  <td>{formatDateTime(creator.last_synced_at)}</td>
                  <td>
                    <StatusPill label={creator.active ? "Active" : "Inactive"} tone={creator.active ? "active" : "inactive"} />
                  </td>
                  <td className="row-actions">
                    <Link className="button button-secondary button-small" href={`/creators/${creator.id}`}>
                      Edit
                    </Link>
                    <form action={deleteCreatorAction}>
                      <input type="hidden" name="id" value={creator.id} />
                      <button className="button button-danger button-small" type="submit">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {creators.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    Add your first creator to start syncing Shorts.
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
