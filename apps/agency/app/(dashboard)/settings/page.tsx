import { getDeploymentInfo } from "@/lib/deployment";
import { getPersistenceMode, getDataFilePath } from "@impact/db";
import { ModulePlaceholder } from "@/components/ui/module-placeholder";
import styles from "./page.module.css";

export default function SettingsPage() {
  const deployment = getDeploymentInfo();
  const persistenceMode = getPersistenceMode();

  return (
    <div className={styles.page}>
      <ModulePlaceholder
        title="Settings"
        description="ICP, scoring weights, offer routing, nurture templates, and preferences"
        epic="Epic 2+"
      />
      <section className={styles.env}>
        <h2 className={styles.envTitle}>Deployment</h2>
        <dl className={styles.dl}>
          <div>
            <dt>Persistence</dt>
            <dd>
              {persistenceMode === "supabase" ? (
                <span className={styles.ok}>Supabase (production)</span>
              ) : (
                <span className={styles.pending}>
                  Local JSON file — set Supabase env vars on Vercel
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>Basic auth</dt>
            <dd>
              {deployment.basicAuthEnabled ? (
                <span className={styles.ok}>Enabled</span>
              ) : (
                <span className={styles.pending}>Disabled (local dev)</span>
              )}
            </dd>
          </div>
          <div>
            <dt>Hosting</dt>
            <dd>{deployment.vercel ? "Vercel" : "Local"}</dd>
          </div>
          {persistenceMode === "file" && (
            <div>
              <dt>Data file</dt>
              <dd>
                <code>{getDataFilePath()}</code>
              </dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  );
}
