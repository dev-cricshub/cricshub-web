"use client";

import type { VmixOverlayChannel, VmixInput } from "@/lib/streaming/types";

interface Props {
  overlays: VmixOverlayChannel[];
  inputs: VmixInput[];
  onOverlayIn: (channel: 1 | 2 | 3 | 4, input: number) => void;
  onOverlayOut: (channel: 1 | 2 | 3 | 4) => void;
  onOverlayOff: (channel: 1 | 2 | 3 | 4) => void;
}

const CHANNEL_COLORS = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", activeBg: "bg-blue-500" },
  { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600", activeBg: "bg-purple-500" },
  { bg: "bg-green-50", border: "border-green-200", text: "text-green-600", activeBg: "bg-green-500" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-600", activeBg: "bg-orange-500" },
];

export default function VmixOverlayChannels({
  overlays,
  inputs,
  onOverlayIn,
  onOverlayOut,
  onOverlayOff,
}: Props) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        <i className="ri-stack-line mr-1" />
        Overlay Channels (1–4)
      </p>
      <div className="space-y-2">
        {overlays.map((ov, i) => {
          const colors = CHANNEL_COLORS[i] ?? CHANNEL_COLORS[0];
          const currentInput = inputs.find((inp) => inp.number === ov.inputNumber);
          return (
            <div
              key={ov.number}
              className={`rounded-xl border ${ov.active ? colors.border : "border-gray-200"} ${
                ov.active ? colors.bg : "bg-gray-50"
              } px-3 py-2.5`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white ${
                      ov.active ? colors.activeBg : "bg-gray-300"
                    }`}
                  >
                    {ov.number}
                  </span>
                  <span className="text-xs font-bold text-gray-700">
                    Overlay {ov.number}
                    {currentInput && (
                      <span className="text-gray-400 font-normal ml-1">
                        — {currentInput.title || currentInput.type}
                      </span>
                    )}
                  </span>
                </div>
                {ov.active && (
                  <span className={`text-[9px] font-black ${colors.text} uppercase`}>ON</span>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-600"
                  value={ov.inputNumber ?? ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val) onOverlayIn(ov.number, val);
                  }}
                >
                  <option value="">Select input...</option>
                  {inputs.map((inp) => (
                    <option key={inp.key} value={inp.number}>
                      {inp.number}. {inp.title || inp.type}
                    </option>
                  ))}
                </select>
                {ov.active ? (
                  <button
                    onClick={() => onOverlayOut(ov.number)}
                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-200 hover:bg-red-100 transition-all"
                  >
                    OFF
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (ov.inputNumber) onOverlayIn(ov.number, ov.inputNumber);
                    }}
                    disabled={!ov.inputNumber}
                    className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-bold border border-green-200 hover:bg-green-100 transition-all disabled:opacity-40"
                  >
                    ON
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-400 mt-2">
        Use overlays for independent layers: score on Ch1, banners on Ch2, branding on Ch3, replay on Ch4
      </p>
    </div>
  );
}
