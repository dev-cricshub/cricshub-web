"use client";

import type { VmixInput } from "@/lib/streaming/types";
import { Button, EmptyState } from "@/app/components/ui";
import { RangeSlider, rowClasses } from "../StudioKit";

interface Props {
  inputs: VmixInput[];
  masterVolume: number;
  masterMuted: boolean;
  onSetVolume: (input: number | string, volume: number) => void;
  onSetMute: (input: number | string, muted: boolean) => void;
  onSetMasterVolume: (volume: number) => void;
}

export default function VmixAudioMixer({
  inputs,
  masterVolume,
  masterMuted,
  onSetVolume,
  onSetMute,
  onSetMasterVolume,
}: Props) {
  // Filter to inputs that have audio
  const audioInputs = inputs.filter((inp) => inp.audioBusses);

  return (
    <div className="space-y-3">
      {/* Master */}
      <div className="rounded-xl border border-line-strong bg-surface px-3 py-3 shadow-xs">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg">
            <i className="ri-equalizer-line text-sm text-primary" aria-hidden />
            Master
          </span>
          <Button
            size="sm"
            iconOnly
            variant={masterMuted ? "danger" : "ghost"}
            icon={masterMuted ? "ri-volume-mute-line" : "ri-volume-up-line"}
            aria-label={masterMuted ? "Unmute master" : "Mute master"}
            aria-pressed={masterMuted}
            onClick={() => onSetMute("master", !masterMuted)}
          />
        </div>
        <div className="flex items-center gap-3">
          <RangeSlider
            min={0}
            max={100}
            value={masterMuted ? 0 : masterVolume}
            onChange={(_, raw) => onSetMasterVolume(parseInt(raw))}
            ariaLabel="Master volume"
            ariaValueText={masterMuted ? "Muted" : `${masterVolume}%`}
          />
          <span className="w-10 flex-shrink-0 text-right font-mono text-xs tabular-nums text-fg-muted">
            {masterMuted ? "0%" : `${masterVolume}%`}
          </span>
        </div>
      </div>

      {/* Per-input */}
      {audioInputs.length > 0 ? (
        <div className="space-y-2">
          {audioInputs.map((inp) => {
            const name = `${inp.number}. ${inp.title || inp.type}`;
            return (
              <div key={inp.key} className={rowClasses}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-medium text-fg">{name}</span>
                  <Button
                    size="sm"
                    iconOnly
                    variant={inp.muted ? "danger" : "ghost"}
                    icon={inp.muted ? "ri-volume-mute-line" : "ri-volume-up-line"}
                    aria-label={inp.muted ? `Unmute ${name}` : `Mute ${name}`}
                    aria-pressed={inp.muted}
                    onClick={() => onSetMute(inp.number, !inp.muted)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <RangeSlider
                    min={0}
                    max={100}
                    value={inp.muted ? 0 : inp.volume}
                    onChange={(_, raw) => onSetVolume(inp.number, parseInt(raw))}
                    ariaLabel={`${name} volume`}
                    ariaValueText={inp.muted ? "Muted" : `${inp.volume}%`}
                  />
                  <span className="w-10 flex-shrink-0 text-right font-mono text-xs tabular-nums text-fg-muted">
                    {inp.muted ? "0%" : `${inp.volume}%`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState compact icon="ri-volume-mute-line" title="No audio inputs detected" />
      )}
    </div>
  );
}
