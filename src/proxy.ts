import { type NextRequest, NextResponse } from "next/server";

// next-intl v4 with Next.js 16 has a bug where locale rewrites cause 404s
// even with localePrefix: "never". This proxy bypasses the locale middleware
// and passes requests straight through.
export default function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|api-proxy|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
