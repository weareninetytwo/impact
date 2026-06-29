import { signInAction } from "@/lib/auth/actions";
import styles from "./auth.module.css";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
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

        <form
          className={styles.form}
          action={async (formData) => {
            "use server";
            await signInAction(formData);
          }}
        >
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
        </p>
      </div>
    </div>
  );
}
