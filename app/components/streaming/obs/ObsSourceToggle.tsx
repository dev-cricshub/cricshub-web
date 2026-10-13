"use client";

import type { ObsSceneItem } from "@/lib/streaming/types";
import { Switch } from "@/app/components/ui";
import { SubLabel } from "../StudioKit";

interface Props {
  items: ObsSceneItem[];
  onToggle: (sceneItemId: number, visible: boolean) => void;
}

export default function ObsSourceToggle({ items, onToggle }: Props) {
  if (!items.length) return null;
  return (
    <div>
      <SubLabel icon="ri-stack-line">Sources</SubLabel>
      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface-2">
        {items.map((item) => (
          <Switch
            key={item.sceneItemId}
            checked={item.sceneItemEnabled}
            onChange={(next) => onToggle(item.sceneItemId, next)}
            label={<span className="block truncate text-sm font-normal">{item.sourceName}</span>}
            className="px-3 py-2"
          />
        ))}
      </div>
    </div>
  );
}
