"use client";

import type { ObsStreamStatus, ObsRecordStatus } from "@/lib/streaming/types";

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
    <div className="space-y-3">
      {/* Stream */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          <i className="ri-live-line mr-1" />
          OBS Stream
        </p>
        <div className="flex items-center gap-2">
          {streamStatus.active ? (
            <>
              <div className="flex-1 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-700 font-bold">LIVE</span>
                <span className="text-[10px] text-red-500 font-mono ml-auto">
                  {streamStatus.timecode}
                </span>
              </div>
              <button
                onClick={onStopStream}
                className="px-3 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all"
              >
                <i className="ri-stop-fill" />
              </button>
            </>
          ) : (
            <button
              onClick={onStartStream}
              className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all border border-red-200"
            >
              <i className="ri-live-line mr-1" />
              Start OBS Stream
            </button>
          )}
        </div>
      </div>

      {/* Record */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          <i className="ri-record-circle-line mr-1" />
          Recording
        </p>
        <div className="flex items-center gap-2">
          {recordStatus.active ? (
            <>
              <div className="flex-1 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    recordStatus.paused ? "bg-yellow-500" : "bg-orange-500 animate-pulse"
                  }`}
                />
                <span className="text-xs text-orange-700 font-bold">
                  {recordStatus.paused ? "PAUSED" : "REC"}
                </span>
                <span className="text-[10px] text-orange-500 font-mono ml-auto">
                  {recordStatus.timecode}
                </span>
              </div>
              <button
                onClick={recordStatus.paused ? onResumeRecord : onPauseRecord}
                className="px-3 py-2 rounded-xl bg-yellow-50 text-yellow-700 text-xs font-bold hover:bg-yellow-100 transition-all border border-yellow-200"
              >
                <i className={recordStatus.paused ? "ri-play-fill" : "ri-pause-fill"} />
              </button>
              <button
                onClick={onStopRecord}
                className="px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-all"
              >
                <i className="ri-stop-fill" />
              </button>
            </>
          ) : (
            <button
              onClick={onStartRecord}
              className="w-full py-2.5 rounded-xl bg-orange-50 text-orange-600 text-xs font-bold hover:bg-orange-100 transition-all border border-orange-200"
            >
              <i className="ri-record-circle-line mr-1" />
              Start Recording
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
