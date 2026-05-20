import { createCampaignAction, deleteCampaignAction } from "@/app/actions";
import { StatusPill } from "@/components/status-pill";
import { getCampaignsPageData } from "@/lib/data";
import { formatCurrency, formatNumber } from "@/lib/utils";
import Link from "next/link";

export default async function CampaignsPage() {
  const { campaigns, creators } = await getCampaignsPageData();

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Campaign Setup</p>
          <h2>Campaigns</h2>
          <p className="page-copy">Organize creators by subsidiary campaign so weekly payout reporting stays clean.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Add campaign</h3>
            <p className="panel-copy">Create reusable campaign buckets before assigning creators.</p>
          </div>
        </div>

        <form action={createCampaignAction} className="grid-form">
          <label className="field">
            <span className="field-label">Campaign name</span>
            <input className="input" name="name" placeholder="Spring UGC Push" required />
          </label>
          <label className="field field-span-2">
            <span className="field-label">Description</span>
            <textarea className="input textarea" name="description" placeholder="Optional accounting or ops context." />
          </label>
          <label className="checkbox">
            <input type="checkbox" name="active" defaultChecked />
            <span>Active campaign</span>
          </label>
          <div className="form-actions">
            <button className="button button-primary" type="submit">
              Save Campaign
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>All campaigns</h3>
            <p className="panel-copy">{campaigns.length} campaigns available for assignment.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Description</th>
                <th>Creators</th>
                <th>Avg Rate</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign: any) => {
                const relatedCreators = creators.filter((creator: any) => creator.campaign_id === campaign.id);
                const averageRate =
                  relatedCreators.length > 0
                    ? relatedCreators.reduce((sum: number, creator: any) => sum + Number(creator.rate_per_short ?? 0), 0) /
                      relatedCreators.length
                    : 0;

                return (
                  <tr key={campaign.id}>
                    <td>{campaign.name}</td>
                    <td>{campaign.description ?? "—"}</td>
                    <td>{formatNumber(relatedCreators.length)}</td>
                    <td>{formatCurrency(averageRate)}</td>
                    <td>
                      <StatusPill label={campaign.active ? "Active" : "Inactive"} tone={campaign.active ? "active" : "inactive"} />
                    </td>
                    <td className="row-actions">
                      <Link className="button button-secondary button-small" href={`/campaigns/${campaign.id}`}>
                        Edit
                      </Link>
                      <form action={deleteCampaignAction}>
                        <input type="hidden" name="id" value={campaign.id} />
                        <button className="button button-danger button-small" type="submit">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    Add your first campaign to start organizing creators.
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
