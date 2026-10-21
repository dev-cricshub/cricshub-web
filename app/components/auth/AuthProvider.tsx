"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LoginModal from "@/app/components/LoginModal";
import { intentFor, safeRedirect, type LoginIntent } from "@/lib/session";

/**
 * Owns the one login sheet for every human-facing page. Anything can open it with `requestLogin()`
 * (lib/session.ts); `?login=true&redirect=…` links from older emails and bookmarks still work.
 * After sign-in the user lands on `redirect`, or back on the page they were on.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [redirect, setRedirect] = useState<string | null>(null);

  useEffect(() => {
    const onRequest = (e: Event) => {
      const target = (e as CustomEvent).detail?.redirect as string | undefined;
      setRedirect(safeRedirect(target, "") || null);
      setOpen(true);
    };
    window.addEventListener("openLoginModal", onRequest);
    return () => window.removeEventListener("openLoginModal", onRequest);
  }, []);

  useEffect(() => {
    if (pathname === "/login") return; // that page renders the form itself
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") !== "true") return;
    setRedirect(safeRedirect(params.get("redirect"), "") || null);
    setOpen(true);
    params.delete("login");
    params.delete("redirect");
    const qs = params.toString();
    window.history.replaceState(null, "", `${pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  }, [pathname]);

  const intent: LoginIntent | undefined = intentFor(redirect ?? pathname);

  return (
    <>
      {children}
      <LoginModal
        isOpen={open}
        intent={intent}
        // The landing page is always dark; match it so the sheet doesn't flash light.
        theme={pathname === "/" ? "dark" : undefined}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          // Full navigation so every header and cache re-reads the new session.
          if (redirect) window.location.href = redirect;
          else if (pathname === "/") window.location.href = "/dashboard";
          else window.location.reload();
        }}
      />
    </>
  );
}
