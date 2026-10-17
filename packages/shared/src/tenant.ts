import { DEFAULT_TENANT_ID } from "./types/opportunity";

type TenantResolver = () => string;

let resolver: TenantResolver = () => DEFAULT_TENANT_ID;

/**
 * The single place the data layer learns "which tenant is this request for".
 * Phase 0: always ninety two. Phase 2 swaps the resolver (request-scoped) via
 * setTenantResolver; call sites do not change. See docs/adr/0002.
 */
export function getTenantId(): string {
  return resolver();
}

export function setTenantResolver(next: TenantResolver): void {
  resolver = next;
}

export function resetTenantResolver(): void {
  resolver = () => DEFAULT_TENANT_ID;
}
