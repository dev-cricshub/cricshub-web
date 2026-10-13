"use client";

import { Button } from "@/app/components/ui";
import { StatusStrip, SubLabel } from "../StudioKit";

interface Props {
  streaming: boolean;
  recording: boolean;
  external: boolean;
  onStartStream: () => void;
  onStopStream: () => void;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onStartExternal: () => void;
  onStopExternal: () => void;
}

export default function VmixStreamRecordControls({
  streaming,
  recording,
  external,
  onStartStream,
  onStopStream,
  onStartRecord,
  onStopRecord,
  onStartExternal,
  onStopExternal,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Stream */}
      <div>
        <SubLabel icon="ri-live-line">vMix stream</SubLabel>
        {streaming ? (
          <div className="flex items-center gap-2">
            <StatusStrip tone="live" label="Streaming live" />
            <Button variant="live" icon="ri-stop-fill" onClick={onStopStream}>
              Stop
            </Button>
          </div>
        ) : (
          <Button variant="outline" block icon="ri-live-line" onClick={onStartStream}>
            Start streaming
          </Button>
        )}
      </div>

      {/* Record */}
      <div>
        <SubLabel icon="ri-record-circle-line">Recording</SubLabel>
        {recording ? (
          <div className="flex items-center gap-2">
            <StatusStrip tone="live" label="Recording" />
            <Button variant="live" icon="ri-stop-fill" onClick={onStopRecord}>
              Stop
            </Button>
          </div>
        ) : (
          <Button variant="outline" block icon="ri-record-circle-line" onClick={onStartRecord}>
            Start recording
          </Button>
        )}
      </div>

      {/* External Output */}
      <div>
        <SubLabel icon="ri-external-link-line">External output (NDI / fullscreen)</SubLabel>
        {external ? (
          <div className="flex items-center gap-2">
            <StatusStrip tone="primary" label="External on" />
            <Button variant="primary" icon="ri-stop-fill" onClick={onStopExternal}>
              Stop
            </Button>
          </div>
        ) : (
          <Button variant="outline" block icon="ri-external-link-line" onClick={onStartExternal}>
            Start external output
          </Button>
        )}
      </div>
    </div>
  );
}
