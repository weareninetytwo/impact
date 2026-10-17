"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import styles from "./dashboard-refresh-bar.module.css";

interface DashboardRefreshBarProps {
  dataAsOf: string;
}

function formatDataAsOf(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function DashboardRefreshBar({ dataAsOf }: DashboardRefreshBarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className={styles.bar}>
      <span className={styles.meta}>Data as of {formatDataAsOf(dataAsOf)}</span>
      <button
        type="button"
        className={styles.button}
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        {pending ? "Refreshing…" : "Refresh Data"}
      </button>
    </div>
  );
}
