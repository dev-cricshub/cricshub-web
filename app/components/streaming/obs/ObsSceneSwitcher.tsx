"use client";

import type { ObsScene } from "@/lib/streaming/types";
import { SubLabel, pressClasses } from "../StudioKit";

interface Props {
  scenes: ObsScene[];
  currentScene: string;
  onSwitch: (sceneName: string) => void;
}

export default function ObsSceneSwitcher({ scenes, currentScene, onSwitch }: Props) {
  if (!scenes.length) return null;
  return (
    <div>
      <SubLabel icon="ri-layout-grid-line">Scenes</SubLabel>
      <div className="grid grid-cols-2 gap-2">
        {scenes.map((s) => {
          const active = s.sceneName === currentScene;
          return (
            <button
              key={s.sceneName}
              type="button"
              onClick={() => onSwitch(s.sceneName)}
              aria-pressed={active}
              title={s.sceneName}
              className={pressClasses(active, "live", "min-w-0 py-2")}
            >
              {active && <i className="ri-live-line flex-shrink-0" aria-hidden />}
              <span className="truncate">{s.sceneName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
