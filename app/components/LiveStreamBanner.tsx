"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LiveStreamBanner() {
  const router = useRouter();

  const handleCtaClick = () => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      router.push("/dashboard");
    } else {
      // User is not logged in, trigger modal and pass the intended destination
      window.dispatchEvent(
        new CustomEvent("openLoginModal", {
          detail: { redirect: "/dashboard" },
        }),
      );
    }
  };
  return (
    <div className="relative z-50 overflow-hidden bg-gradient-to-r from-[#0a1628] via-[#0d2a5e] to-[#1E88E5]">
      {/* Subtle shimmer effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-y-0 -left-full w-1/3 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_6s_ease-in-out_infinite]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between gap-3">
        {/* ── LEFT SIDE: Badge & Text ── */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* NEW badge */}
          <span className="flex-shrink-0 bg-amber-400 text-amber-900 text-[9px] sm:text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-md leading-none">
            NEW
          </span>

          {/* Divider (Desktop only) */}
          <span className="flex-shrink-0 w-px h-6 sm:h-8 bg-white/15 hidden sm:block" />

          {/* Icon (Desktop only) */}
          <i className="ri-broadcast-line text-white/80 text-xl flex-shrink-0 hidden sm:block" />

          {/* Main message */}
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-white font-bold text-xs sm:text-sm leading-tight truncate">
              <span className="hidden sm:inline">Professional </span>
              Streaming Dashboard
              <span className="hidden sm:inline"> — Now Live</span>
            </p>
            <p className="text-white/50 text-[10px] sm:text-xs truncate hidden sm:block mt-0.5">
              OBS browser overlays · Live match banners · Real-time score sync
            </p>
          </div>
        </div>

        {/* ── RIGHT SIDE: Pills & CTA ── */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          {/* Feature pills — Hidden on mobile & tablet, visible on large desktops */}
          <div className="hidden lg:flex items-center gap-2">
            {["Score Overlay", "Playing XI"].map((f) => (
              <span
                key={f}
                className="text-[11px] font-medium text-white/70 bg-white/10 border border-white/10 px-2.5 py-1 rounded-full whitespace-nowrap"
              >
                {f}
              </span>
            ))}
          </div>

          {/* Divider (Desktop only) */}
          <span className="flex-shrink-0 w-px h-6 sm:h-8 bg-white/15 hidden md:block" />

          {/* CTA Button */}
          <button
            onClick={handleCtaClick}
            className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 bg-white text-[#1565C0] text-[11px] sm:text-xs font-black px-3 sm:px-5 py-2 sm:py-2.5 rounded-md sm:rounded-lg hover:bg-blue-50 transition-colors shadow-lg whitespace-nowrap"
          >
            <span className="hidden sm:block">Get Started</span>
            <span className="sm:hidden">Try Now</span>
            <i className="ri-arrow-right-line text-sm sm:text-base leading-none" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(800%);
          }
        }
      `}</style>
    </div>
  );
}
