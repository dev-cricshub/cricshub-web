"use client";

import type { ObsAudioInput } from "@/lib/streaming/types";
import { Button, EmptyState } from "@/app/components/ui";
import { RangeSlider, rowClasses } from "../StudioKit";

interface Props {
  audioInputs: ObsAudioInput[];
  onMute: (inputName: string, muted: boolean) => void;
  onVolume: (inputName: string, volumeDb: number) => void;
}

export default function ObsAudioMixer({ audioInputs, onMute, onVolume }: Props) {
  if (!audioInputs.length)
    return (
      <EmptyState
        compact
        icon="ri-volume-mute-line"
        title="No audio inputs"
        description="Add an audio source in OBS to control it here."
      />
    );

  return (
    <div className="space-y-2">
      {audioInputs.map((inp) => (
        <div key={inp.inputName} className={rowClasses}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-sm font-medium text-fg">{inp.inputName}</span>
            <Button
              size="sm"
              iconOnly
              variant={inp.inputMuted ? "danger" : "ghost"}
              icon={inp.inputMuted ? "ri-volume-mute-line" : "ri-volume-up-line"}
              aria-label={inp.inputMuted ? `Unmute ${inp.inputName}` : `Mute ${inp.inputName}`}
              aria-pressed={inp.inputMuted}
              onClick={() => onMute(inp.inputName, !inp.inputMuted)}
            />
          </div>
          <div className="flex items-center gap-3">
            <RangeSlider
              min={-60}
              max={0}
              step={0.5}
              value={inp.inputMuted ? -60 : inp.inputVolumeDb}
              onChange={(v) => onVolume(inp.inputName, v)}
              ariaLabel={`${inp.inputName} volume`}
              ariaValueText={inp.inputMuted ? "Muted" : `${inp.inputVolumeDb.toFixed(1)} dB`}
            />
            <span className="w-14 flex-shrink-0 text-right font-mono text-xs tabular-nums text-fg-muted">
              {inp.inputMuted ? "Muted" : `${inp.inputVolumeDb.toFixed(1)}dB`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
