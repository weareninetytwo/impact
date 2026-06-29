import { runAllEnabledScoutSources } from "@impact/db";
import { verifyScoutAuth } from "@/lib/scout/scout-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron placeholder — enable by setting IMPACT_SCOUT_SECRET and
 * adding a crons entry to vercel.json (see docs/epic3c-scheduled-scout.md).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");

  if (
    !verifyScoutAuth(request.headers.get("authorization"), querySecret)
  ) {
    return NextResponse.json(
      {
        error:
          "Unauthorized — Bearer IMPACT_SCOUT_SECRET or ?secret= required",
      },
      { status: 401 },
    );
  }

  try {
    const summary = await runAllEnabledScoutSources();
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Scout cron failed",
      },
      { status: 500 },
    );
  }
}
