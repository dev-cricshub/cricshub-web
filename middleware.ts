import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_PATHS = ["/dashboard", "/profile", "/stream"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // sessionActive is a non-httpOnly cookie set by the frontend on login (LoginModal.tsx).
  // The actual jwt is in an httpOnly cookie on the API domain — not readable here.
  const sessionActive = request.cookies.get("sessionActive")?.value;
  if (!sessionActive) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("login", "true");
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/stream/:path*"],
};
