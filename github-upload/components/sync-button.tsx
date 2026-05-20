"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runSync() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Sync failed.");
      }

      setMessage(
        `Synced ${payload.summary.creatorsSucceeded}/${payload.summary.creatorsProcessed} creators and refreshed ${payload.summary.payoutsUpserted} payout rows.`,
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sync-button-wrap">
      <button className="button button-primary" type="button" onClick={runSync} disabled={loading}>
        {loading ? "Syncing..." : "Sync Now"}
      </button>
      {message ? <p className="toolbar-copy">{message}</p> : null}
    </div>
  );
}
