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
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("=== Auth diagnosis ===\n");

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const adminHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

// 1. List auth users
const usersRes = await fetch(`${url}/auth/v1/admin/users?per_page=20`, {
  headers: adminHeaders,
});
const usersBody = await usersRes.text();
if (!usersRes.ok) {
  console.log("FAIL listUsers:", usersRes.status, usersBody.slice(0, 200));
} else {
  const parsed = JSON.parse(usersBody);
  const users = parsed.users ?? [];
  console.log(`Auth users (${users.length}):`);
  for (const u of users) {
    console.log(
      `  - ${u.email} | confirmed=${Boolean(u.email_confirmed_at)} | id=${u.id?.slice(0, 8)}…`,
    );
  }
  if (users.length === 0) console.log("  (none — signup never reached Supabase Auth)");
}

// 2. Tenants
const tenantsRes = await fetch(`${url}/rest/v1/tenants?select=id,slug,name&limit=5`, {
  headers: { ...adminHeaders, Accept: "application/json" },
});
const tenantsBody = await tenantsRes.text();
if (!tenantsRes.ok) {
  console.log("\nFAIL tenants:", tenantsRes.status, tenantsBody.slice(0, 200));
} else {
  const tenants = JSON.parse(tenantsBody);
  console.log("\nTenants:");
  for (const t of tenants) console.log(`  - ${t.slug} (${t.name})`);
}

// 3. App users
const appRes = await fetch(`${url}/rest/v1/users?select=id,email,full_name,role&limit=10`, {
  headers: { ...adminHeaders, Accept: "application/json" },
});
const appBody = await appRes.text();
if (!appRes.ok) {
  console.log("\nFAIL users table:", appRes.status, appBody.slice(0, 200));
} else {
  const appUsers = JSON.parse(appBody);
  console.log(`\nApp users (${appUsers.length}):`);
  for (const u of appUsers) console.log(`  - ${u.email} (${u.role})`);
}

// 4. Test anon signup
if (anonKey) {
  const testEmail = `diag-${Date.now()}@example.com`;
  const signRes = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: testEmail, password: "testpassword123" }),
  });
  const signBody = await signRes.text();
  console.log("\nTest signUp (anon):", signRes.status);
  console.log(" ", signBody.slice(0, 300));
  try {
    const signData = JSON.parse(signBody);
    if (signData.user?.id) {
      await fetch(`${url}/auth/v1/admin/users/${signData.user.id}`, {
        method: "DELETE",
        headers: adminHeaders,
      });
      console.log("  (test user deleted)");
    }
  } catch {
    /* ignore */
  }
}

// 5. Production routes
const prod = "https://impact.weareninetytwo.xyz";
for (const path of ["/login", "/signup", "/dashboard"]) {
  const res = await fetch(`${prod}${path}`, { redirect: "manual" });
  console.log(`\n${path}: HTTP ${res.status}`);
}

console.log("\nDone.");
