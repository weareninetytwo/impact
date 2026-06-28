"use client";

import { useTransition } from "react";
import type { OpportunityStage } from "@impact/shared";
import { OPPORTUNITY_STAGES } from "@impact/shared";
import { updateStageAction } from "@/lib/opportunities/actions";
import styles from "./stage-select.module.css";

export function StageSelect({
  id,
  current,
}: {
  id: string;
  current: OpportunityStage;
}) {
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const stage = e.target.value as OpportunityStage;
    startTransition(async () => {
      await updateStageAction(id, stage);
    });
  }

  return (
    <select
      className={styles.select}
      value={current}
      onChange={onChange}
      disabled={pending}
    >
      {OPPORTUNITY_STAGES.map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
