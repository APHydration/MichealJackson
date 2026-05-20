import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { csvEscape, getWeekRange } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const week = getWeekRange(request.nextUrl.searchParams.get("week") ?? undefined);
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("weekly_payouts")
    .select(
      "week_start_date, week_end_date, shorts_count, total_views, rate_per_short, total_owed, status, paid_date, notes, creators(name, youtube_channel_id), campaigns(name)",
    )
    .eq("week_start_date", week.start)
    .order("total_owed", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = [
    "Week Start",
    "Week End",
    "Creator Name",
    "YouTube Channel",
    "Campaign",
    "Shorts Posted",
    "Total Views",
    "Rate per Short",
    "Total Owed",
    "Payment Status",
    "Paid Date",
    "Notes",
  ];

  const lines = [
    header.map(csvEscape).join(","),
    ...(data ?? []).map((row: any) =>
      [
        row.week_start_date,
        row.week_end_date,
        row.creators?.name ?? "",
        row.creators?.youtube_channel_id ?? "",
        row.campaigns?.name ?? "",
        row.shorts_count ?? 0,
        row.total_views ?? 0,
        row.rate_per_short ?? 0,
        row.total_owed ?? 0,
        row.status ?? "",
        row.paid_date ?? "",
        row.notes ?? "",
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="weekly-payouts-${week.start}.csv"`,
    },
  });
}
