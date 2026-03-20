"use client";

import { useState, useEffect } from "react";
import type {
  StreamSoftware,
  ObsConnectionSettings,
  VmixConnectionSettings,
  ConnectionStatus,
} from "@/lib/streaming/types";
import { DEFAULT_OBS_SETTINGS, DEFAULT_VMIX_SETTINGS } from "@/lib/streaming/types";
import { loadObsSettings, loadVmixSettings } from "@/lib/streaming/storage";

interface Props {
  software: StreamSoftware;
  status: ConnectionStatus;
  error: string | null;
  onConnectObs: (s: ObsConnectionSettings) => void;
  onConnectVmix: (s: VmixConnectionSettings) => void;
  onDisconnect: () => void;
}

export default function ConnectionSettingsPanel({
  software,
  status,
  error,
  onConnectObs,
  onConnectVmix,
  onDisconnect,
}: Props) {
  const [obsSettings, setObsSettings] = useState<ObsConnectionSettings>(DEFAULT_OBS_SETTINGS);
  const [vmixSettings, setVmixSettings] = useState<VmixConnectionSettings>(DEFAULT_VMIX_SETTINGS);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setObsSettings(loadObsSettings());
    setVmixSettings(loadVmixSettings());
  }, []);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  const handleConnect = () => {
    if (software === "obs") onConnectObs(obsSettings);
    else onConnectVmix(vmixSettings);
  };

  const statusColor =
    status === "connected"
      ? "bg-green-500"
      : status === "connecting"
        ? "bg-yellow-500 animate-pulse"
        : status === "error"
          ? "bg-red-500"
          : "bg-gray-300";

  const statusText =
    status === "connected"
      ? "Connected"
      : status === "connecting"
        ? "Connecting..."
        : status === "error"
          ? "Error"
          : "Disconnected";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${statusColor} flex-shrink-0`} />
          <div className="text-left">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {software === "obs" ? "OBS" : "vMix"} Connection
            </p>
            <p className="text-[10px] text-gray-400">{statusText}</p>
          </div>
        </div>
        <i className={`ri-arrow-${expanded ? "up" : "down"}-s-line text-gray-400`} />
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          {software === "obs" ? (
            <>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase">Host</label>
                <input
                  type="text"
                  value={obsSettings.host}
                  onChange={(e) => setObsSettings((s) => ({ ...s, host: e.target.value }))}
                  disabled={isConnected}
                  className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 disabled:opacity-50"
                  placeholder="localhost"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase">Port</label>
                <input
                  type="number"
                  value={obsSettings.port}
                  onChange={(e) => setObsSettings((s) => ({ ...s, port: parseInt(e.target.value) || 4455 }))}
                  disabled={isConnected}
                  className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase">
                  Password
                </label>
                <input
                  type="password"
                  value={obsSettings.password}
                  onChange={(e) => setObsSettings((s) => ({ ...s, password: e.target.value }))}
                  disabled={isConnected}
                  className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 disabled:opacity-50"
                  placeholder="OBS WebSocket password"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase">Host</label>
                <input
                  type="text"
                  value={vmixSettings.host}
                  onChange={(e) => setVmixSettings((s) => ({ ...s, host: e.target.value }))}
                  disabled={isConnected}
                  className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 disabled:opacity-50"
                  placeholder="localhost"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase">
                  Web Controller Port
                </label>
                <input
                  type="number"
                  value={vmixSettings.port}
                  onChange={(e) => setVmixSettings((s) => ({ ...s, port: parseInt(e.target.value) || 8088 }))}
                  disabled={isConnected}
                  className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 disabled:opacity-50"
                />
              </div>
              <p className="text-[10px] text-gray-400">
                Enable Web Controller in vMix Settings → Web Controller
              </p>
            </>
          )}

          {isConnected ? (
            <button
              onClick={onDisconnect}
              className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-all border border-gray-200"
            >
              <i className="ri-link-unlink-m mr-1" />
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full py-2.5 rounded-xl bg-[#34B8FF]/10 text-[#1E88E5] text-xs font-bold hover:bg-[#34B8FF]/20 transition-all border border-[#34B8FF]/20 disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-1" />
                  Connecting...
                </>
              ) : (
                <>
                  <i className="ri-link-m mr-1" />
                  Connect to {software === "obs" ? "OBS" : "vMix"}
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
