import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";
import { isSupabaseAuthEnabled } from "@/lib/supabase/env";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/auth/callback",
];

const API_PUBLIC_PATHS = [
  "/api/signals/import",
  "/api/scout/run",
  "/api/automation/run",
  "/api/opportunity-watch/import",
  "/api/opportunity-watch/run",
  "/api/health",
  "/api/auth/login",
  "/api/auth/logout",
];

function isPublicPath(path: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`)) ||
    API_PUBLIC_PATHS.some((p) => path === p)
  );
}

function checkBasicAuth(request: NextRequest): NextResponse | null {
  const password = process.env.IMPACT_BASIC_AUTH_PASSWORD?.trim().replace(
    /[^\x00-\xFF]/g,
    "",
  );
  if (!password) return null;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const encoded = authHeader.slice(6);
    try {
      const decoded = atob(encoded);
      const colon = decoded.indexOf(":");
      const provided = colon >= 0 ? decoded.slice(colon + 1) : decoded;
      if (provided === password) return null;
    } catch {
      /* invalid base64 */
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Impact", charset="UTF-8"',
    },
  });
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (isPublicPath(path)) {
    return NextResponse.next();
  }

  if (isSupabaseAuthEnabled()) {
    const { response, user } = await refreshSupabaseSession(request);

    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set(
        "next",
        `${path}${request.nextUrl.search}`,
      );
      return NextResponse.redirect(loginUrl);
    }

    const basicBlock = checkBasicAuth(request);
    if (basicBlock) return basicBlock;

    return response;
  }

  const basicBlock = checkBasicAuth(request);
  if (basicBlock) return basicBlock;

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
