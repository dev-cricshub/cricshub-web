"use client";

import { useState, useEffect, useId } from "react";
import type {
  StreamSoftware,
  ObsConnectionSettings,
  VmixConnectionSettings,
  ConnectionStatus,
} from "@/lib/streaming/types";
import { DEFAULT_OBS_SETTINGS, DEFAULT_VMIX_SETTINGS } from "@/lib/streaming/types";
import { loadObsSettings, loadVmixSettings } from "@/lib/streaming/storage";
import { Alert, Button, Field, Input, cn } from "@/app/components/ui";
import type { BadgeTone } from "@/app/components/ui";
import { Hint } from "./StudioKit";

interface Props {
  software: StreamSoftware;
  status: ConnectionStatus;
  error: string | null;
  onConnectObs: (s: ObsConnectionSettings) => void;
  onConnectVmix: (s: VmixConnectionSettings) => void;
  onDisconnect: () => void;
}

const STATUS_META: Record<
  ConnectionStatus,
  { label: string; tone: BadgeTone; dot: string; tile: string; icon: string }
> = {
  connected: {
    label: "Connected",
    tone: "success",
    dot: "bg-success",
    tile: "bg-success-soft text-success-soft-fg",
    icon: "ri-link-m",
  },
  connecting: {
    label: "Connecting…",
    tone: "warning",
    dot: "bg-warning animate-pulse",
    tile: "bg-warning-soft text-warning-soft-fg",
    icon: "ri-loader-4-line animate-spin",
  },
  error: {
    label: "Error",
    tone: "danger",
    dot: "bg-danger",
    tile: "bg-danger-soft text-danger-soft-fg",
    icon: "ri-error-warning-line",
  },
  disconnected: {
    label: "Disconnected",
    tone: "neutral",
    dot: "bg-fg-subtle",
    tile: "bg-surface-2 text-fg-muted",
    icon: "ri-link-unlink-m",
  },
};

const STATUS_TEXT: Record<ConnectionStatus, string> = {
  connected: "text-success",
  connecting: "text-warning",
  error: "text-danger",
  disconnected: "text-fg-muted",
};

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
  const bodyId = useId();

  useEffect(() => {
    setObsSettings(loadObsSettings());
    setVmixSettings(loadVmixSettings());
  }, []);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const meta = STATUS_META[status] ?? STATUS_META.disconnected;
  const name = software === "obs" ? "OBS" : "vMix";

  const handleConnect = () => {
    if (software === "obs") onConnectObs(obsSettings);
    else onConnectVmix(vmixSettings);
  };

  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={bodyId}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "relative inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-base",
              meta.tile,
            )}
          >
            <i className="ri-broadcast-line" aria-hidden />
            <span
              className={cn("absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-surface", meta.dot)}
              aria-hidden
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight text-fg">
              {name} connection
            </span>
            <span className="block truncate text-xs text-fg-subtle">
              <span className={cn("font-medium", STATUS_TEXT[status] ?? "text-fg-muted")}>
                {isConnecting && <i className={cn(meta.icon, "mr-1")} aria-hidden />}
                {meta.label}
              </span>
              {" · "}
              {isConnected
                ? software === "obs"
                  ? `${obsSettings.host}:${obsSettings.port}`
                  : `${vmixSettings.host}:${vmixSettings.port}`
                : software === "obs"
                  ? "OBS WebSocket"
                  : "vMix Web Controller"}
            </span>
          </span>
        </span>
        <span className="flex flex-shrink-0 items-center gap-2">
          <i
            className={cn(
              "ri-arrow-down-s-line text-lg text-fg-subtle transition-transform duration-200 ease-out",
              expanded && "rotate-180",
            )}
            aria-hidden
          />
        </span>
      </button>

      {expanded && (
        <div id={bodyId} className="space-y-4 border-t border-line px-4 pb-4 pt-4 animate-fade-in">
          {error && (
            <Alert tone="danger" title="Connection failed">
              {error}
            </Alert>
          )}

          {software === "obs" ? (
            <>
              <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-3">
                <Field label="Host">
                  {({ id, describedBy }) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      type="text"
                      value={obsSettings.host}
                      onChange={(e) => setObsSettings((s) => ({ ...s, host: e.target.value }))}
                      disabled={isConnected}
                      placeholder="localhost"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  )}
                </Field>
                <Field label="Port">
                  {({ id, describedBy }) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      type="number"
                      inputMode="numeric"
                      value={obsSettings.port}
                      onChange={(e) =>
                        setObsSettings((s) => ({ ...s, port: parseInt(e.target.value) || 4455 }))
                      }
                      disabled={isConnected}
                      className="font-mono tabular-nums"
                    />
                  )}
                </Field>
              </div>
              <Field label="Password" optional>
                {({ id, describedBy }) => (
                  <Input
                    id={id}
                    aria-describedby={describedBy}
                    type="password"
                    value={obsSettings.password}
                    onChange={(e) => setObsSettings((s) => ({ ...s, password: e.target.value }))}
                    disabled={isConnected}
                    placeholder="OBS WebSocket password"
                    autoComplete="off"
                  />
                )}
              </Field>
            </>
          ) : (
            <>
              <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-3">
                <Field label="Host">
                  {({ id, describedBy }) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      type="text"
                      value={vmixSettings.host}
                      onChange={(e) => setVmixSettings((s) => ({ ...s, host: e.target.value }))}
                      disabled={isConnected}
                      placeholder="localhost"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  )}
                </Field>
                <Field label="Port">
                  {({ id, describedBy }) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      type="number"
                      inputMode="numeric"
                      value={vmixSettings.port}
                      onChange={(e) =>
                        setVmixSettings((s) => ({ ...s, port: parseInt(e.target.value) || 8088 }))
                      }
                      disabled={isConnected}
                      className="font-mono tabular-nums"
                    />
                  )}
                </Field>
              </div>
              <Hint>Enable the Web Controller in vMix: Settings → Web Controller.</Hint>
            </>
          )}

          {isConnected ? (
            <Button variant="outline" block icon="ri-link-unlink-m" onClick={onDisconnect}>
              Disconnect
            </Button>
          ) : (
            <Button
              variant="primary"
              block
              icon="ri-link-m"
              loading={isConnecting}
              onClick={handleConnect}
            >
              {isConnecting ? "Connecting…" : `Connect to ${name}`}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
