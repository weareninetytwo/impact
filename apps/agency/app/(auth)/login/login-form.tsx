"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { syncAppUserAfterLogin } from "@/lib/auth/actions";
import styles from "./auth.module.css";

export function LoginForm({
  next,
  initialError,
  initialMessage,
}: {
  next: string;
  initialError?: string;
  initialMessage?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState(initialError ?? null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      await syncAppUserAfterLogin().catch(() => undefined);

      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error ? (
        <p className={styles.bannerError} role="alert">
          {error}
        </p>
      ) : null}
      {initialMessage && !error ? (
        <p className={styles.bannerSuccess} role="status">
          {initialMessage}
        </p>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={loading}
          />
        </label>
        <label className={styles.field}>
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            disabled={loading}
          />
        </label>
        <button type="submit" className={styles.primaryBtn} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </>
  );
}
