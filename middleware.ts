import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_PATHS = ["/dashboard", "/profile", "/stream", "/auctions"];

// Spectator view of an auction stays open, so a shared "watch" link works without an account.
const PUBLIC_PATHS = [/^\/auctions\/[^/]+\/watch\/?$/];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected || PUBLIC_PATHS.some((re) => re.test(pathname))) return NextResponse.next();

  // sessionActive is a non-httpOnly cookie set by the frontend on login (LoginForm.tsx).
  // The actual jwt is in an httpOnly cookie on the API domain — not readable here.
  const sessionActive = request.cookies.get("sessionActive")?.value;
  if (!sessionActive) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/stream/:path*", "/stream", "/auctions/:path*", "/auctions"],
};
