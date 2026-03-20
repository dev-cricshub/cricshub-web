"use client";

import type { VmixInput } from "@/lib/streaming/types";

interface Props {
  inputs: VmixInput[];
  activeInput: number | null;
  previewInput: number | null;
  onCut: (input: number) => void;
  onPreview: (input: number) => void;
}

export default function VmixInputSwitcher({
  inputs,
  activeInput,
  previewInput,
  onCut,
  onPreview,
}: Props) {
  if (!inputs.length) return null;

  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        <i className="ri-vidicon-line mr-1" />
        Inputs
      </p>
      <div className="grid grid-cols-2 gap-2">
        {inputs.map((inp) => {
          const isActive = inp.number === activeInput;
          const isPreview = inp.number === previewInput;
          return (
            <div
              key={inp.key}
              className={`rounded-xl border-2 overflow-hidden transition-all ${
                isActive
                  ? "border-red-500 shadow-md shadow-red-100"
                  : isPreview
                    ? "border-green-400 shadow-md shadow-green-100"
                    : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className={`px-3 py-2 ${
                  isActive ? "bg-red-50" : isPreview ? "bg-green-50" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-700 truncate">
                    {inp.number}. {inp.title || inp.type}
                  </span>
                  {isActive && (
                    <span className="text-[9px] font-black text-red-500 bg-red-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                      PGM
                    </span>
                  )}
                  {isPreview && !isActive && (
                    <span className="text-[9px] font-black text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                      PVW
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 truncate">{inp.type}</p>
              </div>
              <div className="flex border-t border-gray-100">
                <button
                  onClick={() => onPreview(inp.number)}
                  className="flex-1 py-1.5 text-[10px] font-bold text-green-600 hover:bg-green-50 transition-all border-r border-gray-100"
                >
                  PVW
                </button>
                <button
                  onClick={() => onCut(inp.number)}
                  className="flex-1 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 transition-all"
                >
                  CUT
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
