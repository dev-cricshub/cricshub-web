"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "@/app/components/auth/LoginForm";
import { Logo } from "@/app/components/ui";
import { getStoredUser, intentFor, safeRedirect } from "@/lib/session";

const FEATURES = [
  { icon: "ri-broadcast-line", title: "Stream Studio", body: "Live score overlays for YouTube, controlled from your phone or laptop." },
  { icon: "ri-auction-line", title: "Auctions", body: "Register players, run the bidding and hand squads to your tournament." },
  { icon: "ri-smartphone-line", title: "One account", body: "The same phone number you use in the CricsHub app." },
];

/**
 * The only sign-in screen, for every feature (Stream Studio, Auctions, registrations, plans).
 * Middleware, expired sessions and "Log in" buttons send people here with `?redirect=`; it has no
 * link back to the landing site and, after sign-in, opens the app home or the page they asked for.
 */
export default function LoginPage() {
  const [redirect, setRedirect] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const target = safeRedirect(new URLSearchParams(window.location.search).get("redirect"));
    if (getStoredUser()) {
      window.location.replace(target);
      return;
    }
    setRedirect(target);
    setReady(true);
  }, []);

  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel: desktop only, phones go straight to the form */}
      <aside className="relative hidden overflow-hidden border-r border-line bg-surface-2 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Logo href={null} />
        <div className="max-w-md space-y-8">
          <h1 className="font-display text-5xl font-bold uppercase leading-[0.95] text-fg">
            Everything for your <span className="text-accent">match day</span>
          </h1>
          <ul className="space-y-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft text-lg text-primary-soft-fg">
                  <i className={f.icon} aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold text-fg">{f.title}</span>
                  <span className="text-sm text-fg-muted">{f.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-fg-subtle">© CricsHub</p>
      </aside>

      <main className="flex min-h-dvh flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <div className="flex h-14 items-center lg:invisible">
          <Logo size="sm" href={null} />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
          {ready ? (
            <LoginForm
              autoFocus
              intent={intentFor(redirect)}
              onSuccess={() => window.location.replace(redirect ?? "/dashboard")}
            />
          ) : (
            <div className="space-y-4" aria-hidden>
              <span className="skeleton block h-8 w-3/4 rounded-lg" />
              <span className="skeleton block h-4 w-full rounded" />
              <span className="skeleton mt-6 block h-12 w-full rounded-xl" />
              <span className="skeleton block h-12 w-full rounded-xl" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
