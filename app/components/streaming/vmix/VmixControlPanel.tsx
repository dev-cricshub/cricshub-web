"use client";

import { useState } from "react";
import type { useVmix } from "@/hooks/useVmix";
import VmixInputSwitcher from "./VmixInputSwitcher";
import VmixTransitionBar from "./VmixTransitionBar";
import VmixReplayPanel from "./VmixReplayPanel";
import VmixOverlayChannels from "./VmixOverlayChannels";
import VmixStreamRecordControls from "./VmixStreamRecordControls";
import VmixAudioMixer from "./VmixAudioMixer";
import VmixTitling from "./VmixTitling";
import VmixAdvanced from "./VmixAdvanced";

type VmixHook = ReturnType<typeof useVmix>;

interface Props {
  vmix: VmixHook;
}

interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
  badgeColor?: string;
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
  badge,
  badgeColor = "bg-gray-100 text-gray-500",
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3.5 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            <i className={`${icon} mr-1`} />
            {title}
          </p>
          {badge && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <i className={`ri-arrow-${open ? "up" : "down"}-s-line text-gray-400`} />
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

export default function VmixControlPanel({ vmix }: Props) {
  if (vmix.status !== "connected") return null;

  return (
    <div className="space-y-4">
      <CollapsibleSection title="Input Switcher" icon="ri-vidicon-line">
        <VmixInputSwitcher
          inputs={vmix.state.inputs}
          activeInput={vmix.state.activeInput}
          previewInput={vmix.state.previewInput}
          onCut={vmix.cutInput}
          onPreview={vmix.previewInput}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Transitions" icon="ri-swap-line">
        <VmixTransitionBar
          inputs={vmix.state.inputs}
          previewInput={vmix.state.previewInput}
          onTransition={vmix.transitionTo}
          onFadeToBlack={vmix.doFadeToBlack}
          fadeToBlack={vmix.state.fadeToBlack}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Instant Replay"
        icon="ri-replay-line"
        badge="CRICKET"
        badgeColor="bg-green-100 text-green-600"
      >
        <VmixReplayPanel
          replay={vmix.state.replay}
          events={vmix.replayEvents}
          onPlay={vmix.replayPlay}
          onPause={vmix.replayPause}
          onMarkIn={vmix.replayMarkIn}
          onMarkOut={vmix.replayMarkOut}
          onChangeSpeed={vmix.replayChangeSpeed}
          onLive={vmix.replayLive}
          onSelectChannelA={vmix.replaySelectChannelA}
          onSelectChannelB={vmix.replaySelectChannelB}
          onStartRecording={vmix.replayStartRecording}
          onStopRecording={vmix.replayStopRecording}
          onMarkEvent={vmix.markReplayEvent}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Overlay Channels" icon="ri-stack-line">
        <VmixOverlayChannels
          overlays={vmix.state.overlays}
          inputs={vmix.state.inputs}
          onOverlayIn={vmix.overlayIn}
          onOverlayOut={vmix.overlayOut}
          onOverlayOff={vmix.overlayOff}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Stream & Record" icon="ri-live-line">
        <VmixStreamRecordControls
          streaming={vmix.state.streaming}
          recording={vmix.state.recording}
          external={vmix.state.external}
          onStartStream={vmix.startStreaming}
          onStopStream={vmix.stopStreaming}
          onStartRecord={vmix.startRecording}
          onStopRecord={vmix.stopRecording}
          onStartExternal={vmix.startExternal}
          onStopExternal={vmix.stopExternal}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Audio Mixer" icon="ri-volume-up-line" defaultOpen={false}>
        <VmixAudioMixer
          inputs={vmix.state.inputs}
          masterVolume={vmix.state.audio.master.volume}
          masterMuted={vmix.state.audio.master.muted}
          onSetVolume={vmix.setVolume}
          onSetMute={vmix.setMute}
          onSetMasterVolume={vmix.setMasterVolume}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Dynamic Titling" icon="ri-text" defaultOpen={false}>
        <VmixTitling inputs={vmix.state.inputs} onSetTitle={vmix.setTitle} />
      </CollapsibleSection>

      <CollapsibleSection title="Advanced (PTZ / NDI)" icon="ri-settings-4-line" defaultOpen={false}>
        <VmixAdvanced
          inputs={vmix.state.inputs}
          onPtzMove={vmix.ptzMove}
          onPtzHome={vmix.ptzHome}
          onPtzZoomIn={vmix.ptzZoomIn}
          onPtzZoomOut={vmix.ptzZoomOut}
        />
      </CollapsibleSection>
    </div>
  );
}
