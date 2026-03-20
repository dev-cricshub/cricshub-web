// ═══════════════════════════════════════════════════════════
// Streaming Integration Types — OBS & vMix
// ═══════════════════════════════════════════════════════════

export type StreamSoftware = "obs" | "vmix";
export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

// ── Connection Settings ──

export interface ObsConnectionSettings {
  host: string;
  port: number;
  password: string;
}

export interface VmixConnectionSettings {
  host: string;
  port: number;
}

export const DEFAULT_OBS_SETTINGS: ObsConnectionSettings = {
  host: "localhost",
  port: 4455,
  password: "",
};

export const DEFAULT_VMIX_SETTINGS: VmixConnectionSettings = {
  host: "localhost",
  port: 8088,
};

// ── OBS Domain ──

export interface ObsScene {
  sceneName: string;
  sceneIndex: number;
}

export interface ObsSceneItem {
  sceneItemId: number;
  sourceName: string;
  sceneItemEnabled: boolean;
  sceneItemIndex: number;
  inputKind: string | null;
}

export interface ObsAudioInput {
  inputName: string;
  inputKind: string;
  inputVolumeMul: number;
  inputVolumeDb: number;
  inputMuted: boolean;
}

export interface ObsStreamStatus {
  active: boolean;
  reconnecting: boolean;
  timecode: string;
  duration: number;
  bytesTotal: number;
}

export interface ObsRecordStatus {
  active: boolean;
  paused: boolean;
  timecode: string;
  duration: number;
  outputPath: string | null;
}

export interface ObsState {
  scenes: ObsScene[];
  currentScene: string;
  currentPreviewScene: string | null;
  sceneItems: ObsSceneItem[];
  audioInputs: ObsAudioInput[];
  streamStatus: ObsStreamStatus;
  recordStatus: ObsRecordStatus;
  replayBufferActive: boolean;
  lastScreenshot: string | null;
}

export const INITIAL_OBS_STATE: ObsState = {
  scenes: [],
  currentScene: "",
  currentPreviewScene: null,
  sceneItems: [],
  audioInputs: [],
  streamStatus: {
    active: false,
    reconnecting: false,
    timecode: "00:00:00",
    duration: 0,
    bytesTotal: 0,
  },
  recordStatus: {
    active: false,
    paused: false,
    timecode: "00:00:00",
    duration: 0,
    outputPath: null,
  },
  replayBufferActive: false,
  lastScreenshot: null,
};

// ── vMix Domain ──

export interface VmixInput {
  key: string;
  number: number;
  type: string;
  title: string;
  state: "Running" | "Paused" | "Completed" | "";
  position: number;
  duration: number;
  loop: boolean;
  muted: boolean;
  volume: number;
  audioBusses: string;
}

export interface VmixOverlayChannel {
  number: 1 | 2 | 3 | 4;
  inputNumber: number | null;
  active: boolean;
}

export type VmixTransitionType =
  | "Cut"
  | "Fade"
  | "Zoom"
  | "Wipe"
  | "Slide"
  | "Fly"
  | "CrossZoom"
  | "FlyRotate"
  | "Cube"
  | "CubeZoom"
  | "VerticalWipe"
  | "VerticalSlide"
  | "Merge"
  | "WipeReverse"
  | "SlideReverse"
  | "VerticalWipeReverse"
  | "VerticalSlideReverse"
  | "Stinger1"
  | "Stinger2";

export interface VmixReplayEvent {
  id: string;
  timestamp: number;
  label: string;
  speed: number;
}

export interface VmixReplayState {
  recording: boolean;
  live: boolean;
  channelMode: "A" | "B" | "AB";
  speed: number;
  events: VmixReplayEvent[];
  timecode: string;
}

export interface VmixState {
  version: string;
  edition: string;
  inputs: VmixInput[];
  activeInput: number | null;
  previewInput: number | null;
  overlays: VmixOverlayChannel[];
  streaming: boolean;
  recording: boolean;
  external: boolean;
  playListActive: boolean;
  fullscreen: boolean;
  fadeToBlack: boolean;
  replay: VmixReplayState;
  audio: {
    master: { volume: number; muted: boolean };
  };
}

export const INITIAL_VMIX_STATE: VmixState = {
  version: "",
  edition: "",
  inputs: [],
  activeInput: null,
  previewInput: null,
  overlays: [
    { number: 1, inputNumber: null, active: false },
    { number: 2, inputNumber: null, active: false },
    { number: 3, inputNumber: null, active: false },
    { number: 4, inputNumber: null, active: false },
  ],
  streaming: false,
  recording: false,
  external: false,
  playListActive: false,
  fullscreen: false,
  fadeToBlack: false,
  replay: {
    recording: false,
    live: false,
    channelMode: "A",
    speed: 1,
    events: [],
    timecode: "00:00:00",
  },
  audio: {
    master: { volume: 100, muted: false },
  },
};
