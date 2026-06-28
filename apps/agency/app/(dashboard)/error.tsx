"use client";

import styles from "./error.module.css";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isSupabase =
    error.message.includes("SUPABASE") ||
    error.message.includes("Supabase") ||
    error.message.includes("fetch failed") ||
    error.message.includes("Server Components render") ||
    error.digest === "2872586287" ||
    error.digest === "2710575786" ||
    error.message.includes("Invalid API key");

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Could not load Impact</h1>
      {isSupabase ? (
        <>
          <p className={styles.message}>
            Supabase connection failed. Check Vercel env vars:
          </p>
          <ul className={styles.list}>
            <li>
              <code>NEXT_PUBLIC_SUPABASE_URL</code> must be{" "}
              <strong>Project URL</strong> from Supabase Settings → API (e.g.{" "}
              <code>https://abcdefgh.supabase.co</code>) — not the dashboard
              browser link
            </li>
            <li>
              <code>SUPABASE_SERVICE_ROLE_KEY</code> = full <strong>Secret</strong>{" "}
              key (<code>sb_secret_...</code>) — click eye icon to reveal, then
              copy entire key. Not the Publishable key.
            </li>
            <li>
              Or use <strong>Legacy API Keys</strong> → <code>service_role</code>{" "}
              JWT (<code>eyJ...</code>) if secret key fails
            </li>
            <li>
              Confirm SQL ran: tables <code>tenants</code> and{" "}
              <code>opportunity_records</code>
            </li>
          </ul>
        </>
      ) : (
        <p className={styles.message}>{error.message}</p>
      )}
      <button type="button" className={styles.button} onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
