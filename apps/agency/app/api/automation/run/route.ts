import { verifyAutomationAuth } from "@/lib/scout/automation-auth";
import { runFullPipeline } from "@impact/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Full pipeline automation — Scout → triage → research → qualify → nurture → outreach → proposals → tasks */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");

  if (!verifyAutomationAuth(request.headers.get("authorization"), querySecret)) {
    return NextResponse.json(
      { error: "Unauthorized — Bearer IMPACT_SCOUT_SECRET or ?secret= required" },
      { status: 401 },
    );
  }

  try {
    const summary = await runFullPipeline({ senderName: "Gino" });
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Automation failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
