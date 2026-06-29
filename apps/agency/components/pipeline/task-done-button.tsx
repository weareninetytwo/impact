"use client";

import { useRouter } from "next/navigation";
import { markTaskDoneAction } from "@/lib/pipeline/actions";
import styles from "@/components/pipeline/pipeline-page.module.css";

export function TaskDoneButton({ taskId }: { taskId: string }) {
  const router = useRouter();

  async function handleDone() {
    await markTaskDoneAction(taskId);
    router.refresh();
  }

  return (
    <div className={styles.actions}>
      <button type="button" className={styles.btn} onClick={handleDone}>
        Mark done
      </button>
    </div>
  );
}
