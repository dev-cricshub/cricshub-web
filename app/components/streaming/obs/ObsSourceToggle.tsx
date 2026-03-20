"use client";

import type { ObsSceneItem } from "@/lib/streaming/types";

interface Props {
  items: ObsSceneItem[];
  onToggle: (sceneItemId: number, visible: boolean) => void;
}

export default function ObsSourceToggle({ items, onToggle }: Props) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        <i className="ri-stack-line mr-1" />
        Sources
      </p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.sceneItemId}
            className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100"
          >
            <span className="text-xs text-gray-700 truncate mr-2">{item.sourceName}</span>
            <button
              onClick={() => onToggle(item.sceneItemId, !item.sceneItemEnabled)}
              className={`w-9 h-5 rounded-full transition-all flex-shrink-0 relative ${
                item.sceneItemEnabled ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  item.sceneItemEnabled ? "left-[18px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
