import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Basic auth guard when IMPACT_BASIC_AUTH_PASSWORD is set.
 * Browser prompts for username (any) + password on first visit.
 * Remove or unset env var to disable (local dev only).
 */
export function middleware(request: NextRequest) {
  const password = process.env.IMPACT_BASIC_AUTH_PASSWORD;
  if (!password) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const encoded = authHeader.slice(6);
    try {
      const decoded = atob(encoded);
      const colon = decoded.indexOf(":");
      const provided = colon >= 0 ? decoded.slice(colon + 1) : decoded;
      if (provided === password) {
        return NextResponse.next();
      }
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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
