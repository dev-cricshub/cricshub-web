"use client";

import type { ObsStreamStatus, ObsRecordStatus } from "@/lib/streaming/types";
import { Button } from "@/app/components/ui";
import { StatusStrip, SubLabel } from "../StudioKit";

interface Props {
  streamStatus: ObsStreamStatus;
  recordStatus: ObsRecordStatus;
  onStartStream: () => void;
  onStopStream: () => void;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onPauseRecord: () => void;
  onResumeRecord: () => void;
}

export default function ObsStreamRecordControls({
  streamStatus,
  recordStatus,
  onStartStream,
  onStopStream,
  onStartRecord,
  onStopRecord,
  onPauseRecord,
  onResumeRecord,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Stream */}
      <div>
        <SubLabel icon="ri-live-line">OBS stream</SubLabel>
        {streamStatus.active ? (
          <div className="flex items-center gap-2">
            <StatusStrip tone="live" label="Live" meta={streamStatus.timecode} />
            <Button
              variant="live"
              iconOnly
              icon="ri-stop-fill"
              aria-label="Stop OBS stream"
              onClick={onStopStream}
            />
          </div>
        ) : (
          <Button variant="outline" block icon="ri-live-line" onClick={onStartStream}>
            Start OBS stream
          </Button>
        )}
      </div>

      {/* Record */}
      <div>
        <SubLabel icon="ri-record-circle-line">Recording</SubLabel>
        {recordStatus.active ? (
          <div className="flex items-center gap-2">
            <StatusStrip
              tone={recordStatus.paused ? "warning" : "live"}
              label={recordStatus.paused ? "Paused" : "Rec"}
              meta={recordStatus.timecode}
              pulse={!recordStatus.paused}
            />
            <Button
              variant="outline"
              iconOnly
              icon={recordStatus.paused ? "ri-play-fill" : "ri-pause-fill"}
              aria-label={recordStatus.paused ? "Resume recording" : "Pause recording"}
              onClick={recordStatus.paused ? onResumeRecord : onPauseRecord}
            />
            <Button
              variant="live"
              iconOnly
              icon="ri-stop-fill"
              aria-label="Stop recording"
              onClick={onStopRecord}
            />
          </div>
        ) : (
          <Button variant="outline" block icon="ri-record-circle-line" onClick={onStartRecord}>
            Start recording
          </Button>
        )}
      </div>
    </div>
  );
}
