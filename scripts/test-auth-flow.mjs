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

const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const testEmail = process.argv[2] || "gino@weareninetytwo.com";
const testPassword = process.argv[3];

console.log("=== Auth flow test ===\n");
console.log("URL:", url);
console.log("Anon key prefix:", anonKey?.slice(0, 20) + "…");

// 1. Test anon key with password grant (if password provided)
if (testPassword) {
  const signRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  const signBody = await signRes.text();
  console.log("\nPassword sign-in:", signRes.status);
  console.log(signBody.slice(0, 400));
} else {
  console.log("\nSkip password test (pass email password as args)");
}

// 2. Set temp password via admin and test
if (serviceKey && !testPassword) {
  const usersRes = await fetch(`${url}/auth/v1/admin/users?per_page=5`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  const { users } = await usersRes.json();
  const user = users?.find((u) => u.email === testEmail);
  if (!user) {
    console.log("User not found:", testEmail);
    process.exit(1);
  }

  const tempPass = `ImpactTemp${Date.now().toString(36)}!`;
  const updateRes = await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
    method: "PUT",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: tempPass, email_confirm: true }),
  });
  console.log("\nSet temp password:", updateRes.status, updateRes.ok ? "OK" : await updateRes.text());

  const signRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: testEmail, password: tempPass }),
  });
  const signBody = await signRes.text();
  console.log("Sign-in with temp password:", signRes.status);
  if (signRes.ok) {
    const data = JSON.parse(signBody);
    console.log("  access_token:", data.access_token?.slice(0, 20) + "…");
    console.log("  user:", data.user?.email);
    console.log("\n*** TEMP PASSWORD FOR LOGIN:", tempPass);
    console.log("Use this at /login then change password in Supabase.\n");
  } else {
    console.log(" ", signBody.slice(0, 300));
  }
}

// 3. Check production login page has client bundle
const prodHtml = await fetch("https://impact.weareninetytwo.xyz/login").then((r) => r.text());
const hasClient = prodHtml.includes("Signing in") || prodHtml.includes("login-form");
console.log("\nProduction /login has new client form markers:", hasClient);
const scripts = [...prodHtml.matchAll(/src="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]);
console.log("Script chunks:", scripts.length);
