import {
  ObsConnectionSettings,
  VmixConnectionSettings,
  DEFAULT_OBS_SETTINGS,
  DEFAULT_VMIX_SETTINGS,
} from "./types";

const OBS_KEY = "cricshub_obs_settings";
const VMIX_KEY = "cricshub_vmix_settings";
const OBS_HOTKEYS_KEY = "cricshub_obs_hotkeys";

// ── OBS ──

export function loadObsSettings(): ObsConnectionSettings {
  try {
    const raw = localStorage.getItem(OBS_KEY);
    if (raw) return { ...DEFAULT_OBS_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_OBS_SETTINGS };
}

export function saveObsSettings(s: ObsConnectionSettings) {
  localStorage.setItem(OBS_KEY, JSON.stringify(s));
}

// ── vMix ──

export function loadVmixSettings(): VmixConnectionSettings {
  try {
    const raw = localStorage.getItem(VMIX_KEY);
    if (raw) return { ...DEFAULT_VMIX_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_VMIX_SETTINGS };
}

export function saveVmixSettings(s: VmixConnectionSettings) {
  localStorage.setItem(VMIX_KEY, JSON.stringify(s));
}

// ── OBS Hotkeys ──

export interface HotkeyMapping {
  label: string;
  obsHotkeyName: string;
}

export function loadObsHotkeys(): HotkeyMapping[] {
  try {
    const raw = localStorage.getItem(OBS_HOTKEYS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveObsHotkeys(h: HotkeyMapping[]) {
  localStorage.setItem(OBS_HOTKEYS_KEY, JSON.stringify(h));
}
