"use client";

import type { VmixReplayState, VmixReplayEvent } from "@/lib/streaming/types";
import { Button, LiveBadge, cn } from "@/app/components/ui";
import { SubLabel, pressClasses } from "../StudioKit";

const SPEED_OPTIONS = [
  { value: 0.1, label: "0.1x" },
  { value: 0.25, label: "0.25x" },
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1, label: "1x" },
];

const CRICKET_EVENTS = [
  { label: "Boundary (4)", icon: "ri-number-4" },
  { label: "Six (6)", icon: "ri-number-6" },
  { label: "Wicket", icon: "ri-fire-line" },
  { label: "Catch", icon: "ri-hand-coin-line" },
  { label: "Run Out", icon: "ri-run-line" },
  { label: "LBW", icon: "ri-shield-line" },
  { label: "Great Shot", icon: "ri-star-line" },
  { label: "Custom", icon: "ri-bookmark-line" },
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
    <div className="space-y-5">
      {/* Recording control */}
      <div>
        <SubLabel
          icon="ri-record-circle-line"
          action={replay.recording ? <LiveBadge label="Recording" /> : undefined}
        >
          Replay recording
        </SubLabel>
        <Button
          variant={replay.recording ? "live" : "outline"}
          block
          icon={replay.recording ? "ri-stop-fill" : "ri-record-circle-fill"}
          aria-pressed={replay.recording}
          onClick={replay.recording ? onStopRecording : onStartRecording}
        >
          {replay.recording ? "Stop replay recording" : "Start replay recording"}
        </Button>
      </div>

      {/* Channel A/B */}
      <div>
        <SubLabel>Replay channel</SubLabel>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Replay channel">
          <button
            type="button"
            onClick={onSelectChannelA}
            aria-pressed={replay.channelMode === "A"}
            className={pressClasses(replay.channelMode === "A")}
          >
            Channel A
          </button>
          <button
            type="button"
            onClick={onSelectChannelB}
            aria-pressed={replay.channelMode === "B"}
            className={pressClasses(replay.channelMode === "B")}
          >
            Channel B
          </button>
        </div>
      </div>

      {/* Playback controls */}
      <div>
        <SubLabel>Playback</SubLabel>
        <div className="mb-2 grid grid-cols-4 gap-1.5">
          <TransportButton icon="ri-skip-back-mini-line" label="Mark in" onClick={onMarkIn} />
          <TransportButton icon="ri-play-fill" label="Play" onClick={onPlay} primary />
          <TransportButton icon="ri-pause-fill" label="Pause" onClick={onPause} />
          <TransportButton icon="ri-skip-forward-mini-line" label="Mark out" onClick={onMarkOut} />
        </div>
        <Button variant="live" block icon="ri-live-line" onClick={onLive}>
          Back to live
        </Button>
      </div>

      {/* Speed control */}
      <div>
        <SubLabel>Replay speed</SubLabel>
        <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Replay speed">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChangeSpeed(s.value)}
              aria-pressed={replay.speed === s.value}
              className={pressClasses(replay.speed === s.value, "primary", "px-1 font-mono tabular-nums")}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cricket event markers */}
      <div>
        <SubLabel icon="ri-bookmark-line">Mark cricket event</SubLabel>
        <div className="grid grid-cols-4 gap-1.5">
          {CRICKET_EVENTS.map((evt) => (
            <button
              key={evt.label}
              type="button"
              onClick={() => onMarkEvent(evt.label)}
              title={`Mark ${evt.label}`}
              className={pressClasses(false, "primary", "min-h-[52px] min-w-0 flex-col gap-0.5 px-1 py-1.5 text-2xs")}
            >
              <i className={cn(evt.icon, "text-base leading-none text-primary")} aria-hidden />
              <span className="w-full text-center leading-tight">{evt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Event log */}
      {events.length > 0 && (
        <div>
          <SubLabel>
            Marked events <span className="font-mono tabular-nums">({events.length})</span>
          </SubLabel>
          <ul className="max-h-36 divide-y divide-line overflow-y-auto rounded-xl border border-line bg-surface-2">
            {events
              .slice()
              .reverse()
              .map((evt) => (
                <li key={evt.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="truncate text-xs font-medium text-fg">{evt.label}</span>
                  <span className="flex-shrink-0 font-mono text-2xs tabular-nums text-fg-subtle">
                    {new Date(evt.timestamp).toLocaleTimeString()} @ {evt.speed}x
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TransportButton({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[52px] min-w-0 select-none flex-col items-center justify-center gap-0.5 rounded-lg border px-1 text-2xs font-medium",
        "transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        primary
          ? "border-primary bg-primary text-primary-fg shadow-xs hover:bg-primary-hover"
          : "border-line-strong bg-surface text-fg-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      <i className={cn(icon, "text-lg leading-none")} aria-hidden />
      <span className="w-full truncate text-center">{label}</span>
    </button>
  );
}
