import { getEnv } from "@/lib/env";
import { syncAllCreatorsAndPayouts } from "@/lib/sync";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(request: NextRequest) {
  const { cronSecret } = getEnv();
  const headerValue = request.headers.get("authorization");
  const provided = headerValue?.replace("Bearer ", "") ?? request.headers.get("x-cron-secret");
  return provided === cronSecret;
}

async function handleCron(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await syncAllCreatorsAndPayouts();
    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron sync failed." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}
