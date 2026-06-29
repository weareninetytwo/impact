import {
  importSignalItems,
  validateSignalIngestPayload,
} from "@impact/db";
import { verifyIngestAuth } from "@/lib/automation/token-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Dedicated ingest endpoint for Opportunity Watch GPT Actions / automation.
 * Same behavior as POST /api/signals/import — review queue by default.
 */
export async function POST(request: Request) {
  if (!verifyIngestAuth(request.headers.get("authorization"))) {
    return NextResponse.json(
      { error: "Unauthorized — Bearer IMPACT_INGEST_SECRET required" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = validateSignalIngestPayload(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const importSource =
      validated.importSource === "api"
        ? "gpt"
        : validated.importSource;

    const result = await importSignalItems(validated.payload, {
      mode: validated.mode,
      importSource,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Import failed",
      },
      { status: 500 },
    );
  }
}
