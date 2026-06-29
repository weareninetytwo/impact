import { AuthAlert } from "./auth-alert";
import styles from "./auth.module.css";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/dashboard";

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in to Impact</h1>
        <p className={styles.subtitle}>
          Your team&apos;s revenue operating system — opportunities, signals, and
          knowledge in one place.
        </p>

        <AuthAlert error={params.error} message={params.message} />

        <form className={styles.form} action="/api/auth/login" method="POST">
          <input type="hidden" name="next" value={next} />
          <label className={styles.field}>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className={styles.field}>
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className={styles.primaryBtn}>
            Sign in
          </button>
        </form>

        <p className={styles.footer}>
          New to Impact?{" "}
          <a href="/signup" className={styles.link}>
            Create account
          </a>
          {" · "}
          <a href="/api/auth/logout" className={styles.link}>
            Clear session
          </a>
        </p>
      </div>
    </div>
  );
}
