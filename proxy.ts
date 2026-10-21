import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_PATHS = ["/dashboard", "/profile", "/stream", "/auctions"];

// Spectator view of an auction stays open, so a shared "watch" link works without an account.
const PUBLIC_PATHS = [/^\/auctions\/[^/]+\/watch\/?$/];

export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;

  // Old "/?login=true&redirect=…" links: sign-in no longer lives on the landing page.
  if (pathname === "/") {
    if (searchParams.get("login") !== "true") return NextResponse.next();
    const loginUrl = new URL("/login", request.url);
    const redirect = searchParams.get("redirect");
    if (redirect) loginUrl.searchParams.set("redirect", redirect);
    return NextResponse.redirect(loginUrl);
  }

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
  matcher: ["/", "/dashboard/:path*", "/profile/:path*", "/stream/:path*", "/stream", "/auctions/:path*", "/auctions"],
};
