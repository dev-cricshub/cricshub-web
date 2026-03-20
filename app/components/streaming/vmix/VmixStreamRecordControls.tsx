"use client";

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
    <div className="space-y-3">
      {/* Stream */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          <i className="ri-live-line mr-1" />
          vMix Stream
        </p>
        {streaming ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-700 font-bold">STREAMING LIVE</span>
            </div>
            <button
              onClick={onStopStream}
              className="px-3 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all"
            >
              <i className="ri-stop-fill" /> Stop
            </button>
          </div>
        ) : (
          <button
            onClick={onStartStream}
            className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all border border-red-200"
          >
            <i className="ri-live-line mr-1" />
            Start Streaming
          </button>
        )}
      </div>

      {/* Record */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          <i className="ri-record-circle-line mr-1" />
          Recording
        </p>
        {recording ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs text-orange-700 font-bold">RECORDING</span>
            </div>
            <button
              onClick={onStopRecord}
              className="px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-all"
            >
              <i className="ri-stop-fill" /> Stop
            </button>
          </div>
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

      {/* External Output */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          <i className="ri-external-link-line mr-1" />
          External Output (NDI / Fullscreen)
        </p>
        {external ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs text-blue-700 font-bold">EXTERNAL ON</span>
            </div>
            <button
              onClick={onStopExternal}
              className="px-3 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-all"
            >
              <i className="ri-stop-fill" /> Stop
            </button>
          </div>
        ) : (
          <button
            onClick={onStartExternal}
            className="w-full py-2.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-all border border-blue-200"
          >
            <i className="ri-external-link-line mr-1" />
            Start External Output
          </button>
        )}
      </div>
    </div>
  );
}
