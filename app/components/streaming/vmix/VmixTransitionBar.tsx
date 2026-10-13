"use client";

import { useState } from "react";
import type { VmixTransitionType, VmixInput } from "@/lib/streaming/types";
import { Button, cn } from "@/app/components/ui";
import { RangeSlider, SubLabel, pressClasses } from "../StudioKit";

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

  const selectedLabel = TRANSITIONS.find((t) => t.type === selectedType)?.label ?? selectedType;

  return (
    <div className="space-y-4">
      {/* Transition type grid */}
      <div>
        <SubLabel icon="ri-swap-line">Transition type</SubLabel>
        <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Transition type">
          {TRANSITIONS.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => setSelectedType(t.type)}
              aria-pressed={selectedType === t.type}
              title={t.label}
              className={pressClasses(
                selectedType === t.type,
                "primary",
                "min-h-[48px] min-w-0 flex-col gap-0.5 px-1 py-1.5 text-2xs",
              )}
            >
              <i className={cn(t.icon, "text-sm leading-none")} aria-hidden />
              <span className="w-full text-center leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-3">
        <span className="flex-shrink-0 text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
          Duration
        </span>
        <RangeSlider
          min={0}
          max={3000}
          step={100}
          value={duration}
          onChange={(_, raw) => setDuration(parseInt(raw))}
          ariaLabel="Transition duration"
          ariaValueText={`${(duration / 1000).toFixed(1)} seconds`}
        />
        <span className="w-10 flex-shrink-0 text-right font-mono text-xs tabular-nums text-fg-muted">
          {(duration / 1000).toFixed(1)}s
        </span>
      </div>

      {/* GO button + FTB */}
      <div className="flex gap-2">
        <Button
          variant="live"
          size="lg"
          block
          icon="ri-play-fill"
          onClick={handleGo}
          disabled={previewInput == null}
          className="text-sm"
        >
          {selectedLabel} to PGM
        </Button>
        <button
          type="button"
          onClick={onFadeToBlack}
          aria-pressed={fadeToBlack}
          aria-label="Fade to black"
          title="Fade to black"
          className={cn(
            "inline-flex h-12 flex-shrink-0 items-center justify-center rounded-xl border px-4 text-xs font-semibold tracking-wider",
            "transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
            fadeToBlack
              ? "border-surface-inverse bg-surface-inverse text-fg-inverse"
              : "border-line-strong bg-surface text-fg-muted hover:bg-surface-2 hover:text-fg",
          )}
        >
          FTB
        </button>
      </div>
      {previewInput == null && inputs.length > 0 && (
        <p className="text-xs text-fg-subtle">Select a preview (PVW) input to enable the transition.</p>
      )}
    </div>
  );
}
