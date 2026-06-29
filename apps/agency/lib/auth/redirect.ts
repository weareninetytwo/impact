import { redirect } from "next/navigation";

export function redirectAuth(
  path: string,
  params: { error?: string; message?: string; next?: string },
): never {
  const qs = new URLSearchParams();
  if (params.error) qs.set("error", params.error);
  if (params.message) qs.set("message", params.message);
  if (params.next) qs.set("next", params.next);
  const query = qs.toString();
  redirect(query ? `${path}?${query}` : path);
}
