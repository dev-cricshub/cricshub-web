"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { LoginForm } from "@/app/components/auth/LoginForm";
import { FeatureIcon, FeatureOrbit, type FeatureKey } from "@/app/components/auth/FeatureOrbit";
import { getStoredUser, intentFor, safeRedirect } from "@/lib/session";

const FEATURES: { icon: FeatureKey; title: string; body: string }[] = [
  { icon: "stream", title: "Stream Studio", body: "Live score overlays for YouTube, from phone or laptop." },
  { icon: "auction", title: "Auctions", body: "Register players, run bidding, hand over squads." },
  { icon: "account", title: "One account", body: "The same number you use in the CricsHub app." },
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
    // Exactly one viewport tall: the left column shrinks to fit. Only very short phones scroll.
    <div className="ch-login relative h-dvh overflow-y-auto lg:overflow-hidden">
      {/* Animated background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="ch-orb-a absolute left-[-10%] top-[-15%] h-[620px] w-[620px] rounded-full bg-[#5AA9F0] opacity-55 blur-[110px]" />
        <div className="ch-orb-b absolute bottom-[-20%] right-[-8%] h-[680px] w-[680px] rounded-full bg-[#7C3AED] opacity-50 blur-[120px]" />
        <div className="ch-orb-c absolute left-[42%] top-[38%] h-[340px] w-[340px] rounded-full bg-[#F97316] opacity-[0.28] blur-[110px]" />
        <svg className="ch-ring absolute left-1/2 top-1/2 -ml-[550px] -mt-[550px] opacity-35" width="1100" height="1100" viewBox="0 0 1100 1100">
          <circle cx="550" cy="550" r="540" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="1.5" />
          <circle cx="550" cy="550" r="320" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="1.5" strokeDasharray="4 12" />
        </svg>
      </div>

      <div className="relative mx-auto flex min-h-full max-w-[1440px] flex-col gap-6 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-8 lg:h-full lg:flex-row lg:items-stretch lg:gap-12 lg:px-14 lg:py-[clamp(20px,4vh,40px)]">
        {/* Left: brand + features */}
        <section className="flex min-h-0 min-w-0 flex-col gap-[clamp(16px,3vh,32px)] lg:flex-[1_1_520px]">
          <span className="ch-rise inline-flex items-center gap-2.5 self-start">
            <Image src="/images/iconLogoTransparent.png" alt="" width={32} height={29} priority />
            {/* Dark-on-transparent artwork; invert + hue-rotate gives white "CRICS" and keeps "HUB" blue (as in SiteHeader). */}
            <Image
              src="/images/textLogo.png"
              alt="CricsHub"
              width={1234}
              height={202}
              priority
              className="h-7 w-auto [filter:invert(1)_hue-rotate(180deg)_brightness(1.3)]"
            />
          </span>

          <div className="hidden min-h-0 flex-1 flex-col justify-center gap-[clamp(16px,3vh,32px)] lg:flex">
            <h1 className="ch-rise max-w-[600px] font-display text-[clamp(44px,8vh,84px)] font-bold uppercase leading-[0.92] text-white [animation-delay:0.1s]">
              Everything for your <span className="text-[#5AA9F0]">match day</span>
            </h1>

            {/* Takes whatever height is left; the orbit scales itself to it. */}
            <div className="ch-rise min-h-0 w-full max-w-[560px] flex-1 basis-0 [animation-delay:0.25s] [max-height:420px]">
              <FeatureOrbit />
            </div>

            <ul className="grid max-w-[660px] grid-cols-3 gap-3.5">
              {FEATURES.map((f, i) => (
                <li
                  key={f.title}
                  className="ch-rise ch-chip ch-glass flex flex-col gap-[clamp(4px,0.9vh,8px)] rounded-[18px] p-[clamp(12px,2vh,18px)]"
                  style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                >
                  <FeatureIcon name={f.icon} size={22} />
                  <span className="text-[15px] font-semibold text-white">{f.title}</span>
                  <span className="text-[13px] leading-normal text-[#C3CEE0]">{f.body}</span>
                </li>
              ))}
            </ul>
          </div>

          <span className="hidden text-[13px] text-[#C3CEE0] lg:block">© CricsHub</span>
        </section>

        {/* Right: glass auth card */}
        <main className="flex min-w-0 flex-1 items-center justify-center lg:flex-[1_1_440px]">
          <div className="ch-rise ch-card w-full max-w-[460px] rounded-[28px] p-6 [animation-delay:0.2s] sm:p-10 [@media(max-height:820px)]:p-7">
            {ready ? (
              <LoginForm
                autoFocus
                intent={intentFor(redirect)}
                onSuccess={() => window.location.replace(redirect ?? "/dashboard")}
              />
            ) : (
              <div className="space-y-4" aria-hidden>
                <span className="block h-7 w-24 animate-pulse rounded-full bg-white/10" />
                <span className="block h-12 w-3/4 animate-pulse rounded-lg bg-white/10" />
                <span className="block h-4 w-full animate-pulse rounded bg-white/10" />
                <span className="mt-6 block h-[58px] w-full animate-pulse rounded-2xl bg-white/10" />
                <span className="block h-[58px] w-full animate-pulse rounded-2xl bg-white/10" />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
