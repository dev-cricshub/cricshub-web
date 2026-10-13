"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui";
import { Hint, StatusStrip } from "../StudioKit";

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
      {active ? (
        <div className="space-y-2">
          <StatusStrip tone="primary" label="Buffer active" />
          <div className="flex gap-2">
            <Button
              variant={saved ? "secondary" : "primary"}
              block
              icon={saved ? "ri-check-line" : "ri-save-line"}
              onClick={handleSave}
            >
              {saved ? "Clip saved" : "Save replay clip"}
            </Button>
            <Button
              variant="outline"
              iconOnly
              icon="ri-stop-circle-line"
              aria-label="Stop replay buffer"
              onClick={onStop}
            />
          </div>
          <span aria-live="polite" className="sr-only">
            {saved ? "Replay clip saved" : ""}
          </span>
          <Hint>Saves the last N seconds (configured in OBS → Settings → Output → Replay Buffer).</Hint>
        </div>
      ) : (
        <Button variant="outline" block icon="ri-history-line" onClick={onStart}>
          Start replay buffer
        </Button>
      )}
    </div>
  );
}
