import { NextResponse, type NextRequest } from "next/server";

// Cheap first gate: page requests with no session cookie go straight to the
// sign-in page. This only checks that a cookie exists; every API route still
// verifies the signature itself, and the client handles expired sessions.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const hasSession = request.cookies.has("ff_session");

  if (!hasSession && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Skip API routes, Next internals and files with an extension (favicon etc.).
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
