import { deleteCampaignAction, updateCampaignAction } from "@/app/actions";
import { StatusPill } from "@/components/status-pill";
import { getCampaignDetail } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { campaign, creators } = await getCampaignDetail(id);

  if (!campaign) {
    notFound();
  }

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Campaign Detail</p>
          <h2>{campaign.name}</h2>
          <p className="page-copy">Update campaign metadata and review the creators currently tied to it.</p>
        </div>
        <Link className="button button-secondary" href="/campaigns">
          Back to Campaigns
        </Link>
      </div>

      <section className="panel panel-split">
        <div>
          <div className="panel-header">
            <div>
              <h3>Edit campaign</h3>
              <p className="panel-copy">Changes flow through creator assignments and reporting views automatically.</p>
            </div>
          </div>

          <form action={updateCampaignAction} className="grid-form">
            <input type="hidden" name="id" value={campaign.id} />
            <label className="field">
              <span className="field-label">Campaign name</span>
              <input className="input" name="name" defaultValue={campaign.name} required />
            </label>
            <label className="field field-span-2">
              <span className="field-label">Description</span>
              <textarea className="input textarea" name="description" defaultValue={campaign.description ?? ""} />
            </label>
            <label className="checkbox">
              <input type="checkbox" name="active" defaultChecked={campaign.active} />
              <span>Active campaign</span>
            </label>
            <div className="form-actions">
              <button className="button button-primary" type="submit">
                Update Campaign
              </button>
            </div>
          </form>
        </div>

        <aside className="detail-sidebar">
          <div className="detail-card">
            <p className="detail-label">Current status</p>
            <StatusPill label={campaign.active ? "Active" : "Inactive"} tone={campaign.active ? "active" : "inactive"} />
          </div>
          <div className="detail-card">
            <p className="detail-label">Delete campaign</p>
            <p className="panel-copy">Deleting a campaign leaves creator records in place but removes this assignment.</p>
            <form action={deleteCampaignAction}>
              <input type="hidden" name="id" value={campaign.id} />
              <button className="button button-danger button-full" type="submit">
                Delete Campaign
              </button>
            </form>
          </div>
        </aside>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Assigned creators</h3>
            <p className="panel-copy">{creators.length} creators currently linked to this campaign.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Email</th>
                <th>Status</th>
                <th>Rate / Short</th>
              </tr>
            </thead>
            <tbody>
              {creators.map((creator: any) => (
                <tr key={creator.id}>
                  <td>{creator.name}</td>
                  <td>{creator.email ?? "—"}</td>
                  <td>
                    <StatusPill label={creator.active ? "Active" : "Inactive"} tone={creator.active ? "active" : "inactive"} />
                  </td>
                  <td>{formatCurrency(creator.rate_per_short)}</td>
                </tr>
              ))}
              {creators.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-cell">
                    No creators assigned yet.
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
