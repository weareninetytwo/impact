import type { LeadGrade } from "@impact/shared";
import styles from "./grade-badge.module.css";

const GRADE_CLASS: Record<NonNullable<LeadGrade>, string> = {
  A: styles.gradeA,
  B: styles.gradeB,
  C: styles.gradeC,
  D: styles.gradeD,
};

export function GradeBadge({ grade }: { grade: LeadGrade | null }) {
  if (!grade) {
    return <span className={styles.ungraded}>—</span>;
  }

  return (
    <span className={`${styles.badge} ${GRADE_CLASS[grade]}`}>{grade}</span>
  );
}
