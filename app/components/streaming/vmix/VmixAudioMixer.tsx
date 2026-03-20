"use client";

import type { VmixInput } from "@/lib/streaming/types";

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
      <div className="bg-gray-900 rounded-xl px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white font-bold">MASTER</span>
          <button
            onClick={() => onSetMute("master", !masterMuted)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
              masterMuted ? "bg-red-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <i className={masterMuted ? "ri-volume-mute-line" : "ri-volume-up-line"} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            value={masterMuted ? 0 : masterVolume}
            onChange={(e) => onSetMasterVolume(parseInt(e.target.value))}
            className="flex-1 h-1.5 accent-white cursor-pointer"
          />
          <span className="text-[10px] text-gray-400 font-mono w-8 text-right">
            {masterMuted ? "0%" : `${masterVolume}%`}
          </span>
        </div>
      </div>

      {/* Per-input */}
      {audioInputs.length > 0 ? (
        <div className="space-y-2">
          {audioInputs.map((inp) => (
            <div
              key={inp.key}
              className="bg-gray-50 rounded-xl border border-gray-100 px-3 py-2.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-700 font-medium truncate mr-2">
                  {inp.number}. {inp.title || inp.type}
                </span>
                <button
                  onClick={() => onSetMute(inp.number, !inp.muted)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                    inp.muted
                      ? "bg-red-100 text-red-500"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  <i className={inp.muted ? "ri-volume-mute-line" : "ri-volume-up-line"} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={inp.muted ? 0 : inp.volume}
                  onChange={(e) => onSetVolume(inp.number, parseInt(e.target.value))}
                  className="flex-1 h-1.5 accent-[#34B8FF] cursor-pointer"
                />
                <span className="text-[10px] text-gray-400 font-mono w-8 text-right">
                  {inp.muted ? "0%" : `${inp.volume}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-gray-400 text-center py-2">
          No audio inputs detected
        </p>
      )}
    </div>
  );
}
