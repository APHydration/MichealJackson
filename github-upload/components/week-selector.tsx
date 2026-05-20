import type { WeekRange } from "@/lib/types";

export function WeekSelector({
  action,
  selectedWeek,
}: {
  action: string;
  selectedWeek: WeekRange;
}) {
  return (
    <form action={action} className="toolbar-form">
      <label className="field">
        <span className="field-label">Week</span>
        <input className="input" type="date" name="week" defaultValue={selectedWeek.start} />
      </label>
      <button className="button button-secondary" type="submit">
        Apply Week
      </button>
    </form>
  );
}
