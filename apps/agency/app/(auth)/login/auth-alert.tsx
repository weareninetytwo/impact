import styles from "./auth.module.css";

export function AuthAlert({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  if (error) {
    return (
      <p className={styles.bannerError} role="alert">
        {error}
      </p>
    );
  }
  if (message) {
    return (
      <p className={styles.bannerSuccess} role="status">
        {message}
      </p>
    );
  }
  return null;
}
