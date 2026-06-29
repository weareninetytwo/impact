import { getAuthSession } from "@/lib/auth/session";
import { listTenantMembers } from "@impact/db";
import { getPersistenceMode } from "@impact/db";
import styles from "./page.module.css";

export default async function SettingsPage() {
  const session = await getAuthSession();
  const persistenceMode = getPersistenceMode();
  const members =
    session != null
      ? await listTenantMembers(session.tenantId).catch(() => [])
      : [];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          Account, team, and workspace configuration
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Account</h2>
        {session ? (
          <dl className={styles.dl}>
            <div>
              <dt>Name</dt>
              <dd>{session.fullName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{session.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{session.role.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt>Organization</dt>
              <dd>{session.tenantName}</dd>
            </div>
          </dl>
        ) : (
          <p className={styles.muted}>Sign in to view account details.</p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Team</h2>
        <p className={styles.hint}>
          All team members share the same pipeline. Use{" "}
          <strong>My leads</strong> on Opportunities to filter leads you own;
          switch to <strong>Team</strong> to see everyone&apos;s.
        </p>
        {members.length === 0 ? (
          <p className={styles.muted}>No team members loaded yet.</p>
        ) : (
          <ul className={styles.memberList}>
            {members.map((member) => (
              <li key={member.id} className={styles.member}>
                <strong>{member.full_name || member.email}</strong>
                <span>{member.role.replace(/_/g, " ")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Workspace</h2>
        <dl className={styles.dl}>
          <div>
            <dt>Data store</dt>
            <dd>
              {persistenceMode === "supabase" ? "Cloud (Supabase)" : "Local file"}
            </dd>
          </div>
          <div>
            <dt>Plan</dt>
            <dd>Trial — billing integration coming soon</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
