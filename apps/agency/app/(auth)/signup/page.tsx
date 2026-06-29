import { signUpAction } from "@/lib/auth/actions";
import { AuthAlert } from "../login/auth-alert";
import styles from "../login/auth.module.css";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const defaultSlug =
    process.env.IMPACT_DEFAULT_TENANT_SLUG?.trim() || "ninety-two";

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create your Impact account</h1>
        <p className={styles.subtitle}>
          Join your organization or register a new enterprise workspace.
        </p>

        <AuthAlert error={params.error} message={params.message} />

        <form className={styles.form} action={signUpAction}>
          <label className={styles.field}>
            Full name
            <input name="full_name" required autoComplete="name" />
          </label>
          <label className={styles.field}>
            Work email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className={styles.field}>
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Organization</legend>
            <label className={styles.radio}>
              <input
                type="radio"
                name="mode"
                value="join"
                defaultChecked
              />
              Join existing team
            </label>
            <label className={styles.field}>
              Team slug
              <input
                name="tenant_slug"
                defaultValue={defaultSlug}
                placeholder="ninety-two"
              />
            </label>
            <label className={styles.radio}>
              <input type="radio" name="mode" value="create" />
              Create new organization (enterprise)
            </label>
            <label className={styles.field}>
              Organization name
              <input name="org_name" placeholder="Acme Agency" />
            </label>
          </fieldset>

          <button type="submit" className={styles.primaryBtn}>
            Create account
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account?{" "}
          <a href="/login" className={styles.link}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
