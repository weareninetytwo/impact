import Link from "next/link";
import { ImportPanel } from "@/components/opportunities/import-panel";
import styles from "./page.module.css";

export default function ImportOpportunitiesPage() {
  return (
    <div className={styles.page}>
      <Link href="/opportunities" className={styles.back}>
        ← Back to opportunities
      </Link>
      <header className={styles.header}>
        <h1 className={styles.title}>Import opportunities</h1>
        <p className={styles.subtitle}>
          CSV or paste — dedupes by company name + website/source URL
        </p>
      </header>
      <ImportPanel />
    </div>
  );
}
