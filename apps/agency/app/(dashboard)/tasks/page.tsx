import Link from "next/link";
import {
  fetchOpportunityMap,
  fetchTaskArtifacts,
} from "@/lib/pipeline/actions";
import type { TaskArtifact } from "@impact/shared";
import { TaskDoneButton } from "@/components/pipeline/task-done-button";
import styles from "@/components/pipeline/pipeline-page.module.css";

export default async function TasksPage() {
  const [tasks, oppMap] = await Promise.all([
    fetchTaskArtifacts(),
    fetchOpportunityMap(),
  ]);

  const sorted = [...tasks].sort((a, b) => {
    const pa = (a.payload as unknown as TaskArtifact).priority;
    const pb = (b.payload as unknown as TaskArtifact).priority;
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[pa] - rank[pb];
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tasks</h1>
        <p className={styles.subtitle}>
          Agent-generated next actions — outreach, proposals, calls, follow-ups.
        </p>
      </header>

      {sorted.length === 0 ? (
        <div className={styles.empty}>
          <p>No open tasks.</p>
          <p>
            Run <Link href="/automation">Automation</Link> to create tasks for
            each opportunity.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {sorted.map((item) => {
            const task = item.payload as unknown as TaskArtifact;
            const opp = item.opportunity_id
              ? oppMap.get(item.opportunity_id)
              : null;
            return (
              <article key={item.id} className={styles.card}>
                <span className={styles.badge}>
                  {task.priority} · {task.task_type}
                </span>
                <h2 className={styles.cardTitle}>{item.title}</h2>
                {opp && (
                  <p className={styles.meta}>
                    <Link href={`/opportunities/${opp.id}`}>
                      {opp.company_name}
                    </Link>
                    {task.due_at &&
                      ` · due ${new Date(task.due_at).toLocaleDateString()}`}
                  </p>
                )}
                <TaskDoneButton taskId={item.id} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
