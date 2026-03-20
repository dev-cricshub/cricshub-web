"use client";

import { useState } from "react";
import type { useObs } from "@/hooks/useObs";
import ObsSceneSwitcher from "./ObsSceneSwitcher";
import ObsSourceToggle from "./ObsSourceToggle";
import ObsStreamRecordControls from "./ObsStreamRecordControls";
import ObsReplayBuffer from "./ObsReplayBuffer";
import ObsAudioMixer from "./ObsAudioMixer";
import ObsScreenshot from "./ObsScreenshot";
import ObsHotkeyPanel from "./ObsHotkeyPanel";

type ObsHook = ReturnType<typeof useObs>;

interface Props {
  obs: ObsHook;
}

interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3.5 flex items-center justify-between"
      >
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          <i className={`${icon} mr-1`} />
          {title}
        </p>
        <i className={`ri-arrow-${open ? "up" : "down"}-s-line text-gray-400`} />
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

export default function ObsControlPanel({ obs }: Props) {
  if (obs.status !== "connected") return null;

  return (
    <div className="space-y-4">
      <CollapsibleSection title="Scene Control" icon="ri-layout-grid-line">
        <ObsSceneSwitcher
          scenes={obs.state.scenes}
          currentScene={obs.state.currentScene}
          onSwitch={obs.switchScene}
        />
        <ObsSourceToggle
          items={obs.state.sceneItems}
          onToggle={obs.setSourceVisible}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Stream & Record" icon="ri-live-line">
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
      </CollapsibleSection>

      <CollapsibleSection title="Replay Buffer" icon="ri-replay-line">
        <ObsReplayBuffer
          active={obs.state.replayBufferActive}
          onStart={obs.startReplayBuffer}
          onStop={obs.stopReplayBuffer}
          onSave={obs.saveReplayBuffer}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Audio Mixer" icon="ri-volume-up-line" defaultOpen={false}>
        <ObsAudioMixer
          audioInputs={obs.state.audioInputs}
          onMute={obs.setInputMute}
          onVolume={obs.setInputVolume}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Screenshot" icon="ri-camera-line" defaultOpen={false}>
        <ObsScreenshot
          lastScreenshot={obs.state.lastScreenshot}
          currentScene={obs.state.currentScene}
          onTake={obs.takeScreenshot}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Hotkeys" icon="ri-keyboard-line" defaultOpen={false}>
        <ObsHotkeyPanel
          onTrigger={obs.triggerHotkey}
          onGetList={obs.getHotkeyList}
          connected={obs.status === "connected"}
        />
      </CollapsibleSection>
    </div>
  );
}
