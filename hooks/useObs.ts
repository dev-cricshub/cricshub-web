"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import OBSWebSocket from "obs-websocket-js";
import type {
  ConnectionStatus,
  ObsConnectionSettings,
  ObsState,
  ObsScene,
  ObsSceneItem,
  ObsAudioInput,
} from "@/lib/streaming/types";
import { INITIAL_OBS_STATE } from "@/lib/streaming/types";
import { loadObsSettings, saveObsSettings } from "@/lib/streaming/storage";

export function useObs() {
  const obsRef = useRef<OBSWebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<ObsState>(INITIAL_OBS_STATE);
  const [settings, setSettings] = useState<ObsConnectionSettings>(loadObsSettings);

  const obs = useCallback(() => {
    if (!obsRef.current) obsRef.current = new OBSWebSocket();
    return obsRef.current;
  }, []);

  // ── Refresh helpers ──

  const refreshScenes = useCallback(async () => {
    try {
      const { scenes, currentProgramSceneName, currentPreviewSceneName } =
        await obs().call("GetSceneList");
      const parsed: ObsScene[] = (scenes as any[]).map((s, i) => ({
        sceneName: s.sceneName,
        sceneIndex: s.sceneIndex ?? i,
      }));
      setState((prev) => ({
        ...prev,
        scenes: parsed.reverse(),
        currentScene: currentProgramSceneName,
        currentPreviewScene: currentPreviewSceneName ?? null,
      }));
    } catch {}
  }, [obs]);

  const refreshSceneItems = useCallback(async () => {
    try {
      const current = state.currentScene;
      if (!current) return;
      const { sceneItems } = await obs().call("GetSceneItemList", {
        sceneName: current,
      });
      const parsed: ObsSceneItem[] = (sceneItems as any[]).map((s) => ({
        sceneItemId: s.sceneItemId,
        sourceName: s.sourceName,
        sceneItemEnabled: s.sceneItemEnabled,
        sceneItemIndex: s.sceneItemIndex,
        inputKind: s.inputKind ?? null,
      }));
      setState((prev) => ({ ...prev, sceneItems: parsed }));
    } catch {}
  }, [obs, state.currentScene]);

  const refreshAudio = useCallback(async () => {
    try {
      const { inputs } = await obs().call("GetInputList");
      const audioInputs: ObsAudioInput[] = [];
      for (const inp of inputs as any[]) {
        try {
          const vol = await obs().call("GetInputVolume", { inputName: inp.inputName });
          const mute = await obs().call("GetInputMute", { inputName: inp.inputName });
          audioInputs.push({
            inputName: inp.inputName,
            inputKind: inp.inputKind,
            inputVolumeMul: (vol as any).inputVolumeMul,
            inputVolumeDb: (vol as any).inputVolumeDb,
            inputMuted: (mute as any).inputMuted,
          });
        } catch {
          // Not an audio source
        }
      }
      setState((prev) => ({ ...prev, audioInputs }));
    } catch {}
  }, [obs]);

  const refreshStreamStatus = useCallback(async () => {
    try {
      const s = await obs().call("GetStreamStatus");
      setState((prev) => ({
        ...prev,
        streamStatus: {
          active: (s as any).outputActive,
          reconnecting: (s as any).outputReconnecting ?? false,
          timecode: (s as any).outputTimecode ?? "00:00:00",
          duration: (s as any).outputDuration ?? 0,
          bytesTotal: (s as any).outputBytes ?? 0,
        },
      }));
    } catch {}
  }, [obs]);

  const refreshRecordStatus = useCallback(async () => {
    try {
      const r = await obs().call("GetRecordStatus");
      setState((prev) => ({
        ...prev,
        recordStatus: {
          active: (r as any).outputActive,
          paused: (r as any).outputPaused ?? false,
          timecode: (r as any).outputTimecode ?? "00:00:00",
          duration: (r as any).outputDuration ?? 0,
          outputPath: (r as any).outputPath ?? null,
        },
      }));
    } catch {}
  }, [obs]);

  const refreshReplayBuffer = useCallback(async () => {
    try {
      const r = await obs().call("GetReplayBufferStatus");
      setState((prev) => ({
        ...prev,
        replayBufferActive: (r as any).outputActive,
      }));
    } catch {
      setState((prev) => ({ ...prev, replayBufferActive: false }));
    }
  }, [obs]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshScenes(),
      refreshAudio(),
      refreshStreamStatus(),
      refreshRecordStatus(),
      refreshReplayBuffer(),
    ]);
  }, [refreshScenes, refreshAudio, refreshStreamStatus, refreshRecordStatus, refreshReplayBuffer]);

  // ── Connect / Disconnect ──

  const connect = useCallback(
    async (s: ObsConnectionSettings) => {
      setStatus("connecting");
      setError(null);
      saveObsSettings(s);
      setSettings(s);
      try {
        const url = `ws://${s.host}:${s.port}`;
        await obs().connect(url, s.password || undefined);
        setStatus("connected");
        await refreshAll();
      } catch (e: any) {
        setStatus("error");
        setError(e?.message || "Failed to connect to OBS");
      }
    },
    [obs, refreshAll],
  );

  const disconnect = useCallback(async () => {
    try {
      await obs().disconnect();
    } catch {}
    setStatus("disconnected");
    setError(null);
    setState(INITIAL_OBS_STATE);
  }, [obs]);

  // ── Event listeners ──

  useEffect(() => {
    const o = obs();

    const onSceneChanged = () => {
      refreshScenes();
      setTimeout(refreshSceneItems, 200);
    };
    const onSceneItemChanged = () => refreshSceneItems();
    const onStreamChanged = () => refreshStreamStatus();
    const onRecordChanged = () => refreshRecordStatus();
    const onReplayChanged = () => refreshReplayBuffer();
    const onInputVolumeChanged = () => refreshAudio();
    const onInputMuteChanged = () => refreshAudio();
    const onDisconnect = () => {
      setStatus("disconnected");
      setState(INITIAL_OBS_STATE);
    };

    o.on("CurrentProgramSceneChanged" as any, onSceneChanged);
    o.on("CurrentPreviewSceneChanged" as any, onSceneChanged);
    o.on("SceneItemEnableStateChanged" as any, onSceneItemChanged);
    o.on("SceneItemListReindexed" as any, onSceneItemChanged);
    o.on("StreamStateChanged" as any, onStreamChanged);
    o.on("RecordStateChanged" as any, onRecordChanged);
    o.on("ReplayBufferStateChanged" as any, onReplayChanged);
    o.on("InputVolumeChanged" as any, onInputVolumeChanged);
    o.on("InputMuteStateChanged" as any, onInputMuteChanged);
    o.on("ConnectionClosed" as any, onDisconnect);

    return () => {
      o.off("CurrentProgramSceneChanged" as any, onSceneChanged);
      o.off("CurrentPreviewSceneChanged" as any, onSceneChanged);
      o.off("SceneItemEnableStateChanged" as any, onSceneItemChanged);
      o.off("SceneItemListReindexed" as any, onSceneItemChanged);
      o.off("StreamStateChanged" as any, onStreamChanged);
      o.off("RecordStateChanged" as any, onRecordChanged);
      o.off("ReplayBufferStateChanged" as any, onReplayChanged);
      o.off("InputVolumeChanged" as any, onInputVolumeChanged);
      o.off("InputMuteStateChanged" as any, onInputMuteChanged);
      o.off("ConnectionClosed" as any, onDisconnect);
    };
  }, [obs, refreshScenes, refreshSceneItems, refreshStreamStatus, refreshRecordStatus, refreshReplayBuffer, refreshAudio]);

  // Refresh scene items when current scene changes
  useEffect(() => {
    if (status === "connected" && state.currentScene) {
      refreshSceneItems();
    }
  }, [status, state.currentScene, refreshSceneItems]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { obsRef.current?.disconnect(); } catch {}
    };
  }, []);

  // ── Commands ──

  const switchScene = useCallback(
    async (sceneName: string) => {
      await obs().call("SetCurrentProgramScene", { sceneName });
    },
    [obs],
  );

  const setSourceVisible = useCallback(
    async (sceneItemId: number, visible: boolean) => {
      await obs().call("SetSceneItemEnabled", {
        sceneName: state.currentScene,
        sceneItemId,
        sceneItemEnabled: visible,
      });
    },
    [obs, state.currentScene],
  );

  const startStreaming = useCallback(async () => {
    await obs().call("StartStream");
  }, [obs]);

  const stopStreaming = useCallback(async () => {
    await obs().call("StopStream");
  }, [obs]);

  const startRecording = useCallback(async () => {
    await obs().call("StartRecord");
  }, [obs]);

  const stopRecording = useCallback(async () => {
    await obs().call("StopRecord");
  }, [obs]);

  const pauseRecording = useCallback(async () => {
    await obs().call("PauseRecord");
  }, [obs]);

  const resumeRecording = useCallback(async () => {
    await obs().call("ResumeRecord");
  }, [obs]);

  const startReplayBuffer = useCallback(async () => {
    await obs().call("StartReplayBuffer");
  }, [obs]);

  const stopReplayBuffer = useCallback(async () => {
    await obs().call("StopReplayBuffer");
  }, [obs]);

  const saveReplayBuffer = useCallback(async () => {
    await obs().call("SaveReplayBuffer");
  }, [obs]);

  const setInputMute = useCallback(
    async (inputName: string, muted: boolean) => {
      await obs().call("SetInputMute", { inputName, inputMuted: muted });
    },
    [obs],
  );

  const setInputVolume = useCallback(
    async (inputName: string, volumeDb: number) => {
      await obs().call("SetInputVolume", { inputName, inputVolumeDb: volumeDb });
    },
    [obs],
  );

  const takeScreenshot = useCallback(
    async (sourceName: string) => {
      const result = await obs().call("GetSourceScreenshot", {
        sourceName,
        imageFormat: "png",
        imageWidth: 320,
        imageHeight: 180,
      });
      const img = (result as any).imageData;
      setState((prev) => ({ ...prev, lastScreenshot: img }));
      return img;
    },
    [obs],
  );

  const triggerHotkey = useCallback(
    async (hotkeyName: string) => {
      await obs().call("TriggerHotkeyByName", { hotkeyName });
    },
    [obs],
  );

  const getHotkeyList = useCallback(async () => {
    const result = await obs().call("GetHotkeyList");
    return (result as any).hotkeys as string[];
  }, [obs]);

  return {
    status,
    error,
    state,
    settings,
    connect,
    disconnect,
    refreshAll,
    switchScene,
    setSourceVisible,
    startStreaming,
    stopStreaming,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    startReplayBuffer,
    stopReplayBuffer,
    saveReplayBuffer,
    setInputMute,
    setInputVolume,
    takeScreenshot,
    triggerHotkey,
    getHotkeyList,
  };
}
