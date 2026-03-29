"use client";

import { useState, useCallback } from "react";
import { ThemeConfig, BundleId } from "@/lib/themeConfig";

// ═══════════════════════════════════════════════════════════
// THEME CONFIG PANEL
// Lets users customise overlay colors per bundle.
// Changes propagate up via onChange; persisted externally.
// ═══════════════════════════════════════════════════════════

interface Props {
  config: ThemeConfig;
  onChange: (config: ThemeConfig) => void;
}

// ── Field & group metadata ───────────────────────────────────

interface ThemeField {
  key: string;   // CSS var suffix after the prefix, e.g. "bg", "ball-W-fg"
  label: string;
  default: string;
}
interface ThemeGroup { name: string; fields: ThemeField[] }

const BASIC_GROUPS: ThemeGroup[] = [
  {
    name: "Panel",
    fields: [
      { key: "bg",     label: "Background",     default: "rgba(6, 8, 16, 0.97)" },
      { key: "border", label: "Border",          default: "rgba(255,255,255,0.08)" },
    ],
  },
  {
    name: "Accents",
    fields: [
      { key: "gold",       label: "Gold",               default: "#E2B94B" },
      { key: "goldDim",    label: "Gold Dim",            default: "rgba(226,185,75,0.35)" },
      { key: "blue",       label: "Blue (Team 1)",       default: "#4A9EF5" },
      { key: "blueDim",    label: "Blue Dim",            default: "rgba(74,158,245,0.25)" },
      { key: "purple",     label: "Purple (Team 2)",     default: "#A855F7" },
      { key: "purpleDim",  label: "Purple Dim",          default: "rgba(168,85,247,0.25)" },
      { key: "red",        label: "Alert / Wicket",      default: "#F87171" },
    ],
  },
  {
    name: "Text",
    fields: [
      { key: "white", label: "White 100%", default: "#FFFFFF" },
      { key: "w80",   label: "White 80%",  default: "rgba(255,255,255,0.80)" },
      { key: "w55",   label: "White 55%",  default: "rgba(255,255,255,0.55)" },
      { key: "w35",   label: "White 35%",  default: "rgba(255,255,255,0.35)" },
      { key: "w20",   label: "White 20%",  default: "rgba(255,255,255,0.20)" },
      { key: "w10",   label: "White 10%",  default: "rgba(255,255,255,0.10)" },
      { key: "w06",   label: "White 6%",   default: "rgba(255,255,255,0.06)" },
      { key: "w04",   label: "White 4%",   default: "rgba(255,255,255,0.04)" },
    ],
  },
  {
    name: "Ball — Wicket (W)",
    fields: [
      { key: "ball-W-bg",   label: "Background", default: "#7F1D1D" },
      { key: "ball-W-fg",   label: "Text",        default: "#FCA5A5" },
      { key: "ball-W-ring", label: "Ring",        default: "#EF4444" },
    ],
  },
  {
    name: "Ball — Six (6)",
    fields: [
      { key: "ball-6-bg",   label: "Background", default: "#4C1D95" },
      { key: "ball-6-fg",   label: "Text",        default: "#DDD6FE" },
      { key: "ball-6-ring", label: "Ring",        default: "#8B5CF6" },
    ],
  },
  {
    name: "Ball — Four (4)",
    fields: [
      { key: "ball-4-bg",   label: "Background", default: "#1E3A5F" },
      { key: "ball-4-fg",   label: "Text",        default: "#93C5FD" },
      { key: "ball-4-ring", label: "Ring",        default: "#3B82F6" },
    ],
  },
  {
    name: "Ball — Wide / No-Ball",
    fields: [
      { key: "ball-Wd-bg",   label: "Background", default: "#78350F" },
      { key: "ball-Wd-fg",   label: "Text",        default: "#FDE68A" },
      { key: "ball-Wd-ring", label: "Ring",        default: "#F59E0B" },
    ],
  },
  {
    name: "Ball — Dot (0)",
    fields: [
      { key: "ball-0-bg",   label: "Background", default: "rgba(255,255,255,0.05)" },
      { key: "ball-0-fg",   label: "Text",        default: "rgba(255,255,255,0.35)" },
      { key: "ball-0-ring", label: "Ring",        default: "rgba(255,255,255,0.12)" },
    ],
  },
  {
    name: "Ball — Runs (1–3)",
    fields: [
      { key: "ball-run-bg",   label: "Background", default: "#064E2E" },
      { key: "ball-run-fg",   label: "Text",        default: "#6EE7B7" },
      { key: "ball-run-ring", label: "Ring",        default: "#10B981" },
    ],
  },
];

const GLASS_GROUPS: ThemeGroup[] = [
  {
    name: "Panel Backgrounds",
    fields: [
      { key: "bg",      label: "Main Panel",      default: "rgba(15, 23, 42, 0.45)" },
      { key: "bgDeep",  label: "Deep / Anchors",  default: "rgba(2, 6, 23, 0.65)" },
      { key: "bgLight", label: "Row Highlight",   default: "rgba(255, 255, 255, 0.08)" },
      { key: "bgDark",  label: "Footer",          default: "rgba(0, 0, 0, 0.55)" },
    ],
  },
  {
    name: "Borders",
    fields: [
      { key: "borderHighlight", label: "Edge Highlight",   default: "rgba(255, 255, 255, 0.35)" },
      { key: "borderShadow",    label: "Edge Shadow",      default: "rgba(255, 255, 255, 0.05)" },
      { key: "borderSub",       label: "Inner Divider",    default: "rgba(255, 255, 255, 0.15)" },
    ],
  },
  {
    name: "Accents",
    fields: [
      { key: "teal",     label: "Teal (Primary)",    default: "#00F5D4" },
      { key: "tealDim",  label: "Teal Dim",          default: "rgba(0, 245, 212, 0.15)" },
      { key: "tealGlow", label: "Teal Glow",         default: "0 0 15px rgba(0, 245, 212, 0.4)" },
      { key: "cyan",     label: "Cyan (Team 1)",     default: "#00E5FF" },
      { key: "cyanDim",  label: "Cyan Dim",          default: "rgba(0, 229, 255, 0.15)" },
      { key: "cyanGlow", label: "Cyan Glow",         default: "0 0 15px rgba(0, 229, 255, 0.4)" },
      { key: "pink",     label: "Pink (Team 2)",     default: "#FF007F" },
      { key: "pinkDim",  label: "Pink Dim",          default: "rgba(255, 0, 127, 0.15)" },
      { key: "pinkGlow", label: "Pink Glow",         default: "0 0 15px rgba(255, 0, 127, 0.4)" },
      { key: "coral",    label: "Alert / Wicket",    default: "#FF3366" },
      { key: "coralDim", label: "Alert Dim",         default: "rgba(255, 51, 102, 0.15)" },
    ],
  },
  {
    name: "Text",
    fields: [
      { key: "white", label: "White 100%", default: "#FFFFFF" },
      { key: "w90",   label: "White 92%",  default: "rgba(255,255,255,0.92)" },
      { key: "w70",   label: "White 75%",  default: "rgba(255,255,255,0.75)" },
      { key: "w45",   label: "White 55%",  default: "rgba(255,255,255,0.55)" },
      { key: "w25",   label: "White 35%",  default: "rgba(255,255,255,0.35)" },
      { key: "w12",   label: "White 15%",  default: "rgba(255,255,255,0.15)" },
      { key: "textGlow", label: "Text Glow (shadow)", default: "0 2px 4px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.9)" },
    ],
  },
  {
    name: "Ball — Wicket (W)",
    fields: [
      { key: "ball-W-bg",     label: "Background", default: "rgba(255, 51, 102, 0.2)" },
      { key: "ball-W-fg",     label: "Text",        default: "#FF3366" },
      { key: "ball-W-border", label: "Border",      default: "1px solid rgba(255, 51, 102, 0.6)" },
      { key: "ball-W-shadow", label: "Shadow",      default: "0 0 12px rgba(255, 51, 102, 0.4)" },
    ],
  },
  {
    name: "Ball — Six (6)",
    fields: [
      { key: "ball-6-bg",     label: "Background", default: "rgba(189, 0, 255, 0.2)" },
      { key: "ball-6-fg",     label: "Text",        default: "#BD00FF" },
      { key: "ball-6-border", label: "Border",      default: "1px solid rgba(189, 0, 255, 0.6)" },
      { key: "ball-6-shadow", label: "Shadow",      default: "0 0 12px rgba(189, 0, 255, 0.4)" },
    ],
  },
  {
    name: "Ball — Four (4)",
    fields: [
      { key: "ball-4-bg",     label: "Background", default: "rgba(0, 229, 255, 0.2)" },
      { key: "ball-4-fg",     label: "Text",        default: "#00E5FF" },
      { key: "ball-4-border", label: "Border",      default: "1px solid rgba(0, 229, 255, 0.6)" },
      { key: "ball-4-shadow", label: "Shadow",      default: "0 0 12px rgba(0, 229, 255, 0.4)" },
    ],
  },
  {
    name: "Ball — Wide / No-Ball",
    fields: [
      { key: "ball-Wd-bg",     label: "Background", default: "rgba(255, 204, 0, 0.2)" },
      { key: "ball-Wd-fg",     label: "Text",        default: "#FFCC00" },
      { key: "ball-Wd-border", label: "Border",      default: "1px solid rgba(255, 204, 0, 0.6)" },
      { key: "ball-Wd-shadow", label: "Shadow",      default: "0 0 12px rgba(255, 204, 0, 0.4)" },
    ],
  },
  {
    name: "Ball — Dot (0)",
    fields: [
      { key: "ball-0-bg",     label: "Background", default: "rgba(255,255,255,0.05)" },
      { key: "ball-0-fg",     label: "Text",        default: "rgba(255,255,255,0.5)" },
      { key: "ball-0-border", label: "Border",      default: "1px solid rgba(255,255,255,0.2)" },
      { key: "ball-0-shadow", label: "Shadow",      default: "none" },
    ],
  },
  {
    name: "Ball — Runs (1–3)",
    fields: [
      { key: "ball-run-bg",     label: "Background", default: "rgba(0, 245, 212, 0.15)" },
      { key: "ball-run-fg",     label: "Text",        default: "#00F5D4" },
      { key: "ball-run-border", label: "Border",      default: "1px solid rgba(0, 245, 212, 0.5)" },
      { key: "ball-run-shadow", label: "Shadow",      default: "0 0 10px rgba(0, 245, 212, 0.3)" },
    ],
  },
];

const MATERIAL_GROUPS: ThemeGroup[] = [
  {
    name: "Panel Backgrounds",
    fields: [
      { key: "bg",      label: "Main Panel",     default: "#111827" },
      { key: "bgDeep",  label: "Deep Sections",  default: "#030712" },
      { key: "bgLight", label: "Row Alternate",  default: "#1F2937" },
      { key: "bgDark",  label: "Header / Footer",default: "#0F172A" },
    ],
  },
  {
    name: "Borders",
    fields: [
      { key: "border",    label: "Separator",       default: "#374151" },
      { key: "borderSub", label: "Inner Separator", default: "#1F2937" },
    ],
  },
  {
    name: "Accents",
    fields: [
      { key: "teal",     label: "Teal (Primary)", default: "#009688" },
      { key: "tealDim",  label: "Teal Dim",       default: "#004D40" },
      { key: "cyan",     label: "Cyan (Team 1)",  default: "#00BCD4" },
      { key: "cyanDim",  label: "Cyan Dim",       default: "#006064" },
      { key: "pink",     label: "Pink (Team 2)",  default: "#E91E63" },
      { key: "pinkDim",  label: "Pink Dim",       default: "#880E4F" },
      { key: "coral",    label: "Alert / Wicket", default: "#DC2626" },
      { key: "coralDim", label: "Alert Dim",      default: "#7F1D1D" },
    ],
  },
  {
    name: "Text",
    fields: [
      { key: "white", label: "White",       default: "#FFFFFF" },
      { key: "w90",   label: "Primary",     default: "#F3F4F6" },
      { key: "w70",   label: "Secondary",   default: "#D1D5DB" },
      { key: "w45",   label: "Muted",       default: "#9CA3AF" },
      { key: "w25",   label: "Disabled",    default: "#6B7280" },
      { key: "w12",   label: "Faint",       default: "#4B5563" },
      { key: "w06",   label: "Very Faint",  default: "#374151" },
    ],
  },
  {
    name: "Ball — Wicket (W)",
    fields: [
      { key: "ball-W-bg",     label: "Background", default: "#DC2626" },
      { key: "ball-W-fg",     label: "Text",        default: "#FFFFFF" },
      { key: "ball-W-border", label: "Border",      default: "1px solid #991B1B" },
      { key: "ball-W-shadow", label: "Shadow",      default: "0 2px 4px rgba(0,0,0,0.3)" },
    ],
  },
  {
    name: "Ball — Six (6)",
    fields: [
      { key: "ball-6-bg",     label: "Background", default: "#6D28D9" },
      { key: "ball-6-fg",     label: "Text",        default: "#FFFFFF" },
      { key: "ball-6-border", label: "Border",      default: "1px solid #4C1D95" },
      { key: "ball-6-shadow", label: "Shadow",      default: "0 2px 4px rgba(0,0,0,0.3)" },
    ],
  },
  {
    name: "Ball — Four (4)",
    fields: [
      { key: "ball-4-bg",     label: "Background", default: "#0284C7" },
      { key: "ball-4-fg",     label: "Text",        default: "#FFFFFF" },
      { key: "ball-4-border", label: "Border",      default: "1px solid #075985" },
      { key: "ball-4-shadow", label: "Shadow",      default: "0 2px 4px rgba(0,0,0,0.3)" },
    ],
  },
  {
    name: "Ball — Wide / No-Ball",
    fields: [
      { key: "ball-Wd-bg",     label: "Background", default: "#D97706" },
      { key: "ball-Wd-fg",     label: "Text",        default: "#FFFFFF" },
      { key: "ball-Wd-border", label: "Border",      default: "1px solid #92400E" },
      { key: "ball-Wd-shadow", label: "Shadow",      default: "0 2px 4px rgba(0,0,0,0.3)" },
    ],
  },
  {
    name: "Ball — Dot (0)",
    fields: [
      { key: "ball-0-bg",     label: "Background", default: "#374151" },
      { key: "ball-0-fg",     label: "Text",        default: "#D1D5DB" },
      { key: "ball-0-border", label: "Border",      default: "1px solid #1F2937" },
      { key: "ball-0-shadow", label: "Shadow",      default: "inset 0 1px 2px rgba(0,0,0,0.2)" },
    ],
  },
  {
    name: "Ball — Runs (1–3)",
    fields: [
      { key: "ball-run-bg",     label: "Background", default: "#059669" },
      { key: "ball-run-fg",     label: "Text",        default: "#FFFFFF" },
      { key: "ball-run-border", label: "Border",      default: "1px solid #065F46" },
      { key: "ball-run-shadow", label: "Shadow",      default: "0 2px 4px rgba(0,0,0,0.3)" },
    ],
  },
];

const AERO_GROUPS: ThemeGroup[] = [
  {
    name: "Panel Backgrounds",
    fields: [
      { key: "bg",      label: "Main Card",       default: "#FFFFFF" },
      { key: "bgDeep",  label: "Header / Footer", default: "#F3F4F6" },
      { key: "bgLight", label: "Row Alternate",   default: "#FAFAFA" },
      { key: "bgDark",  label: "Emphasis",        default: "#E5E7EB" },
    ],
  },
  {
    name: "Borders",
    fields: [
      { key: "border",    label: "Structural",    default: "#E5E7EB" },
      { key: "borderSub", label: "Inner Separator", default: "#F3F4F6" },
    ],
  },
  {
    name: "Accents",
    fields: [
      { key: "teal",     label: "Teal (Primary)",  default: "#0D9488" },
      { key: "tealDim",  label: "Teal Dim",        default: "#CCFBF1" },
      { key: "cyan",     label: "Sky (Team 1)",    default: "#0284C7" },
      { key: "cyanDim",  label: "Sky Dim",         default: "#E0F2FE" },
      { key: "pink",     label: "Rose (Team 2)",   default: "#E11D48" },
      { key: "pinkDim",  label: "Rose Dim",        default: "#FFE4E6" },
      { key: "coral",    label: "Alert / Wicket",  default: "#EF4444" },
      { key: "coralDim", label: "Alert Dim",       default: "#FEE2E2" },
    ],
  },
  {
    name: "Text",
    fields: [
      { key: "textMain", label: "Primary (Near Black)", default: "#111827" },
      { key: "t90",      label: "Standard",             default: "#1F2937" },
      { key: "t70",      label: "Secondary",            default: "#4B5563" },
      { key: "t45",      label: "Muted Labels",         default: "#6B7280" },
      { key: "t25",      label: "Disabled",             default: "#9CA3AF" },
      { key: "t12",      label: "Faint",                default: "#D1D5DB" },
      { key: "t06",      label: "Very Faint",           default: "#E5E7EB" },
    ],
  },
  {
    name: "Ball — Wicket (W)",
    fields: [
      { key: "ball-W-bg",     label: "Background", default: "#EF4444" },
      { key: "ball-W-fg",     label: "Text",        default: "#FFFFFF" },
      { key: "ball-W-border", label: "Border",      default: "none" },
      { key: "ball-W-shadow", label: "Shadow",      default: "0 2px 6px rgba(239,68,68,0.25)" },
    ],
  },
  {
    name: "Ball — Six (6)",
    fields: [
      { key: "ball-6-bg",     label: "Background", default: "#8B5CF6" },
      { key: "ball-6-fg",     label: "Text",        default: "#FFFFFF" },
      { key: "ball-6-border", label: "Border",      default: "none" },
      { key: "ball-6-shadow", label: "Shadow",      default: "0 2px 6px rgba(139,92,246,0.25)" },
    ],
  },
  {
    name: "Ball — Four (4)",
    fields: [
      { key: "ball-4-bg",     label: "Background", default: "#0EA5E9" },
      { key: "ball-4-fg",     label: "Text",        default: "#FFFFFF" },
      { key: "ball-4-border", label: "Border",      default: "none" },
      { key: "ball-4-shadow", label: "Shadow",      default: "0 2px 6px rgba(14,165,233,0.25)" },
    ],
  },
  {
    name: "Ball — Wide / No-Ball",
    fields: [
      { key: "ball-Wd-bg",     label: "Background", default: "#F59E0B" },
      { key: "ball-Wd-fg",     label: "Text",        default: "#FFFFFF" },
      { key: "ball-Wd-border", label: "Border",      default: "none" },
      { key: "ball-Wd-shadow", label: "Shadow",      default: "0 2px 6px rgba(245,158,11,0.25)" },
    ],
  },
  {
    name: "Ball — Dot (0)",
    fields: [
      { key: "ball-0-bg",     label: "Background", default: "#FFFFFF" },
      { key: "ball-0-fg",     label: "Text",        default: "#9CA3AF" },
      { key: "ball-0-border", label: "Border",      default: "1px solid #E5E7EB" },
      { key: "ball-0-shadow", label: "Shadow",      default: "none" },
    ],
  },
  {
    name: "Ball — Runs (1–3)",
    fields: [
      { key: "ball-run-bg",     label: "Background", default: "#F3F4F6" },
      { key: "ball-run-fg",     label: "Text",        default: "#374151" },
      { key: "ball-run-border", label: "Border",      default: "1px solid #E5E7EB" },
      { key: "ball-run-shadow", label: "Shadow",      default: "none" },
    ],
  },
];

const BUNDLE_GROUPS: Record<BundleId, ThemeGroup[]> = {
  basic:    BASIC_GROUPS,
  glass:    GLASS_GROUPS,
  material: MATERIAL_GROUPS,
  aero:     AERO_GROUPS,
};

const BUNDLE_LABELS: Record<BundleId, string> = {
  basic:    "Basic",
  glass:    "Glass",
  material: "Material",
  aero:     "Aero",
};

// ── Colour helpers ────────────────────────────────────────────

// Try to extract a hex string from any CSS colour for the <input type="color"> swatch.
// Returns #808080 as fallback for complex values (rgba, shadows, etc).
function toHexForPicker(cssValue: string): string {
  const trimmed = cssValue.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed;
  const rgba = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgba) {
    const hex = (n: string) => parseInt(n).toString(16).padStart(2, "0");
    return `#${hex(rgba[1])}${hex(rgba[2])}${hex(rgba[3])}`;
  }
  return "#808080";
}

// ── Sub-components ────────────────────────────────────────────

function ColorRow({
  field,
  value,
  onChange,
}: {
  field: ThemeField;
  value: string;
  onChange: (val: string) => void;
}) {
  const isModified = value !== field.default;

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
      {/* Color swatch / picker */}
      <label style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: value,
            border: "1px solid rgba(255,255,255,0.15)",
            cursor: "pointer",
          }}
        />
        <input
          type="color"
          value={toHexForPicker(value)}
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

      {/* Label */}
      <span
        style={{
          flex: 1,
          color: isModified ? "#F3F4F6" : "rgba(255,255,255,0.5)",
          fontSize: 12,
          fontWeight: isModified ? 600 : 400,
          minWidth: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {field.label}
      </span>

      {/* Text input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 160,
          background: "rgba(255,255,255,0.06)",
          border: `1px solid ${isModified ? "rgba(217,119,6,0.5)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 6,
          color: isModified ? "#FCD34D" : "rgba(255,255,255,0.5)",
          fontSize: 11,
          fontFamily: "monospace",
          padding: "4px 7px",
          outline: "none",
        }}
      />

      {/* Reset button */}
      {isModified && (
        <button
          onClick={() => onChange(field.default)}
          title="Reset to default"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.3)",
            fontSize: 14,
            lineHeight: 1,
            padding: 2,
            flexShrink: 0,
          }}
        >
          ↺
        </button>
      )}
    </div>
  );
}

function GroupSection({
  group,
  overrides,
  onFieldChange,
  initialOpen = false,
}: {
  group: ThemeGroup;
  overrides: Record<string, string>;
  onFieldChange: (key: string, val: string) => void;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const hasAnyModified = group.fields.some(
    (f) => overrides[f.key] !== undefined && overrides[f.key] !== f.default,
  );

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 16px",
          background: "rgba(8,10,24,0.97)",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {hasAnyModified && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#F59E0B",
                flexShrink: 0,
              }}
            />
          )}
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {group.name}
          </span>
        </span>
        <i
          className={`ri-arrow-${open ? "up" : "down"}-s-line`}
          style={{ color: "rgba(255,255,255,0.25)", fontSize: 16 }}
        />
      </button>
      {open && (
        <div style={{ padding: "0 16px 8px", background: "rgba(8,10,24,0.97)" }}>
          {group.fields.map((field) => (
            <ColorRow
              key={field.key}
              field={field}
              value={overrides[field.key] ?? field.default}
              onChange={(val) => onFieldChange(field.key, val)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function ThemeConfigPanel({ config, onChange }: Props) {
  const [activeBundle, setActiveBundle] = useState<BundleId>("basic");

  const handleFieldChange = useCallback(
    (key: string, val: string) => {
      const bundleOverrides = { ...(config[activeBundle] ?? {}) };
      bundleOverrides[key] = val;
      onChange({ ...config, [activeBundle]: bundleOverrides });
    },
    [config, activeBundle, onChange],
  );

  const handleResetBundle = useCallback(() => {
    const next = { ...config };
    delete next[activeBundle];
    onChange(next);
  }, [config, activeBundle, onChange]);

  const bundleOverrides = config[activeBundle] ?? {};
  const bundles = (["basic", "glass", "material", "aero"] as BundleId[]);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "rgba(8,10,24,0.97)", color: "#FFFFFF" }}>
      {/* Bundle tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          background: "rgba(0,0,0,0.3)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {bundles.map((id) => {
          const hasOverride =
            config[id] && Object.keys(config[id]!).length > 0;
          const isActive = id === activeBundle;
          return (
            <button
              key={id}
              onClick={() => setActiveBundle(id)}
              style={{
                flex: 1,
                padding: "10px 0",
                background: isActive ? "rgba(255,255,255,0.07)" : "none",
                border: "none",
                borderBottom: isActive
                  ? "2px solid #D97706"
                  : "2px solid transparent",
                color: isActive ? "#F3F4F6" : "rgba(255,255,255,0.35)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              {hasOverride && !isActive && (
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#F59E0B",
                    flexShrink: 0,
                  }}
                />
              )}
              {BUNDLE_LABELS[id]}
            </button>
          );
        })}
      </div>

      {/* Reset bundle row */}
      {Object.keys(bundleOverrides).length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "8px 16px",
            background: "rgba(8,10,24,0.97)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            onClick={handleResetBundle}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              color: "rgba(255,255,255,0.45)",
              fontSize: 11,
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Reset {BUNDLE_LABELS[activeBundle]} to defaults
          </button>
        </div>
      )}

      {/* Groups */}
      <div style={{ maxHeight: 400, overflowY: "auto", background: "rgba(8,10,24,0.97)" }}>
        {BUNDLE_GROUPS[activeBundle].map((group, i) => (
          <GroupSection
            key={`${activeBundle}-${group.name}`}
            group={group}
            overrides={bundleOverrides}
            onFieldChange={handleFieldChange}
            initialOpen={i < 2}
          />
        ))}
      </div>

      <div
        style={{
          padding: "10px 16px",
          background: "rgba(8,10,24,0.98)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0, lineHeight: "16px" }}>
          Changes apply to all overlays in the OBS URL. Copy the updated URL after editing.
        </p>
      </div>
    </div>
  );
}
