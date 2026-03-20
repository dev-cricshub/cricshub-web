"use client";

import type { ObsScene } from "@/lib/streaming/types";

interface Props {
  scenes: ObsScene[];
  currentScene: string;
  onSwitch: (sceneName: string) => void;
}

export default function ObsSceneSwitcher({ scenes, currentScene, onSwitch }: Props) {
  if (!scenes.length) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        <i className="ri-layout-grid-line mr-1" />
        Scenes
      </p>
      <div className="grid grid-cols-2 gap-2">
        {scenes.map((s) => {
          const active = s.sceneName === currentScene;
          return (
            <button
              key={s.sceneName}
              onClick={() => onSwitch(s.sceneName)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all truncate ${
                active
                  ? "bg-red-500 text-white shadow-md shadow-red-200"
                  : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {active && <i className="ri-live-line mr-1" />}
              {s.sceneName}
            </button>
          );
        })}
      </div>
    </div>
  );
}
