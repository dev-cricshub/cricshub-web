"use client";

import { useState } from "react";

interface Props {
  lastScreenshot: string | null;
  currentScene: string;
  onTake: (sourceName: string) => Promise<string>;
}

export default function ObsScreenshot({ lastScreenshot, currentScene, onTake }: Props) {
  const [taking, setTaking] = useState(false);

  const handleTake = async () => {
    setTaking(true);
    try {
      await onTake(currentScene);
    } catch {}
    setTaking(false);
  };

  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        <i className="ri-screenshot-line mr-1" />
        Screenshot
      </p>
      <button
        onClick={handleTake}
        disabled={taking || !currentScene}
        className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-all border border-gray-200 disabled:opacity-50"
      >
        {taking ? (
          <>
            <i className="ri-loader-4-line animate-spin mr-1" />
            Capturing...
          </>
        ) : (
          <>
            <i className="ri-camera-line mr-1" />
            Take Screenshot
          </>
        )}
      </button>
      {lastScreenshot && (
        <div className="mt-2 rounded-xl overflow-hidden border border-gray-200">
          <img
            src={lastScreenshot}
            alt="Screenshot"
            className="w-full h-auto"
          />
        </div>
      )}
    </div>
  );
}
