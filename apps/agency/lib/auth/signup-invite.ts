import { timingSafeEqual } from "node:crypto";

/**
 * Signup is invite-only: the code lives in IMPACT_SIGNUP_INVITE_CODE.
 * With no code configured, signup is closed (fail closed, never open).
 */
export function isSignupInviteValid(
  provided: string,
  expected: string | undefined = process.env.IMPACT_SIGNUP_INVITE_CODE,
): boolean {
  const want = expected?.trim();
  const got = provided.trim();
  if (!want || !got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isSignupOpen(
  expected: string | undefined = process.env.IMPACT_SIGNUP_INVITE_CODE,
): boolean {
  return Boolean(expected?.trim());
}
