"use client";

import type { useVmix } from "@/hooks/useVmix";
import VmixInputSwitcher from "./VmixInputSwitcher";
import VmixTransitionBar from "./VmixTransitionBar";
import VmixReplayPanel from "./VmixReplayPanel";
import VmixOverlayChannels from "./VmixOverlayChannels";
import VmixStreamRecordControls from "./VmixStreamRecordControls";
import VmixAudioMixer from "./VmixAudioMixer";
import VmixTitling from "./VmixTitling";
import VmixAdvanced from "./VmixAdvanced";
import { ControlSection } from "../StudioKit";

type VmixHook = ReturnType<typeof useVmix>;

interface Props {
  vmix: VmixHook;
}

export default function VmixControlPanel({ vmix }: Props) {
  if (vmix.status !== "connected") return null;

  const onAir = vmix.state.streaming;
  const recording = vmix.state.recording;

  return (
    <div className="space-y-4">
      <ControlSection title="Input switcher" icon="ri-vidicon-line">
        <VmixInputSwitcher
          inputs={vmix.state.inputs}
          activeInput={vmix.state.activeInput}
          previewInput={vmix.state.previewInput}
          onCut={vmix.cutInput}
          onPreview={vmix.previewInput}
        />
      </ControlSection>

      <ControlSection title="Transitions" icon="ri-swap-line">
        <VmixTransitionBar
          inputs={vmix.state.inputs}
          previewInput={vmix.state.previewInput}
          onTransition={vmix.transitionTo}
          onFadeToBlack={vmix.doFadeToBlack}
          fadeToBlack={vmix.state.fadeToBlack}
        />
      </ControlSection>

      <ControlSection title="Instant replay" icon="ri-history-line" badge="Cricket" badgeTone="success">
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
      </ControlSection>

      <ControlSection title="Overlay channels" icon="ri-stack-line">
        <VmixOverlayChannels
          overlays={vmix.state.overlays}
          inputs={vmix.state.inputs}
          onOverlayIn={vmix.overlayIn}
          onOverlayOut={vmix.overlayOut}
          onOverlayOff={vmix.overlayOff}
        />
      </ControlSection>

      <ControlSection
        title="Stream & record"
        icon="ri-live-line"
        badge={onAir ? "On air" : recording ? "Rec" : undefined}
        badgeTone="live"
      >
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
      </ControlSection>

      <ControlSection title="Audio mixer" icon="ri-volume-up-line" defaultOpen={false}>
        <VmixAudioMixer
          inputs={vmix.state.inputs}
          masterVolume={vmix.state.audio.master.volume}
          masterMuted={vmix.state.audio.master.muted}
          onSetVolume={vmix.setVolume}
          onSetMute={vmix.setMute}
          onSetMasterVolume={vmix.setMasterVolume}
        />
      </ControlSection>

      <ControlSection title="Dynamic titling" icon="ri-text" defaultOpen={false}>
        <VmixTitling inputs={vmix.state.inputs} onSetTitle={vmix.setTitle} />
      </ControlSection>

      <ControlSection title="Advanced (PTZ / NDI)" icon="ri-settings-4-line" defaultOpen={false}>
        <VmixAdvanced
          inputs={vmix.state.inputs}
          onPtzMove={vmix.ptzMove}
          onPtzHome={vmix.ptzHome}
          onPtzZoomIn={vmix.ptzZoomIn}
          onPtzZoomOut={vmix.ptzZoomOut}
        />
      </ControlSection>
    </div>
  );
}
