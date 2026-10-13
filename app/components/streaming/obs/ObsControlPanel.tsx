"use client";

import type { useObs } from "@/hooks/useObs";
import ObsSceneSwitcher from "./ObsSceneSwitcher";
import ObsSourceToggle from "./ObsSourceToggle";
import ObsStreamRecordControls from "./ObsStreamRecordControls";
import ObsReplayBuffer from "./ObsReplayBuffer";
import ObsAudioMixer from "./ObsAudioMixer";
import ObsScreenshot from "./ObsScreenshot";
import ObsHotkeyPanel from "./ObsHotkeyPanel";
import { ControlSection } from "../StudioKit";

type ObsHook = ReturnType<typeof useObs>;

interface Props {
  obs: ObsHook;
}

export default function ObsControlPanel({ obs }: Props) {
  if (obs.status !== "connected") return null;

  const onAir = obs.state.streamStatus.active;
  const recording = obs.state.recordStatus.active;

  return (
    <div className="space-y-4">
      <ControlSection title="Scene control" icon="ri-layout-grid-line">
        <ObsSceneSwitcher
          scenes={obs.state.scenes}
          currentScene={obs.state.currentScene}
          onSwitch={obs.switchScene}
        />
        <ObsSourceToggle items={obs.state.sceneItems} onToggle={obs.setSourceVisible} />
      </ControlSection>

      <ControlSection
        title="Stream & record"
        icon="ri-live-line"
        badge={onAir ? "On air" : recording ? "Rec" : undefined}
        badgeTone="live"
      >
        <ObsStreamRecordControls
          streamStatus={obs.state.streamStatus}
          recordStatus={obs.state.recordStatus}
          onStartStream={obs.startStreaming}
          onStopStream={obs.stopStreaming}
          onStartRecord={obs.startRecording}
          onStopRecord={obs.stopRecording}
          onPauseRecord={obs.pauseRecording}
          onResumeRecord={obs.resumeRecording}
        />
      </ControlSection>

      <ControlSection
        title="Replay buffer"
        icon="ri-history-line"
        badge={obs.state.replayBufferActive ? "Active" : undefined}
        badgeTone="primary"
      >
        <ObsReplayBuffer
          active={obs.state.replayBufferActive}
          onStart={obs.startReplayBuffer}
          onStop={obs.stopReplayBuffer}
          onSave={obs.saveReplayBuffer}
        />
      </ControlSection>

      <ControlSection title="Audio mixer" icon="ri-volume-up-line" defaultOpen={false}>
        <ObsAudioMixer
          audioInputs={obs.state.audioInputs}
          onMute={obs.setInputMute}
          onVolume={obs.setInputVolume}
        />
      </ControlSection>

      <ControlSection title="Screenshot" icon="ri-camera-line" defaultOpen={false}>
        <ObsScreenshot
          lastScreenshot={obs.state.lastScreenshot}
          currentScene={obs.state.currentScene}
          onTake={obs.takeScreenshot}
        />
      </ControlSection>

      <ControlSection title="Hotkeys" icon="ri-keyboard-line" defaultOpen={false}>
        <ObsHotkeyPanel
          onTrigger={obs.triggerHotkey}
          onGetList={obs.getHotkeyList}
          connected={obs.status === "connected"}
        />
      </ControlSection>
    </div>
  );
}
