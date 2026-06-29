/**
 * Sync Supabase Auth users → public.users and ensure tenant app_metadata.
 * Run: node scripts/repair-app-users.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, "apps/agency/.env.local");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i);
    const value = trimmed.slice(i + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(envPath);

const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(
  /\/+$/,
  "",
);
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const defaultSlug = process.env.IMPACT_DEFAULT_TENANT_SLUG?.trim() || "ninety-two";

if (!url || !serviceKey) {
  console.error("Missing Supabase URL or service role key");
  process.exit(1);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

const tenantsRes = await fetch(
  `${url}/rest/v1/tenants?slug=eq.${encodeURIComponent(defaultSlug)}&select=id,slug,name`,
  { headers },
);
const tenants = await tenantsRes.json();
const tenant = tenants[0];
if (!tenant) {
  console.error(`Tenant not found for slug: ${defaultSlug}`);
  process.exit(1);
}
console.log(`Using tenant: ${tenant.slug} (${tenant.id})`);

const usersRes = await fetch(`${url}/auth/v1/admin/users?per_page=50`, { headers });
const { users } = await usersRes.json();

if (!users?.length) {
  console.log("No auth users found.");
  process.exit(0);
}

for (const u of users) {
  const email = u.email ?? "";
  const fullName =
    u.user_metadata?.full_name ||
    email.split("@")[0] ||
    "User";
  const tenantId = u.app_metadata?.tenant_id || tenant.id;
  const role = u.app_metadata?.role || "owner";

  console.log(`\nRepairing ${email}…`);

  if (!u.app_metadata?.tenant_id) {
    const patchRes = await fetch(`${url}/auth/v1/admin/users/${u.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        app_metadata: { tenant_id: tenantId, role },
        user_metadata: { ...u.user_metadata, full_name: fullName },
        email_confirm: true,
      }),
    });
    if (!patchRes.ok) {
      console.log("  FAIL metadata:", await patchRes.text());
      continue;
    }
    console.log("  OK app_metadata set");
  } else {
    console.log("  OK app_metadata already set");
  }

  const upsertRes = await fetch(`${url}/rest/v1/users`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      id: u.id,
      tenant_id: tenantId,
      email,
      full_name: fullName,
      role,
    }),
  });
  if (!upsertRes.ok) {
    console.log("  FAIL users upsert:", await upsertRes.text());
  } else {
    console.log("  OK users row upserted");
  }
}

console.log("\nDone. Try signing in at /login now.");
