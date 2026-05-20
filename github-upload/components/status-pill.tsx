type StatusTone =
  | "paid"
  | "unpaid"
  | "active"
  | "inactive"
  | "running"
  | "completed"
  | "completed_with_errors"
  | "failed";

const toneClassMap: Record<StatusTone, string> = {
  paid: "status-pill status-pill-paid",
  unpaid: "status-pill status-pill-unpaid",
  active: "status-pill status-pill-active",
  inactive: "status-pill status-pill-inactive",
  running: "status-pill status-pill-running",
  completed: "status-pill status-pill-completed",
  completed_with_errors: "status-pill status-pill-running",
  failed: "status-pill status-pill-failed",
};

export function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return <span className={toneClassMap[tone]}>{label}</span>;
}
