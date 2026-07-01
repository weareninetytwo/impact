import { handleAutomationRun } from "@/lib/scout/automation-run";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Full pipeline automation — Scout → triage → research → qualify → nurture → outreach → proposals → tasks */
export async function GET(request: Request) {
  return handleAutomationRun(request);
}

export async function POST(request: Request) {
  return handleAutomationRun(request);
}
