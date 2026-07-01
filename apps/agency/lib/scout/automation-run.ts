import { verifyAutomationAuth } from "@/lib/scout/automation-auth";
import { runFullPipeline } from "@impact/db";
import type { AutomationRunSummary } from "@impact/shared";
import { NextResponse } from "next/server";

export type RunPipelineFn = (
  options?: Parameters<typeof runFullPipeline>[0],
) => Promise<AutomationRunSummary>;

/** Shared handler for GET/POST /api/automation/run — inject runPipeline in tests. */
export async function handleAutomationRun(
  request: Request,
  runPipeline: RunPipelineFn = runFullPipeline,
): Promise<Response> {
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");

  if (!verifyAutomationAuth(request.headers.get("authorization"), querySecret)) {
    return NextResponse.json(
      {
        error:
          "Unauthorized — Bearer IMPACT_SCOUT_SECRET or CRON_SECRET required (Authorization header preferred)",
      },
      { status: 401 },
    );
  }

  try {
    const summary = await runPipeline({ senderName: "Gino" });
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Automation failed" },
      { status: 500 },
    );
  }
}
