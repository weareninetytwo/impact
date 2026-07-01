import type { Opportunity } from "@impact/shared";
import type { TaskArtifact } from "@impact/shared";

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function generateTasksForOpportunity(
  opportunity: Opportunity,
): TaskArtifact[] {
  const tasks: TaskArtifact[] = [];
  const company = opportunity.company_name;

  if (opportunity.lead_grade === "A" || opportunity.lead_grade === "B") {
    tasks.push({
      title: `Send outreach email — ${company}`,
      task_type: "outreach",
      due_at: addDays(0),
      priority: "high",
      status: "open",
    });
    tasks.push({
      title: `Review proposal draft — ${company}`,
      task_type: "proposal",
      due_at: addDays(1),
      priority: "high",
      status: "open",
    });
    if (opportunity.lead_grade === "A") {
      tasks.push({
        title: `Book discovery call — ${company}`,
        task_type: "meeting",
        due_at: addDays(2),
        priority: "high",
        status: "open",
      });
    }
  } else if (opportunity.lead_grade === "C") {
    tasks.push({
      title: `Enroll in nurture sequence — ${company}`,
      task_type: "nurture",
      due_at: addDays(0),
      priority: "medium",
      status: "open",
    });
  }

  tasks.push({
    title: opportunity.next_action || `Review opportunity — ${company}`,
    task_type: "follow_up",
    due_at: addDays(3),
    priority: opportunity.lead_grade === "A" ? "high" : "medium",
    status: "open",
  });

  return tasks;
}
