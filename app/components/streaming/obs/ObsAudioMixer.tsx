"use client";

import type { ObsAudioInput } from "@/lib/streaming/types";

interface Props {
  audioInputs: ObsAudioInput[];
  onMute: (inputName: string, muted: boolean) => void;
  onVolume: (inputName: string, volumeDb: number) => void;
}

export default function ObsAudioMixer({ audioInputs, onMute, onVolume }: Props) {
  if (!audioInputs.length) return null;

  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        <i className="ri-volume-up-line mr-1" />
        Audio Mixer
      </p>
      <div className="space-y-2">
        {audioInputs.map((inp) => {
          const pct = Math.max(0, Math.min(100, ((inp.inputVolumeDb + 60) / 60) * 100));
          return (
            <div
              key={inp.inputName}
              className="bg-gray-50 rounded-xl border border-gray-100 px-3 py-2.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-700 font-medium truncate mr-2">
                  {inp.inputName}
                </span>
                <button
                  onClick={() => onMute(inp.inputName, !inp.inputMuted)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                    inp.inputMuted
                      ? "bg-red-100 text-red-500"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  <i className={inp.inputMuted ? "ri-volume-mute-line" : "ri-volume-up-line"} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={-60}
                  max={0}
                  step={0.5}
                  value={inp.inputMuted ? -60 : inp.inputVolumeDb}
                  onChange={(e) => onVolume(inp.inputName, parseFloat(e.target.value))}
                  className="flex-1 h-1.5 accent-[#34B8FF] cursor-pointer"
                />
                <span className="text-[10px] text-gray-400 font-mono w-10 text-right">
                  {inp.inputMuted ? "Mute" : `${inp.inputVolumeDb.toFixed(1)}dB`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
