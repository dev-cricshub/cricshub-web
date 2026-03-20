import type {
  VmixConnectionSettings,
  VmixState,
  VmixInput,
  VmixOverlayChannel,
  INITIAL_VMIX_STATE,
} from "./types";

// ═══════════════════════════════════════════════════════════
// vMix HTTP API Client
// All calls are GET requests to http://{host}:{port}/api/
// ═══════════════════════════════════════════════════════════

export class VmixClient {
  private baseUrl: string;
  private abortController: AbortController | null = null;

  constructor(settings: VmixConnectionSettings) {
    this.baseUrl = `http://${settings.host}:${settings.port}`;
  }

  private get signal() {
    return this.abortController?.signal;
  }

  // ── Lifecycle ──

  init() {
    this.abortController = new AbortController();
  }

  destroy() {
    this.abortController?.abort();
    this.abortController = null;
  }

  // ── API call helper ──

  async call(fn: string, params: Record<string, string | number> = {}): Promise<boolean> {
    const url = new URL(`${this.baseUrl}/api/`);
    url.searchParams.set("Function", fn);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
    try {
      const res = await fetch(url.toString(), { signal: this.signal });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ── Fetch full XML state ──

  async fetchState(): Promise<string | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/`, { signal: this.signal });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }

  // ── Input switching ──

  cut(input: number) {
    return this.call("Cut", { Input: input });
  }

  preview(input: number) {
    return this.call("PreviewInput", { Input: input });
  }

  transition(type: string, input: number, duration = 1000) {
    return this.call(type, { Input: input, Duration: duration });
  }

  fadeToBlack() {
    return this.call("FadeToBlack");
  }

  // ── Overlay channels ──

  overlayIn(channel: 1 | 2 | 3 | 4, input: number) {
    return this.call(`OverlayInput${channel}In`, { Input: input });
  }

  overlayOut(channel: 1 | 2 | 3 | 4) {
    return this.call(`OverlayInput${channel}Out`);
  }

  overlayOff(channel: 1 | 2 | 3 | 4) {
    return this.call(`OverlayInput${channel}Off`);
  }

  // ── Streaming & Recording ──

  startStreaming() {
    return this.call("StartStreaming");
  }

  stopStreaming() {
    return this.call("StopStreaming");
  }

  startRecording() {
    return this.call("StartRecording");
  }

  stopRecording() {
    return this.call("StopRecording");
  }

  startExternal() {
    return this.call("StartExternal");
  }

  stopExternal() {
    return this.call("StopExternal");
  }

  // ── Replay ──

  replayPlay() {
    return this.call("ReplayPlay");
  }

  replayPause() {
    return this.call("ReplayPause");
  }

  replayToggle() {
    return this.call("Replay");
  }

  replayMarkIn() {
    return this.call("ReplayMarkIn");
  }

  replayMarkOut() {
    return this.call("ReplayMarkOut");
  }

  replayChangeSpeed(speed: number) {
    return this.call("ReplayChangeSpeed", { Value: speed });
  }

  replayMoveToLastEvent() {
    return this.call("ReplayJumpToNow");
  }

  replayLive() {
    return this.call("ReplayLive");
  }

  replaySelectChannelA() {
    return this.call("ReplayACamera1");
  }

  replaySelectChannelB() {
    return this.call("ReplayBCamera1");
  }

  replayChangeDirection() {
    return this.call("ReplayChangeDirection");
  }

  replayStartRecording() {
    return this.call("ReplayStartRecording");
  }

  replayStopRecording() {
    return this.call("ReplayStopRecording");
  }

  replayStartStopRecording() {
    return this.call("ReplayStartStopRecording");
  }

  // ── Audio ──

  setVolume(input: number | string, volume: number) {
    return this.call("SetVolume", { Input: input, Value: Math.round(volume) });
  }

  setMute(input: number | string, muted: boolean) {
    return this.call(muted ? "AudioOff" : "AudioOn", { Input: input });
  }

  setMasterVolume(volume: number) {
    return this.call("SetMasterVolume", { Value: Math.round(volume) });
  }

  // ── Titling ──

  setTitle(input: number, index: number, value: string) {
    return this.call("SetText", {
      Input: input,
      SelectedIndex: index,
      Value: value,
    });
  }

  // ── PTZ Camera Control ──

  ptzMove(input: number, direction: string, speed = 1) {
    return this.call(`PTZ${direction}`, { Input: input, Value: speed });
  }

  ptzHome(input: number) {
    return this.call("PTZHome", { Input: input });
  }

  ptzZoomIn(input: number, speed = 1) {
    return this.call("PTZZoomIn", { Input: input, Value: speed });
  }

  ptzZoomOut(input: number, speed = 1) {
    return this.call("PTZZoomOut", { Input: input, Value: speed });
  }

  // ── NDI ──

  startNdi(input: number) {
    return this.call("NDISelectSourceByIndex", { Input: input });
  }

  // ── Virtual Sets ──

  setVirtualSet(input: number, zoomLevel: number) {
    return this.call("SetZoom", { Input: input, Value: zoomLevel });
  }

  setVirtualSetPosition(input: number, x: number, y: number) {
    return this.call("SetPanX", { Input: input, Value: x });
  }
}

// ═══════════════════════════════════════════════════════════
// XML State Parser
// ═══════════════════════════════════════════════════════════

export function parseVmixXml(xml: string): Partial<VmixState> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  const vmix = doc.querySelector("vmix");
  if (!vmix) return {};

  const getText = (tag: string) => vmix.querySelector(tag)?.textContent ?? "";
  const getBool = (tag: string) => getText(tag).toLowerCase() === "true";

  // Inputs
  const inputEls = vmix.querySelectorAll("inputs > input");
  const inputs: VmixInput[] = Array.from(inputEls).map((el) => ({
    key: el.getAttribute("key") ?? "",
    number: parseInt(el.getAttribute("number") ?? "0"),
    type: el.getAttribute("type") ?? "",
    title: el.getAttribute("title") ?? "",
    state: (el.getAttribute("state") ?? "") as VmixInput["state"],
    position: parseInt(el.getAttribute("position") ?? "0"),
    duration: parseInt(el.getAttribute("duration") ?? "0"),
    loop: el.getAttribute("loop") === "True",
    muted: el.getAttribute("muted") === "True",
    volume: parseInt(el.getAttribute("volume") ?? "100"),
    audioBusses: el.getAttribute("audiobusses") ?? "",
  }));

  // Overlays
  const overlayEls = vmix.querySelectorAll("overlays > overlay");
  const overlays: VmixOverlayChannel[] = Array.from(overlayEls).map((el, i) => ({
    number: (i + 1) as 1 | 2 | 3 | 4,
    inputNumber: el.textContent ? parseInt(el.textContent) : null,
    active: !!el.textContent,
  }));
  // Pad to 4 channels
  while (overlays.length < 4) {
    overlays.push({ number: (overlays.length + 1) as 1 | 2 | 3 | 4, inputNumber: null, active: false });
  }

  const activeInput = parseInt(getText("active")) || null;
  const previewInput = parseInt(getText("preview")) || null;

  return {
    version: getText("version"),
    edition: getText("edition"),
    inputs,
    activeInput,
    previewInput,
    overlays: overlays.slice(0, 4) as [VmixOverlayChannel, VmixOverlayChannel, VmixOverlayChannel, VmixOverlayChannel],
    streaming: getBool("streaming"),
    recording: getBool("recording"),
    external: getBool("external"),
    playListActive: getBool("playList"),
    fullscreen: getBool("fullscreen"),
    fadeToBlack: getBool("fadeToBlack"),
  };
}
