"use client";

import { useStartStreaming } from "./useStartStreaming";

export default function AnnouncementBar() {
  const start = useStartStreaming();
  return (
    <div className="relative z-50 bg-surface-inverse text-fg-inverse">
      <button
        type="button"
        onClick={start}
        className="group container-page flex h-10 w-full items-center justify-center gap-2.5 text-xs sm:text-sm"
      >
        <span className="rounded-md bg-primary px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wider text-white">
          New
        </span>
        <span className="truncate">
          <span className="font-medium">Stream Studio is live</span>
          <span className="hidden opacity-70 sm:inline"> — OBS &amp; vMix overlays with real-time score sync</span>
        </span>
        <i
          className="ri-arrow-right-line flex-shrink-0 opacity-70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
          aria-hidden
        />
      </button>
    </div>
  );
}
