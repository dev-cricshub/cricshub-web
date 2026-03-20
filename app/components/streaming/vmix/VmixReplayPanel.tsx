"use client";

import type { VmixReplayState, VmixReplayEvent } from "@/lib/streaming/types";

const SPEED_OPTIONS = [
  { value: 0.1, label: "0.1x" },
  { value: 0.25, label: "0.25x" },
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1, label: "1x" },
];

const CRICKET_EVENTS = [
  { label: "Boundary (4)", icon: "ri-number-4", color: "blue" },
  { label: "Six (6)", icon: "ri-number-6", color: "purple" },
  { label: "Wicket", icon: "ri-fire-line", color: "red" },
  { label: "Catch", icon: "ri-hand-coin-line", color: "orange" },
  { label: "Run Out", icon: "ri-run-line", color: "red" },
  { label: "LBW", icon: "ri-shield-line", color: "amber" },
  { label: "Great Shot", icon: "ri-star-line", color: "yellow" },
  { label: "Custom", icon: "ri-bookmark-line", color: "gray" },
];

interface Props {
  replay: VmixReplayState;
  events: VmixReplayEvent[];
  onPlay: () => void;
  onPause: () => void;
  onMarkIn: () => void;
  onMarkOut: () => void;
  onChangeSpeed: (speed: number) => void;
  onLive: () => void;
  onSelectChannelA: () => void;
  onSelectChannelB: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onMarkEvent: (label: string) => void;
}

export default function VmixReplayPanel({
  replay,
  events,
  onPlay,
  onPause,
  onMarkIn,
  onMarkOut,
  onChangeSpeed,
  onLive,
  onSelectChannelA,
  onSelectChannelB,
  onStartRecording,
  onStopRecording,
  onMarkEvent,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Recording control */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Replay Recording
          </p>
          {replay.recording && (
            <span className="text-[9px] font-black text-red-500 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              RECORDING
            </span>
          )}
        </div>
        <button
          onClick={replay.recording ? onStopRecording : onStartRecording}
          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
            replay.recording
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
          }`}
        >
          <i className={replay.recording ? "ri-stop-fill mr-1" : "ri-record-circle-fill mr-1"} />
          {replay.recording ? "Stop Replay Recording" : "Start Replay Recording"}
        </button>
      </div>

      {/* Channel A/B */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Replay Channel
        </p>
        <div className="flex gap-2">
          <button
            onClick={onSelectChannelA}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              replay.channelMode === "A"
                ? "bg-[#34B8FF] text-white shadow-md"
                : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            Channel A
          </button>
          <button
            onClick={onSelectChannelB}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              replay.channelMode === "B"
                ? "bg-[#34B8FF] text-white shadow-md"
                : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            Channel B
          </button>
        </div>
      </div>

      {/* Playback controls */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Playback
        </p>
        <div className="flex gap-2 mb-3">
          <button
            onClick={onMarkIn}
            className="flex-1 py-2.5 rounded-xl bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-all border border-green-200"
          >
            <i className="ri-skip-back-mini-line mr-1" />
            Mark In
          </button>
          <button
            onClick={onPlay}
            className="flex-1 py-2.5 rounded-xl bg-[#34B8FF] text-white text-xs font-bold hover:bg-[#1E88E5] transition-all shadow-md"
          >
            <i className="ri-play-fill mr-1" />
            Play
          </button>
          <button
            onClick={onPause}
            className="flex-1 py-2.5 rounded-xl bg-yellow-50 text-yellow-700 text-xs font-bold hover:bg-yellow-100 transition-all border border-yellow-200"
          >
            <i className="ri-pause-fill mr-1" />
            Pause
          </button>
          <button
            onClick={onMarkOut}
            className="flex-1 py-2.5 rounded-xl bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-all border border-green-200"
          >
            <i className="ri-skip-forward-mini-line mr-1" />
            Mark Out
          </button>
        </div>
        <button
          onClick={onLive}
          className="w-full py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all"
        >
          <i className="ri-live-line mr-1" />
          Back to LIVE
        </button>
      </div>

      {/* Speed control */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Replay Speed
        </p>
        <div className="flex gap-1.5">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => onChangeSpeed(s.value)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                replay.speed === s.value
                  ? "bg-[#34B8FF] text-white shadow-md"
                  : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cricket event markers */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          <i className="ri-bookmark-line mr-1" />
          Mark Cricket Event (Quick Replay)
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {CRICKET_EVENTS.map((evt) => (
            <button
              key={evt.label}
              onClick={() => onMarkEvent(evt.label)}
              className={`py-2.5 rounded-xl text-[10px] font-bold transition-all bg-${evt.color}-50 text-${evt.color}-600 border border-${evt.color}-200 hover:bg-${evt.color}-100`}
            >
              <i className={`${evt.icon} block text-base mb-0.5`} />
              {evt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event log */}
      {events.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Marked Events ({events.length})
          </p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {events
              .slice()
              .reverse()
              .map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100"
                >
                  <span className="text-xs text-gray-700 font-medium">{evt.label}</span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(evt.timestamp).toLocaleTimeString()} @ {evt.speed}x
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
