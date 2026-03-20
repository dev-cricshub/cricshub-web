"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ConnectionStatus,
  VmixConnectionSettings,
  VmixState,
  VmixReplayEvent,
} from "@/lib/streaming/types";
import { INITIAL_VMIX_STATE } from "@/lib/streaming/types";
import { VmixClient, parseVmixXml } from "@/lib/streaming/vmixClient";
import { loadVmixSettings, saveVmixSettings } from "@/lib/streaming/storage";

const POLL_INTERVAL = 1500;

export function useVmix() {
  const clientRef = useRef<VmixClient | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<VmixState>(INITIAL_VMIX_STATE);
  const [settings, setSettings] = useState<VmixConnectionSettings>(loadVmixSettings);
  const [replayEvents, setReplayEvents] = useState<VmixReplayEvent[]>([]);

  const client = useCallback(() => {
    return clientRef.current;
  }, []);

  // ── Polling ──

  const pollState = useCallback(async () => {
    const c = clientRef.current;
    if (!c) return;
    const xml = await c.fetchState();
    if (!xml) {
      setStatus("error");
      setError("Lost connection to vMix");
      return;
    }
    const parsed = parseVmixXml(xml);
    setState((prev) => ({
      ...prev,
      ...parsed,
      replay: {
        ...prev.replay,
        ...((parsed as any).replay ?? {}),
        events: replayEvents,
      },
    }));
  }, [replayEvents]);

  // ── Connect / Disconnect ──

  const connect = useCallback(
    async (s: VmixConnectionSettings) => {
      setStatus("connecting");
      setError(null);
      saveVmixSettings(s);
      setSettings(s);

      const c = new VmixClient(s);
      c.init();
      clientRef.current = c;

      // Test connection
      const xml = await c.fetchState();
      if (!xml) {
        setStatus("error");
        setError("Cannot reach vMix API. Is vMix running with Web Controller enabled?");
        c.destroy();
        clientRef.current = null;
        return;
      }

      const parsed = parseVmixXml(xml);
      setState((prev) => ({ ...prev, ...parsed }));
      setStatus("connected");

      // Start polling
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => pollState(), POLL_INTERVAL);
    },
    [pollState],
  );

  const disconnect = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    clientRef.current?.destroy();
    clientRef.current = null;
    setStatus("disconnected");
    setError(null);
    setState(INITIAL_VMIX_STATE);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clientRef.current?.destroy();
    };
  }, []);

  // ── Input switching ──

  const cutInput = useCallback(async (input: number) => {
    await clientRef.current?.cut(input);
  }, []);

  const previewInput = useCallback(async (input: number) => {
    await clientRef.current?.preview(input);
  }, []);

  const transitionTo = useCallback(
    async (type: string, input: number, duration = 1000) => {
      await clientRef.current?.transition(type, input, duration);
    },
    [],
  );

  const doFadeToBlack = useCallback(async () => {
    await clientRef.current?.fadeToBlack();
  }, []);

  // ── Overlay channels ──

  const overlayIn = useCallback(
    async (channel: 1 | 2 | 3 | 4, input: number) => {
      await clientRef.current?.overlayIn(channel, input);
    },
    [],
  );

  const overlayOut = useCallback(async (channel: 1 | 2 | 3 | 4) => {
    await clientRef.current?.overlayOut(channel);
  }, []);

  const overlayOff = useCallback(async (channel: 1 | 2 | 3 | 4) => {
    await clientRef.current?.overlayOff(channel);
  }, []);

  // ── Streaming & Recording ──

  const startStreaming = useCallback(async () => {
    await clientRef.current?.startStreaming();
  }, []);

  const stopStreaming = useCallback(async () => {
    await clientRef.current?.stopStreaming();
  }, []);

  const startRecording = useCallback(async () => {
    await clientRef.current?.startRecording();
  }, []);

  const stopRecording = useCallback(async () => {
    await clientRef.current?.stopRecording();
  }, []);

  const startExternal = useCallback(async () => {
    await clientRef.current?.startExternal();
  }, []);

  const stopExternal = useCallback(async () => {
    await clientRef.current?.stopExternal();
  }, []);

  // ── Replay ──

  const replayPlay = useCallback(async () => {
    await clientRef.current?.replayPlay();
  }, []);

  const replayPause = useCallback(async () => {
    await clientRef.current?.replayPause();
  }, []);

  const replayMarkIn = useCallback(async () => {
    await clientRef.current?.replayMarkIn();
  }, []);

  const replayMarkOut = useCallback(async () => {
    await clientRef.current?.replayMarkOut();
  }, []);

  const replayChangeSpeed = useCallback(async (speed: number) => {
    await clientRef.current?.replayChangeSpeed(speed);
    setState((prev) => ({
      ...prev,
      replay: { ...prev.replay, speed },
    }));
  }, []);

  const replayLive = useCallback(async () => {
    await clientRef.current?.replayLive();
  }, []);

  const replaySelectChannelA = useCallback(async () => {
    await clientRef.current?.replaySelectChannelA();
    setState((prev) => ({
      ...prev,
      replay: { ...prev.replay, channelMode: "A" },
    }));
  }, []);

  const replaySelectChannelB = useCallback(async () => {
    await clientRef.current?.replaySelectChannelB();
    setState((prev) => ({
      ...prev,
      replay: { ...prev.replay, channelMode: "B" },
    }));
  }, []);

  const replayStartRecording = useCallback(async () => {
    await clientRef.current?.replayStartRecording();
    setState((prev) => ({
      ...prev,
      replay: { ...prev.replay, recording: true },
    }));
  }, []);

  const replayStopRecording = useCallback(async () => {
    await clientRef.current?.replayStopRecording();
    setState((prev) => ({
      ...prev,
      replay: { ...prev.replay, recording: false },
    }));
  }, []);

  const markReplayEvent = useCallback(
    async (label: string) => {
      await clientRef.current?.replayMarkIn();
      const event: VmixReplayEvent = {
        id: `${Date.now()}`,
        timestamp: Date.now(),
        label,
        speed: state.replay.speed,
      };
      setReplayEvents((prev) => [...prev, event]);
    },
    [state.replay.speed],
  );

  // ── Audio ──

  const setVolume = useCallback(async (input: number | string, volume: number) => {
    await clientRef.current?.setVolume(input, volume);
  }, []);

  const setMute = useCallback(async (input: number | string, muted: boolean) => {
    await clientRef.current?.setMute(input, muted);
  }, []);

  const setMasterVolume = useCallback(async (volume: number) => {
    await clientRef.current?.setMasterVolume(volume);
  }, []);

  // ── Titling ──

  const setTitle = useCallback(
    async (input: number, index: number, value: string) => {
      await clientRef.current?.setTitle(input, index, value);
    },
    [],
  );

  // ── PTZ ──

  const ptzMove = useCallback(
    async (input: number, direction: string, speed = 1) => {
      await clientRef.current?.ptzMove(input, direction, speed);
    },
    [],
  );

  const ptzHome = useCallback(async (input: number) => {
    await clientRef.current?.ptzHome(input);
  }, []);

  const ptzZoomIn = useCallback(async (input: number, speed = 1) => {
    await clientRef.current?.ptzZoomIn(input, speed);
  }, []);

  const ptzZoomOut = useCallback(async (input: number, speed = 1) => {
    await clientRef.current?.ptzZoomOut(input, speed);
  }, []);

  return {
    status,
    error,
    state,
    settings,
    replayEvents,
    connect,
    disconnect,
    // Input switching
    cutInput,
    previewInput,
    transitionTo,
    doFadeToBlack,
    // Overlays
    overlayIn,
    overlayOut,
    overlayOff,
    // Stream / Record
    startStreaming,
    stopStreaming,
    startRecording,
    stopRecording,
    startExternal,
    stopExternal,
    // Replay
    replayPlay,
    replayPause,
    replayMarkIn,
    replayMarkOut,
    replayChangeSpeed,
    replayLive,
    replaySelectChannelA,
    replaySelectChannelB,
    replayStartRecording,
    replayStopRecording,
    markReplayEvent,
    // Audio
    setVolume,
    setMute,
    setMasterVolume,
    // Titling
    setTitle,
    // PTZ
    ptzMove,
    ptzHome,
    ptzZoomIn,
    ptzZoomOut,
  };
}
