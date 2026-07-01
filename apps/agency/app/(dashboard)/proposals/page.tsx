import Link from "next/link";
import {
  fetchOpportunityMap,
  fetchProposalArtifacts,
} from "@/lib/pipeline/actions";
import type { ProposalArtifact } from "@impact/shared";
import { ProposalActions } from "@/components/pipeline/proposal-actions";
import styles from "@/components/pipeline/pipeline-page.module.css";

export default async function ProposalsPage() {
  const [proposals, oppMap] = await Promise.all([
    fetchProposalArtifacts(),
    fetchOpportunityMap(),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Proposals</h1>
        <p className={styles.subtitle}>
          AI-generated proposal drafts from research + closer briefs. Edit, mark
          sent, attach to outreach.
        </p>
      </header>

      {proposals.length === 0 ? (
        <div className={styles.empty}>
          <p>No proposals yet.</p>
          <p>
            Run <Link href="/automation">Automation</Link> to generate proposal
            drafts for A/B leads.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {proposals.map((item) => {
            const opp = item.opportunity_id
              ? oppMap.get(item.opportunity_id)
              : null;
            const proposal = item.payload as unknown as ProposalArtifact;
            return (
              <article key={item.id} className={styles.card}>
                <span className={styles.badge}>{item.status}</span>
                <h2 className={styles.cardTitle}>{item.title}</h2>
                {opp && (
                  <p className={styles.meta}>
                    <Link href={`/opportunities/${opp.id}`}>
                      {opp.company_name}
                    </Link>
                    {proposal.estimated_value != null &&
                      ` · $${proposal.estimated_value.toLocaleString()}`}
                  </p>
                )}
                <p className={styles.body}>
                  {proposal.content.slice(0, 420)}
                  {proposal.content.length > 420 ? "…" : ""}
                </p>
                <ProposalActions
                  proposalId={item.id}
                  content={proposal.content}
                  status={item.status}
                />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
