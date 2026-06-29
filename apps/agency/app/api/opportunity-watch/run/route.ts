import { runOpportunityWatch } from "@impact/db";
import { verifyScoutAuth } from "@/lib/automation/token-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Opportunity Watch Runner — cron placeholder (disabled in vercel.json until tuned).
 * Bearer IMPACT_SCOUT_SECRET — same as /api/scout/run for MVP.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");

  if (!verifyScoutAuth(request.headers.get("authorization"), querySecret)) {
    return NextResponse.json(
      {
        error:
          "Unauthorized — Bearer IMPACT_SCOUT_SECRET or ?secret= required",
      },
      { status: 401 },
    );
  }

  try {
    const result = await runOpportunityWatch();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Opportunity Watch run failed",
      },
      { status: 500 },
    );
  }
}
