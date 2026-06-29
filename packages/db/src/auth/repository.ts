import { DEFAULT_TENANT_ID } from "@impact/shared";
import { createServerClient } from "../client";

export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
}

export interface AppUserRecord {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: "owner" | "admin" | "bd_rep" | "viewer";
}

function getClient() {
  const client = createServerClient();
  if (!client) throw new Error("Supabase server client not configured");
  return client;
}

export async function getTenantBySlug(
  slug: string,
): Promise<TenantRecord | null> {
  const { data, error } = await getClient()
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as TenantRecord | null;
}

export async function getTenantById(
  id: string,
): Promise<TenantRecord | null> {
  const { data, error } = await getClient()
    .from("tenants")
    .select("id, name, slug")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as TenantRecord | null;
}

export async function createTenantRecord(
  name: string,
  slug: string,
): Promise<TenantRecord> {
  const { data, error } = await getClient()
    .from("tenants")
    .insert({ name, slug, settings: {} })
    .select("id, name, slug")
    .single();

  if (error) throw new Error(error.message);
  return data as TenantRecord;
}

export async function getAppUser(userId: string): Promise<AppUserRecord | null> {
  const { data, error } = await getClient()
    .from("users")
    .select("id, tenant_id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (error.message.includes("does not exist")) return null;
    throw new Error(error.message);
  }
  return data as AppUserRecord | null;
}

export async function upsertAppUser(input: {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: AppUserRecord["role"];
}): Promise<AppUserRecord> {
  const { data, error } = await getClient()
    .from("users")
    .upsert(
      {
        id: input.id,
        tenant_id: input.tenant_id,
        email: input.email,
        full_name: input.full_name,
        role: input.role,
      },
      { onConflict: "id" },
    )
    .select("id, tenant_id, email, full_name, role")
    .single();

  if (error) throw new Error(error.message);
  return data as AppUserRecord;
}

export async function listTenantMembers(
  tenantId: string,
): Promise<AppUserRecord[]> {
  const { data, error } = await getClient()
    .from("users")
    .select("id, tenant_id, email, full_name, role")
    .eq("tenant_id", tenantId)
    .order("full_name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as AppUserRecord[];
}

export async function resolveDefaultTenantId(): Promise<string> {
  const slug =
    process.env.IMPACT_DEFAULT_TENANT_SLUG?.trim() || "ninety-two";
  const tenant = await getTenantBySlug(slug);
  return tenant?.id ?? DEFAULT_TENANT_ID;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export { slugify };
