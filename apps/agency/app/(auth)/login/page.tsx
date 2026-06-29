import { LoginForm } from "./login-form";
import styles from "./auth.module.css";

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

        <LoginForm
          next={next}
          initialError={params.error}
          initialMessage={params.message}
        />

        <p className={styles.footer}>
          New to Impact?{" "}
          <a href="/signup" className={styles.link}>
            Create account
          </a>
        </p>
      </div>
    </div>
  );
}
