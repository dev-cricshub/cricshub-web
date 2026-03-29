"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ThemeConfig,
  BundleId,
  MasterColors,
  BallColors,
  DEFAULT_MASTER_COLORS,
  DEFAULT_BALL_COLORS,
  buildConfigFromSimplified,
} from "@/lib/themeConfig";

// ═══════════════════════════════════════════════════════════
// THEME CONFIG PANEL — Fixed for 300-340px sidebar
// ═══════════════════════════════════════════════════════════

interface Props {
  config: ThemeConfig;
  onChange: (config: ThemeConfig) => void;
}

// ── Helpers ──────────────────────────────────────────────────

function getLightness(hex: string): number {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 50;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return Math.sqrt(0.299 * r ** 2 + 0.587 * g ** 2 + 0.114 * b ** 2) / 2.55;
}

function getContrastText(bg: string): string {
  return getLightness(bg) > 55 ? "#111827" : "#FFFFFF";
}

function toHex(value: string): string {
  const t = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(t)) return t;
  const m = t.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) {
    const h = (n: string) => parseInt(n).toString(16).padStart(2, "0");
    return `#${h(m[1])}${h(m[2])}${h(m[3])}`;
  }
  return "#808080";
}

// ── Bundle metadata ─────────────────────────────────────────

const BUNDLE_LABELS: Record<BundleId, string> = {
  basic: "Basic",
  glass: "Glass",
  material: "Material",
  aero: "Aero",
};

const BUNDLE_DESCRIPTIONS: Record<BundleId, string> = {
  basic: "Dark premium · gold accents",
  glass: "Holographic neon glassmorphism",
  material: "Clean flat Material Design",
  aero: "Light airy minimalism",
};

// ── Field definitions ───────────────────────────────────────

const MASTER_FIELDS: {
  key: keyof MasterColors;
  label: string;
  desc: string;
}[] = [
  {
    key: "team1",
    label: "Team 1",
    desc: "Team 1 badges, headers & score highlights",
  },
  {
    key: "team2",
    label: "Team 2",
    desc: "Team 2 badges, headers & score highlights",
  },
  {
    key: "accent",
    label: "Accent",
    desc: "Key stats, borders & important highlights",
  },
  {
    key: "alert",
    label: "Alert",
    desc: "Wickets, warnings & critical moments",
  },
  { key: "bg", label: "Background", desc: "Main overlay panels and cards" },
  { key: "text", label: "Text", desc: "Primary text, numbers and labels" },
];

const BALL_FIELDS: {
  key: keyof BallColors;
  label: string;
  short: string;
  desc: string;
}[] = [
  {
    key: "wicket",
    label: "Wicket",
    short: "W",
    desc: "Shown when a wicket falls",
  },
  { key: "six", label: "Six", short: "6", desc: "Shown for a maximum" },
  { key: "four", label: "Four", short: "4", desc: "Shown for a boundary" },
  { key: "wide", label: "Wide/No-ball", short: "Wd", desc: "Shown for extras" },
];

// ── Tooltip ─────────────────────────────────────────────────

function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "5px 9px",
            background: "rgba(0,0,0,0.96)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6,
            color: "#FFF",
            fontSize: 10,
            lineHeight: "15px",
            whiteSpace: "nowrap",
            zIndex: 200,
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}
        >
          {text}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              borderWidth: 4,
              borderStyle: "solid",
              borderColor:
                "rgba(0,0,0,0.96) transparent transparent transparent",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Section header ──────────────────────────────────────────

function SectionLabel({
  children,
  badge,
}: {
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
        paddingBottom: 6,
        borderBottom: "1px solid rgba(217,119,6,0.18)",
      }}
    >
      <span
        style={{
          color: "#D97706",
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 2.2,
          textTransform: "uppercase",
          flex: 1,
        }}
      >
        {children}
      </span>
      {badge}
    </div>
  );
}

// ── Color row — compact single-line layout ──────────────────
// Layout: [label 90px] [swatch 22px] [hex input 76px] [reset 16px]
// Total: ~220px — safe at 280px+ after padding

function ColorRow({
  label,
  desc,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  desc: string;
  value: string;
  defaultValue: string;
  onChange: (v: string) => void;
}) {
  const [localHex, setLocalHex] = useState(value);
  const modified = value !== defaultValue;
  const hex = toHex(value);

  // Keep local in sync when value changes externally (bundle switch)
  if (localHex !== value && document.activeElement?.id !== `hex-${label}`) {
    setLocalHex(value);
  }

  const commit = (raw: string) => {
    const h = toHex(raw);
    if (/^#[0-9a-f]{6}$/i.test(h)) onChange(h);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {/* Label */}
      <Tip text={desc}>
        <span
          style={{
            color: modified ? "#F3F4F6" : "rgba(255,255,255,0.6)",
            fontSize: 12,
            fontWeight: modified ? 600 : 400,
            width: 82,
            flexShrink: 0,
            cursor: "help",
            borderBottom: "1px dotted rgba(255,255,255,0.25)",
            lineHeight: "16px",
          }}
        >
          {label}
        </span>
      </Tip>

      {/* Color swatch (native picker) */}
      <label
        style={{
          position: "relative",
          width: 22,
          height: 22,
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: value,
            border: `1.5px solid ${modified ? "#F59E0B" : "rgba(255,255,255,0.18)"}`,
            boxSizing: "border-box",
          }}
        />
        <input
          type="color"
          value={hex}
          onChange={(e) => {
            setLocalHex(e.target.value);
            onChange(e.target.value);
          }}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            width: "100%",
            height: "100%",
            cursor: "pointer",
          }}
        />
      </label>

      {/* Hex text input */}
      <input
        id={`hex-${label}`}
        type="text"
        value={localHex}
        maxLength={7}
        onChange={(e) => setLocalHex(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) =>
          e.key === "Enter" && commit((e.target as HTMLInputElement).value)
        }
        placeholder="#000000"
        style={{
          flex: 1,
          minWidth: 0,
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${modified ? "rgba(217,119,6,0.4)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 4,
          color: modified ? "#FCD34D" : "rgba(255,255,255,0.55)",
          fontSize: 11,
          fontFamily: "monospace",
          padding: "4px 7px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {/* Reset — only takes space when modified */}
      <div
        style={{
          width: 18,
          flexShrink: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {modified && (
          <button
            onClick={() => {
              setLocalHex(defaultValue);
              onChange(defaultValue);
            }}
            title="Reset to default"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#F59E0B",
              fontSize: 14,
              padding: 0,
              lineHeight: 1,
            }}
          >
            ↺
          </button>
        )}
      </div>
    </div>
  );
}

// ── Ball badge picker ────────────────────────────────────────

function BallBadge({
  label,
  short,
  desc,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  short: string;
  desc: string;
  value: string;
  defaultValue: string;
  onChange: (v: string) => void;
}) {
  const textColor = getContrastText(value);
  const modified = value !== defaultValue;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 8px",
        borderRadius: 7,
        background: modified
          ? "rgba(245,158,11,0.07)"
          : "rgba(255,255,255,0.02)",
        border: `1px solid ${modified ? "rgba(217,119,6,0.28)" : "rgba(255,255,255,0.06)"}`,
      }}
    >
      {/* Badge preview */}
      <Tip text={desc}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: value,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: textColor,
            fontSize: short.length > 1 ? 10 : 13,
            fontWeight: 700,
            flexShrink: 0,
            cursor: "help",
          }}
        >
          {short}
        </div>
      </Tip>

      {/* Label */}
      <span
        style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: 11,
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>

      {/* Reset */}
      {modified && (
        <button
          onClick={() => onChange(defaultValue)}
          title="Reset"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#F59E0B",
            fontSize: 13,
            padding: 0,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ↺
        </button>
      )}

      {/* Swatch picker */}
      <label
        style={{
          position: "relative",
          width: 22,
          height: 22,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 4,
            background: value,
            border: `1.5px solid ${modified ? "#F59E0B" : "rgba(255,255,255,0.2)"}`,
            boxSizing: "border-box",
          }}
        />
        <input
          type="color"
          value={toHex(value)}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            width: "100%",
            height: "100%",
            cursor: "pointer",
          }}
        />
      </label>
    </div>
  );
}

// ── Advanced token row (compact) ─────────────────────────────

function AdvRow({
  tokenKey,
  value,
  onChange,
}: {
  tokenKey: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <label
        style={{
          position: "relative",
          width: 18,
          height: 18,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 3,
            background: toHex(value),
            border: "1px solid rgba(255,255,255,0.15)",
            boxSizing: "border-box",
          }}
        />
        <input
          type="color"
          value={toHex(value)}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            cursor: "pointer",
          }}
        />
      </label>
      <span
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 10,
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {tokenKey.replace(/-/g, " ")}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 72,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 4,
          color: "rgba(255,255,255,0.55)",
          fontSize: 10,
          fontFamily: "monospace",
          padding: "3px 6px",
          outline: "none",
          flexShrink: 0,
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────

export default function ThemeConfigPanel({ config, onChange }: Props) {
  const [activeBundle, setActiveBundle] = useState<BundleId>("basic");
  const [advOpen, setAdvOpen] = useState(false);

  // Derive master colors from bundle config
  const currentMaster = useMemo<MasterColors>(() => {
    const def = DEFAULT_MASTER_COLORS[activeBundle];
    const bc = config[activeBundle];
    if (!bc || Object.keys(bc).length === 0) return { ...def };
    // Try known derived key names, fall back to defaults
    return {
      team1: bc.blue ?? bc.cyan ?? bc["badge-team1"] ?? def.team1,
      team2: bc.purple ?? bc.pink ?? bc["badge-team2"] ?? def.team2,
      accent: bc.gold ?? bc.teal ?? bc["border-main"] ?? def.accent,
      alert: bc.red ?? bc.coral ?? bc["wicket-dot"] ?? def.alert,
      bg: bc.bg ?? bc["panel-bg"] ?? def.bg,
      text: bc.white ?? bc.textMain ?? bc["text-primary"] ?? def.text,
    };
  }, [config, activeBundle]);

  const currentBalls = useMemo<BallColors>(() => {
    const def = DEFAULT_BALL_COLORS;
    const bc = config[activeBundle];
    if (!bc) return { ...def };
    return {
      wicket: bc["ball-W-fg"] ?? def.wicket,
      six: bc["ball-6-fg"] ?? def.six,
      four: bc["ball-4-fg"] ?? def.four,
      wide: bc["ball-Wd-fg"] ?? def.wide,
    };
  }, [config, activeBundle]);

  const handleMasterChange = useCallback(
    (key: keyof MasterColors, value: string) => {
      const newMaster = { ...currentMaster, [key]: value };
      const derived = buildConfigFromSimplified(
        activeBundle,
        newMaster,
        currentBalls,
      );
      onChange({ ...config, [activeBundle]: derived });
    },
    [config, activeBundle, currentMaster, currentBalls, onChange],
  );

  const handleBallChange = useCallback(
    (key: keyof BallColors, value: string) => {
      const newBalls = { ...currentBalls, [key]: value };
      const derived = buildConfigFromSimplified(
        activeBundle,
        currentMaster,
        newBalls,
      );
      onChange({ ...config, [activeBundle]: derived });
    },
    [config, activeBundle, currentMaster, currentBalls, onChange],
  );

  const handleAdvChange = useCallback(
    (key: string, value: string) => {
      const bc = config[activeBundle] ?? {};
      onChange({ ...config, [activeBundle]: { ...bc, [key]: value } });
    },
    [config, activeBundle, onChange],
  );

  const handleResetAll = useCallback(() => {
    const derived = buildConfigFromSimplified(
      activeBundle,
      DEFAULT_MASTER_COLORS[activeBundle],
      DEFAULT_BALL_COLORS,
    );
    onChange({ ...config, [activeBundle]: derived });
  }, [config, activeBundle, onChange]);

  const bundleHasOverrides = !!(
    config[activeBundle] && Object.keys(config[activeBundle]).length > 0
  );

  // Advanced token entries — exclude the primary keys used for master/ball
  const EXCLUDED_ADV_KEYS = new Set([
    "bg",
    "gold",
    "blue",
    "purple",
    "red",
    "white",
    "cyan",
    "pink",
    "coral",
    "teal",
    "textMain",
    "panel-bg",
    "text-primary",
    "badge-team1",
    "badge-team2",
    "border-main",
    "wicket-dot",
    "ball-W-fg",
    "ball-6-fg",
    "ball-4-fg",
    "ball-Wd-fg",
  ]);
  const advEntries = Object.entries(config[activeBundle] ?? {})
    .filter(([k]) => !EXCLUDED_ADV_KEYS.has(k))
    .slice(0, 30);

  // ── Shared style tokens ──
  const S = {
    scrollBody: {
      maxHeight: 460,
      overflowY: "auto" as const,
      overflowX: "hidden" as const,
    },
    section: {
      padding: "14px 14px 0",
    },
    sectionLast: {
      padding: "14px",
    },
    divider: {
      borderTop: "1px solid rgba(255,255,255,0.06)",
    },
  };

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "rgba(8,10,24,0.98)",
        color: "#FFFFFF",
        overflow: "hidden",
        // No fixed width — fills whatever container it's in
      }}
    >
      {/* ── Bundle tabs ── */}
      <div
        style={{
          background: "rgba(0,0,0,0.3)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "4px 4px 4px",
          display: "flex",
          gap: 3,
        }}
      >
        {(Object.keys(BUNDLE_LABELS) as BundleId[]).map((id) => {
          const active = id === activeBundle;
          return (
            <button
              key={id}
              onClick={() => setActiveBundle(id)}
              style={{
                flex: 1,
                padding: "8px 4px",
                background: active ? "rgba(255,255,255,0.09)" : "transparent",
                border: `1px solid ${active ? "rgba(255,255,255,0.12)" : "transparent"}`,
                borderRadius: 6,
                color: active ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {BUNDLE_LABELS[id]}
            </button>
          );
        })}
      </div>

      {/* ── Description + reset bar ── */}
      <div
        style={{
          padding: "7px 12px",
          background: "rgba(255,255,255,0.02)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          minHeight: 32,
          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 10,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {BUNDLE_DESCRIPTIONS[activeBundle]}
        </span>
        {bundleHasOverrides && (
          <button
            onClick={handleResetAll}
            style={{
              background: "rgba(217,119,6,0.12)",
              border: "1px solid rgba(217,119,6,0.28)",
              borderRadius: 4,
              color: "#FCD34D",
              fontSize: 10,
              padding: "3px 9px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 600,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            ↺ Reset
          </button>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="tcp-scroll" style={S.scrollBody}>
        {/* Essential Colors */}
        <div style={S.section}>
          <SectionLabel
            badge={
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>
                hover label for info
              </span>
            }
          >
            Essential Colors
          </SectionLabel>
          <div
            style={{
              background: "rgba(255,255,255,0.018)",
              borderRadius: 8,
              padding: "4px 10px",
              border: "1px solid rgba(255,255,255,0.05)",
              marginBottom: 14,
            }}
          >
            {MASTER_FIELDS.map((f, i) => (
              <div
                key={f.key}
                style={{
                  borderBottom:
                    i < MASTER_FIELDS.length - 1 ? undefined : "none",
                }}
              >
                <ColorRow
                  label={f.label}
                  desc={f.desc}
                  value={currentMaster[f.key]}
                  defaultValue={DEFAULT_MASTER_COLORS[activeBundle][f.key]}
                  onChange={(v) => handleMasterChange(f.key, v)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Ball Badges */}
        <div style={{ ...S.sectionLast, ...S.divider, paddingTop: 14 }}>
          <SectionLabel
            badge={
              <span
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 9,
                  padding: "2px 6px",
                  borderRadius: 3,
                  whiteSpace: "nowrap",
                }}
              >
                Auto contrast
              </span>
            }
          >
            Ball Badges
          </SectionLabel>
          {/* 2-column grid — safe at 280px+ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
              gap: 6,
            }}
          >
            {BALL_FIELDS.map((f) => (
              <BallBadge
                key={f.key}
                label={f.label}
                short={f.short}
                desc={f.desc}
                value={currentBalls[f.key]}
                defaultValue={DEFAULT_BALL_COLORS[f.key]}
                onChange={(v) => handleBallChange(f.key, v)}
              />
            ))}
          </div>
        </div>

        {/* Advanced mode toggle */}
        <div
          style={{
            ...S.divider,
            padding: "10px 12px",
            background: "rgba(0,0,0,0.15)",
            marginTop: 14,
          }}
        >
          <button
            onClick={() => setAdvOpen((v) => !v)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              color: "rgba(255,255,255,0.5)",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
              boxSizing: "border-box",
            }}
          >
            <span>Advanced mode</span>
            <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 13 }}>
              {advOpen ? "▴" : "▾"}
            </span>
          </button>
        </div>

        {/* Advanced: fine-tune tokens */}
        {advOpen && (
          <div
            style={{
              ...S.divider,
              padding: "12px 14px",
              background: "rgba(0,0,0,0.18)",
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 10,
                margin: "0 0 10px",
                lineHeight: 1.5,
              }}
            >
              Override individual derived tokens. These take precedence over the
              essential colors above.
            </p>
            {advEntries.length === 0 ? (
              <p
                style={{
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 11,
                  textAlign: "center",
                  padding: "10px 0",
                  margin: 0,
                }}
              >
                No derived tokens yet. Adjust essential colors first.
              </p>
            ) : (
              advEntries.map(([key, value]) => (
                <AdvRow
                  key={key}
                  tokenKey={key}
                  value={value as string}
                  onChange={(v) => handleAdvChange(key, v)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Footer tip ── */}
      <div
        style={{
          padding: "9px 14px",
          background: "rgba(0,0,0,0.22)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 10,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Tip: Set the 6 essential colors — all dim variants, glows, and shadows
          are auto-derived.
        </p>
      </div>

      <style>{`
        .tcp-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
        .tcp-scroll::-webkit-scrollbar { width: 4px; }
        .tcp-scroll::-webkit-scrollbar-track { background: transparent; }
        .tcp-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .tcp-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
