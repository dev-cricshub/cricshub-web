"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui";

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
    <div className="space-y-3">
      <Button
        variant="outline"
        block
        icon="ri-camera-line"
        loading={taking}
        disabled={!currentScene}
        onClick={handleTake}
      >
        {taking ? "Capturing…" : "Take screenshot"}
      </Button>
      {lastScreenshot ? (
        <figure className="overflow-hidden rounded-xl border border-line bg-surface-2 animate-fade-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lastScreenshot} alt={`Screenshot of ${currentScene || "current scene"}`} className="h-auto w-full" />
          {currentScene && (
            <figcaption className="truncate border-t border-line px-3 py-1.5 text-xs text-fg-subtle">
              {currentScene}
            </figcaption>
          )}
        </figure>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface-2 text-xs text-fg-subtle">
          <span className="flex items-center gap-1.5">
            <i className="ri-image-line text-base" aria-hidden />
            No screenshot yet
          </span>
        </div>
      )}
    </div>
  );
}
