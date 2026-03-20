"use client";

import { useState } from "react";

interface Props {
  active: boolean;
  onStart: () => void;
  onStop: () => void;
  onSave: () => void;
}

export default function ObsReplayBuffer({ active, onStart, onStop, onSave }: Props) {
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        <i className="ri-replay-line mr-1" />
        Replay Buffer
      </p>
      {active ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-xs text-purple-700 font-bold">Buffer Active</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                saved
                  ? "bg-green-500 text-white"
                  : "bg-purple-500 text-white hover:bg-purple-600"
              }`}
            >
              {saved ? (
                <>
                  <i className="ri-check-line mr-1" />
                  Clip Saved!
                </>
              ) : (
                <>
                  <i className="ri-save-line mr-1" />
                  Save Replay Clip
                </>
              )}
            </button>
            <button
              onClick={onStop}
              className="px-3 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-all border border-gray-200"
            >
              <i className="ri-stop-circle-line" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400">
            Saves the last N seconds (configured in OBS → Settings → Output → Replay Buffer)
          </p>
        </div>
      ) : (
        <button
          onClick={onStart}
          className="w-full py-2.5 rounded-xl bg-purple-50 text-purple-600 text-xs font-bold hover:bg-purple-100 transition-all border border-purple-200"
        >
          <i className="ri-replay-line mr-1" />
          Start Replay Buffer
        </button>
      )}
    </div>
  );
}
