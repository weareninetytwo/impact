import Link from "next/link";
import styles from "./not-found.module.css";

export default function OpportunityNotFound() {
  return (
    <div className={styles.wrap}>
      <h1>Opportunity not found</h1>
      <Link href="/opportunities">Back to opportunities</Link>
    </div>
  );
}
