import Link from "next/link";
import type { LeadScope } from "@impact/shared";
import styles from "./lead-scope-tabs.module.css";

interface LeadScopeTabsProps {
  active: LeadScope;
}

export function LeadScopeTabs({ active }: LeadScopeTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Lead scope">
      <Link
        href="/opportunities?scope=team"
        className={`${styles.tab} ${active === "team" ? styles.active : ""}`}
        role="tab"
        aria-selected={active === "team"}
      >
        Team
      </Link>
      <Link
        href="/opportunities?scope=mine"
        className={`${styles.tab} ${active === "mine" ? styles.active : ""}`}
        role="tab"
        aria-selected={active === "mine"}
      >
        My leads
      </Link>
    </div>
  );
}
