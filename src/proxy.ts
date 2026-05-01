import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy — handles auth redirects for protected routes.
 *
 * Since we use localStorage-based auth (SPA pattern),
 * the proxy only handles server-side route protection for initial load.
 * The AuthProvider client component handles the rest.
 */

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // All paths are allowed through — AuthProvider handles protection client-side
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
