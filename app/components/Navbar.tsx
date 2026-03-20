"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import LoginModal from "./LoginModal";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; phone: string } | null>(
    null,
  );

  // 1. Handle scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 2. Check login status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 3. DEEP LINKING & EVENT LISTENER: Auto-open modal
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("login") === "true") {
        setLoginOpen(true);
      }
    }

    // Listen for custom event with an optional redirect payload
    const handleOpenModal = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.redirect) {
        const redirect = customEvent.detail.redirect as string;
        // Only allow relative paths — blocks open redirect injection
        if (redirect.startsWith("/") && !redirect.startsWith("//")) {
          window.history.replaceState(
            {},
            "",
            `/?redirect=${encodeURIComponent(redirect)}`,
          );
        }
      }
      setLoginOpen(true);
    };

    window.addEventListener("openLoginModal", handleOpenModal);
    return () => window.removeEventListener("openLoginModal", handleOpenModal);
  }, []);

  const checkAuthStatus = () => {
    const name = localStorage.getItem("userName");
    if (!name) return;

    // sessionActive is a non-httpOnly cookie set on login.
    // If it's gone (expired or cleared) but localStorage is stale, clear it.
    const hasSession = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith("sessionActive="));

    if (!hasSession) {
      ["userUUID", "userName", "hasSubscription", "jwtToken"].forEach((k) =>
        localStorage.removeItem(k),
      );
      return;
    }

    setIsLoggedIn(true);
    setUser({ name, phone: "" });
  };

  // 4. Complete Logout Logic
  const handleLogout = async () => {
    // Tell backend to clear the httpOnly jwt cookie
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/v1/auth/logout`,
      { method: "POST", credentials: "include" },
    ).catch(() => {}); // best-effort — clear local state regardless

    localStorage.removeItem("userUUID");
    localStorage.removeItem("userName");
    localStorage.removeItem("hasSubscription");
    document.cookie = "sessionActive=; path=/; Max-Age=0";

    setIsLoggedIn(false);
    setUser(null);

    window.location.href = "/";
  };

  // Helper to get user's first initial for the avatar
  const getUserInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <>
      <nav
        className={`sticky top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200"
            : "bg-white border-b border-transparent"
        }`}
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left side: Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <Image
              src="/images/iconLogo.png"
              alt="Cricshub"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <Image
              src="/images/textLogo.png"
              alt="Cricshub"
              width={90}
              height={28}
              className="object-contain hidden sm:block"
            />
          </Link>

          {/* Right side: Auth & Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isLoggedIn && user ? (
              // ── LOGGED IN STATE ──
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <i className="ri-dashboard-line text-lg leading-none" />
                  <span className="hidden sm:block">Dashboard</span>
                </Link>

                <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

                {/* User Profile & Logout Area */}
                <div className="flex items-center gap-2">
                  {/* Avatar Circle */}
                  <Link
                    href="/profile"
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 text-blue-700 font-bold text-sm border border-blue-100 hover:bg-blue-100 transition-colors"
                    title="Go to Profile"
                  >
                    {getUserInitial(user.name)}
                  </Link>

                  {/* Clean Logout Button */}
                  <button
                    onClick={handleLogout}
                    title="Log out"
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                  >
                    <i className="ri-logout-box-r-line text-lg leading-none" />
                  </button>
                </div>
              </>
            ) : (
              // ── LOGGED OUT STATE ──
              <button
                onClick={() => setLoginOpen(true)}
                className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors duration-200 shadow-sm"
              >
                <span>Log in</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoginOpen(false);
          checkAuthStatus();

          // Check URL for deep link redirect vs normal login
          const searchParams = new URLSearchParams(window.location.search);
          const redirectUrl = searchParams.get("redirect");

          if (redirectUrl) {
            window.location.href = redirectUrl;
          } else {
            window.location.href = "/dashboard";
          }
        }}
      />
    </>
  );
}
