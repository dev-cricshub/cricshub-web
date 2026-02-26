'use client';

import Link from 'next/link';

export default function LiveStreamBanner() {
  return (
    <div className="relative z-50 overflow-hidden" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #0d2a5e 40%, #1565C0 70%, #1E88E5 100%)' }}>

      {/* Subtle shimmer */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-y-0 -left-full w-1/3 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_6s_ease-in-out_infinite]" />
      </div>

      <div className="relative container mx-auto px-6 py-4 flex items-center gap-6">

        {/* NEW badge */}
        <span className="flex-shrink-0 bg-amber-400 text-amber-900 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md">
          NEW
        </span>

        {/* Divider */}
        <span className="flex-shrink-0 w-px h-8 bg-white/15" />

        {/* Icon */}
        <i className="ri-broadcast-line text-white/80 text-xl flex-shrink-0 hidden sm:block" />

        {/* Main message */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm leading-none mb-1">
            Professional Streaming Dashboard — Now Live
          </p>
          <p className="text-white/50 text-xs truncate">
            OBS browser overlays · Live match banners · Real-time score sync · Playing XI display
          </p>
        </div>

        {/* Divider */}
        <span className="flex-shrink-0 w-px h-8 bg-white/15 hidden md:block" />

        {/* Feature pills — hidden on mobile */}
        <div className="hidden lg:flex items-center gap-2">
          {['Score Overlay', 'Match Banner', 'Playing XI'].map(f => (
            <span key={f} className="text-[11px] font-semibold text-white/60 bg-white/8 border border-white/10 px-3 py-1 rounded-full whitespace-nowrap">
              {f}
            </span>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/pricing"
          className="flex-shrink-0 flex items-center gap-2 bg-white text-[#1565C0] text-xs font-black px-5 py-2.5 rounded-lg hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all shadow-lg whitespace-nowrap"
        >
          Get Started
          <i className="ri-arrow-right-line" />
        </Link>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0%   { transform: translateX(0); }
          100% { transform: translateX(800%); }
        }
      `}</style>
    </div>
  );
}