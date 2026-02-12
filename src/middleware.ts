import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * TODO: Auth and RBAC logic will be added in PRD 04.
 * This middleware will handle session refresh and route protection.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets (e.g. images)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
