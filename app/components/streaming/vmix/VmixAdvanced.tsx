"use client";

import { useState } from "react";
import type { VmixInput } from "@/lib/streaming/types";

interface Props {
  inputs: VmixInput[];
  onPtzMove: (input: number, direction: string, speed: number) => void;
  onPtzHome: (input: number) => void;
  onPtzZoomIn: (input: number, speed: number) => void;
  onPtzZoomOut: (input: number, speed: number) => void;
}

const PTZ_DIRECTIONS = [
  { dir: "Up", icon: "ri-arrow-up-line", col: "col-start-2" },
  { dir: "Left", icon: "ri-arrow-left-line", col: "col-start-1" },
  { dir: "Home", icon: "ri-home-4-line", col: "col-start-2", isHome: true },
  { dir: "Right", icon: "ri-arrow-right-line", col: "col-start-3" },
  { dir: "Down", icon: "ri-arrow-down-line", col: "col-start-2" },
];

export default function VmixAdvanced({
  inputs,
  onPtzMove,
  onPtzHome,
  onPtzZoomIn,
  onPtzZoomOut,
}: Props) {
  const [ptzInput, setPtzInput] = useState<number | null>(null);
  const [ptzSpeed, setPtzSpeed] = useState(0.5);

  return (
    <div className="space-y-5">
      {/* PTZ Camera Control */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          <i className="ri-webcam-line mr-1" />
          PTZ Camera Control
        </p>

        <select
          value={ptzInput ?? ""}
          onChange={(e) => setPtzInput(parseInt(e.target.value) || null)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 mb-3"
        >
          <option value="">Select camera input...</option>
          {inputs.map((inp) => (
            <option key={inp.key} value={inp.number}>
              {inp.number}. {inp.title || inp.type}
            </option>
          ))}
        </select>

        {ptzInput && (
          <>
            {/* Direction pad */}
            <div className="grid grid-cols-3 gap-1.5 w-32 mx-auto mb-3">
              {PTZ_DIRECTIONS.map((d) => (
                <button
                  key={d.dir}
                  onClick={() =>
                    d.isHome
                      ? onPtzHome(ptzInput)
                      : onPtzMove(ptzInput, d.dir, ptzSpeed)
                  }
                  className={`${d.col} w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-all`}
                >
                  <i className={d.icon} />
                </button>
              ))}
            </div>

            {/* Zoom */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => onPtzZoomOut(ptzInput, ptzSpeed)}
                className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-all"
              >
                <i className="ri-zoom-out-line mr-1" />
                Zoom Out
              </button>
              <button
                onClick={() => onPtzZoomIn(ptzInput, ptzSpeed)}
                className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-all"
              >
                <i className="ri-zoom-in-line mr-1" />
                Zoom In
              </button>
            </div>

            {/* Speed control */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Speed</span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.1}
                value={ptzSpeed}
                onChange={(e) => setPtzSpeed(parseFloat(e.target.value))}
                className="flex-1 h-1.5 accent-[#34B8FF] cursor-pointer"
              />
              <span className="text-[10px] text-gray-400 font-mono w-8 text-right">
                {ptzSpeed.toFixed(1)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Virtual Set Info */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          <i className="ri-landscape-line mr-1" />
          Virtual Sets
        </p>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            Virtual sets are configured directly in vMix. Add a Virtual Set input in vMix and use the
            input switcher above to switch to it. Use PTZ controls to adjust the virtual camera position.
          </p>
        </div>
      </div>

      {/* NDI Info */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          <i className="ri-broadcast-line mr-1" />
          NDI Output
        </p>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            NDI output is controlled via External Output above. Enable it in vMix Settings → Outputs → NDI.
            Once enabled, use "Start External Output" in the Stream & Record section.
          </p>
        </div>
      </div>
    </div>
  );
}
