"use server";

import {
  importSignalItems,
  validateSignalIngestPayload,
} from "@impact/db";
import type { SignalIngestPayload, SignalIngestResult } from "@impact/shared";
import { revalidatePath } from "next/cache";

export async function importSignalsAction(
  jsonText: string,
): Promise<SignalIngestResult | { error: string }> {
  let body: unknown;
  try {
    body = JSON.parse(jsonText);
  } catch {
    return { error: "Invalid JSON" };
  }

  const validated = validateSignalIngestPayload(body);
  if (!validated.ok) {
    return { error: validated.error };
  }

  const result = await importSignalItems(validated.payload);
  revalidatePath("/opportunities");
  revalidatePath("/signals");
  revalidatePath("/knowledge");
  return result;
}

export async function importSignalsPayloadAction(
  payload: SignalIngestPayload,
): Promise<SignalIngestResult | { error: string }> {
  const validated = validateSignalIngestPayload(payload);
  if (!validated.ok) {
    return { error: validated.error };
  }
  const result = await importSignalItems(validated.payload);
  revalidatePath("/opportunities");
  revalidatePath("/signals");
  revalidatePath("/knowledge");
  return result;
}
