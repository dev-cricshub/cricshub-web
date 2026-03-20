"use client";

import { useState } from "react";
import type { VmixTransitionType, VmixInput } from "@/lib/streaming/types";

const TRANSITIONS: { type: VmixTransitionType; label: string; icon: string }[] = [
  { type: "Cut", label: "Cut", icon: "ri-scissors-cut-line" },
  { type: "Fade", label: "Fade", icon: "ri-contrast-drop-line" },
  { type: "Wipe", label: "Wipe", icon: "ri-arrow-right-line" },
  { type: "Slide", label: "Slide", icon: "ri-slideshow-line" },
  { type: "Zoom", label: "Zoom", icon: "ri-zoom-in-line" },
  { type: "Fly", label: "Fly", icon: "ri-plane-line" },
  { type: "Merge", label: "Merge", icon: "ri-git-merge-line" },
  { type: "Cube", label: "Cube", icon: "ri-box-3-line" },
  { type: "Stinger1", label: "Stinger 1", icon: "ri-movie-2-line" },
  { type: "Stinger2", label: "Stinger 2", icon: "ri-movie-line" },
];

interface Props {
  inputs: VmixInput[];
  previewInput: number | null;
  onTransition: (type: string, input: number, duration: number) => void;
  onFadeToBlack: () => void;
  fadeToBlack: boolean;
}

export default function VmixTransitionBar({
  inputs,
  previewInput,
  onTransition,
  onFadeToBlack,
  fadeToBlack,
}: Props) {
  const [selectedType, setSelectedType] = useState<VmixTransitionType>("Cut");
  const [duration, setDuration] = useState(1000);

  const handleGo = () => {
    if (previewInput != null) {
      onTransition(selectedType, previewInput, duration);
    }
  };

  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        <i className="ri-swap-line mr-1" />
        Transitions
      </p>

      {/* Transition type grid */}
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {TRANSITIONS.map((t) => (
          <button
            key={t.type}
            onClick={() => setSelectedType(t.type)}
            className={`py-2 rounded-lg text-[10px] font-bold transition-all ${
              selectedType === t.type
                ? "bg-[#34B8FF] text-white shadow-md"
                : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
            }`}
            title={t.label}
          >
            <i className={`${t.icon} block text-sm mb-0.5`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Duration */}
      <div className="flex items-center gap-3 mb-3">
        <label className="text-[10px] font-semibold text-gray-400 uppercase whitespace-nowrap">
          Duration
        </label>
        <input
          type="range"
          min={0}
          max={3000}
          step={100}
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="flex-1 h-1.5 accent-[#34B8FF] cursor-pointer"
        />
        <span className="text-[10px] text-gray-500 font-mono w-10 text-right">
          {(duration / 1000).toFixed(1)}s
        </span>
      </div>

      {/* GO button + FTB */}
      <div className="flex gap-2">
        <button
          onClick={handleGo}
          disabled={previewInput == null}
          className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-black hover:bg-red-600 transition-all shadow-md shadow-red-200 disabled:opacity-40"
        >
          <i className="ri-play-fill mr-1" />
          {selectedType.toUpperCase()} → PGM
        </button>
        <button
          onClick={onFadeToBlack}
          className={`px-4 py-3 rounded-xl text-xs font-bold transition-all ${
            fadeToBlack
              ? "bg-black text-white"
              : "bg-gray-900 text-gray-300 hover:bg-black hover:text-white"
          }`}
        >
          FTB
        </button>
      </div>
    </div>
  );
}
