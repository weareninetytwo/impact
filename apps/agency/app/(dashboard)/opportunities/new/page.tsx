import Link from "next/link";
import { OpportunityForm } from "@/components/opportunities/opportunity-form";
import styles from "./page.module.css";

export default function NewOpportunityPage() {
  return (
    <div className={styles.page}>
      <Link href="/opportunities" className={styles.back}>
        ← Back to opportunities
      </Link>
      <header className={styles.header}>
        <h1 className={styles.title}>New opportunity</h1>
        <p className={styles.subtitle}>
          Manually capture an opportunity — scoring and next action are applied
          automatically
        </p>
      </header>
      <OpportunityForm />
    </div>
  );
}
