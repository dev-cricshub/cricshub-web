"use client";

import { useState, useRef } from "react";
import { BrandingConfig, DEFAULT_BRANDING_CONFIG } from "../../overlays/premium/matchAddOn/BrandingOverlay";
import { uploadFile } from "../../../lib/api";

// ═══════════════════════════════════════════════════════════
// BRANDING CONFIG PANEL
// Shown in stream dashboard when tpl-pro-4 is active
// ═══════════════════════════════════════════════════════════

interface Props {
  config: BrandingConfig;
  onChange: (config: BrandingConfig) => void;
  onSave: (config: BrandingConfig) => void;
}

// ── Toggle ──────────────────────────────────────────────────
function Toggle({
  value,
  onChange,
  label,
  description,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        padding: "11px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ color: "#F3F4F6", fontSize: 13, fontWeight: 600, lineHeight: "18px" }}>
          {label}
        </div>
        {description && (
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2, lineHeight: "15px" }}>
            {description}
          </div>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          border: "none",
          cursor: "pointer",
          background: value ? "#D97706" : "rgba(255,255,255,0.12)",
          position: "relative",
          transition: "background 0.2s ease",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#FFFFFF",
            left: value ? 21 : 3,
            transition: "left 0.2s ease",
            boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
          }}
        />
      </button>
    </div>
  );
}

// ── TextInput ────────────────────────────────────────────────
function TextInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.8,
          textTransform: "uppercase",
          display: "block",
          marginBottom: 5,
        }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 7,
          padding: "9px 12px",
          color: "#FFFFFF",
          fontSize: 13,
          fontFamily: "inherit",
          outline: "none",
        }}
      />
    </div>
  );
}

// ── LogoUpload ───────────────────────────────────────────────
function LogoUpload({
  value,
  onChange,
  label,
  hint,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  label: string;
  hint: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Maximum size is 2MB.");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.8,
          textTransform: "uppercase",
          display: "block",
          marginBottom: 6,
        }}
      >
        {label}
      </label>

      {value ? (
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: "10px 12px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* Preview row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 48,
                height: 36,
                borderRadius: 5,
                background: "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              <img
                src={value}
                alt="logo"
                style={{ maxHeight: 32, maxWidth: 44, objectFit: "contain" }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#E5E7EB", fontSize: 12, fontWeight: 600 }}>
                Logo uploaded
              </div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 1 }}>
                {hint}
              </div>
            </div>
          </div>
          {/* Action buttons row */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 5,
                padding: "6px 0",
                color: "rgba(255,255,255,0.65)",
                fontSize: 11,
                cursor: uploading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: uploading ? 0.5 : 1,
              }}
            >
              {uploading ? "Uploading…" : "Replace"}
            </button>
            <button
              onClick={() => onChange(null)}
              style={{
                flex: 1,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 5,
                padding: "6px 0",
                color: "#F87171",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "rgba(255,255,255,0.03)",
            border: "1.5px dashed rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "16px 12px",
            color: "rgba(255,255,255,0.35)",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            transition: "border-color 0.2s, background 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(217,119,6,0.45)";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(217,119,6,0.04)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{uploading ? "…" : "↑"}</span>
          <span>{uploading ? "Uploading…" : `Click to upload ${label.toLowerCase()}`}</span>
          <span style={{ fontSize: 10, opacity: 0.55 }}>{hint}</span>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: "none" }}
      />
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          color: "#D97706",
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 2.5,
          textTransform: "uppercase",
          marginBottom: 10,
          paddingBottom: 6,
          borderBottom: "1px solid rgba(217,119,6,0.18)",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Panel ────────────────────────────────────────────────────
export default function BrandingConfigPanel({ config, onChange, onSave }: Props) {
  const [saved, setSaved] = useState(false);

  const update = (partial: Partial<BrandingConfig>) => {
    onChange({ ...config, ...partial });
  };

  const handleSave = () => {
    onSave(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      style={{
        background: "rgba(8,10,24,0.97)",
        fontFamily: "'DM Sans', sans-serif",
        color: "#FFFFFF",
        boxSizing: "border-box",
      }}
    >

      {/* ── Scrollable body ── */}
      <div
        className="branding-panel-scroll"
        style={{
          padding: "20px",
          overflowY: "auto",
          maxHeight: 520,
          boxSizing: "border-box",
        }}
      >
        {/* LOGO */}
        <Section title="Your Logo">
          <LogoUpload
            value={config.logoUrl}
            onChange={(v) => update({ logoUrl: v })}
            label="Stream Logo"
            hint="PNG with transparency recommended · max 2MB"
          />
          <Toggle
            value={config.showLogo}
            onChange={(v) => update({ showLogo: v })}
            label="Show logo on stream"
            description="Top left corner"
          />
        </Section>

        {/* LIVE + MATCH TITLE */}
        <Section title="Top Bar">
          <Toggle
            value={config.showLiveBadge}
            onChange={(v) => update({ showLiveBadge: v })}
            label="LIVE badge"
            description="Pulsing red badge — top right"
          />
          <Toggle
            value={config.showMatchTitle}
            onChange={(v) => update({ showMatchTitle: v })}
            label="Match title"
            description="Tournament / match name — top centre"
          />
          {config.showMatchTitle && (
            <div style={{ marginTop: 10 }}>
              <TextInput
                value={config.matchTitle}
                onChange={(v) => update({ matchTitle: v })}
                label="Title text"
                placeholder="IPL 2026 · RCB vs MI"
              />
            </div>
          )}
        </Section>

        {/* SOCIAL */}
        <Section title="Social Handle">
          <Toggle
            value={config.showSocialHandle}
            onChange={(v) => update({ showSocialHandle: v })}
            label="Show social handle"
            description="Bottom left corner"
          />
          {config.showSocialHandle && (
            <div style={{ marginTop: 10 }}>
              <TextInput
                value={config.socialHandle}
                onChange={(v) => update({ socialHandle: v })}
                label="Handle"
                placeholder="@yourhandle"
              />
            </div>
          )}
        </Section>

        {/* SPONSOR */}
        <Section title="Sponsor Slot">
          <Toggle
            value={config.showSponsor}
            onChange={(v) => update({ showSponsor: v })}
            label="Show sponsor block"
            description="Bottom right corner"
          />
          {config.showSponsor && (
            <div style={{ marginTop: 10 }}>
              <TextInput
                value={config.sponsorLabel}
                onChange={(v) => update({ sponsorLabel: v })}
                label="Label text"
                placeholder="Powered by"
              />
              <LogoUpload
                value={config.sponsorLogoUrl}
                onChange={(v) => update({ sponsorLogoUrl: v })}
                label="Sponsor Logo"
                hint="PNG recommended · max 2MB"
              />
            </div>
          )}
        </Section>

        {/* ATMOSPHERE */}
        <Section title="Stream Atmosphere">
          <Toggle
            value={config.showVignette}
            onChange={(v) => update({ showVignette: v })}
            label="Corner vignette"
            description="Subtle dark framing on all four corners"
          />
          <Toggle
            value={config.showWatermark}
            onChange={(v) => update({ showWatermark: v })}
            label="Watermark"
            description="Faint tiled logo across the stream"
          />
        </Section>

      </div>

      <style>{`
        .branding-panel-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .branding-panel-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .branding-panel-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .branding-panel-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>

      {/* ── Footer — Reset + Save ── */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(8,10,24,0.98)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <button
          onClick={() => onChange(DEFAULT_BRANDING_CONFIG)}
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 7,
            padding: "8px 14px",
            color: "#F87171",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Reset to defaults
        </button>
        <button
          onClick={handleSave}
          style={{
            background: saved ? "rgba(5,150,105,0.12)" : "transparent",
            border: `1px solid ${saved ? "rgba(5,150,105,0.35)" : "rgba(255,255,255,0.15)"}`,
            borderRadius: 7,
            padding: "8px 18px",
            color: saved ? "#34D399" : "rgba(255,255,255,0.7)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.2s ease",
          }}
        >
          {saved ? "✓ Saved" : "Save & Apply"}
        </button>
      </div>
    </div>
  );
}
