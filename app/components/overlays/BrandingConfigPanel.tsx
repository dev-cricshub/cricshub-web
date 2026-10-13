"use client";

import { useState, useRef } from "react";
import { BrandingConfig, DEFAULT_BRANDING_CONFIG } from "../../overlays/premium/matchAddOn/BrandingOverlay";
import { uploadFile } from "../../../lib/api";
import { Button, Field, Input, Switch, cn } from "@/app/components/ui";

// ═══════════════════════════════════════════════════════════
// BRANDING CONFIG PANEL
// Shown in stream dashboard when tpl-pro-4 is active
// ═══════════════════════════════════════════════════════════

interface Props {
  config: BrandingConfig;
  onChange: (config: BrandingConfig) => void;
  onSave: (config: BrandingConfig) => void;
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
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-fg">{label}</p>

      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-2.5">
          <div className="flex h-10 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={`${label} preview`} className="max-h-8 max-w-[48px] object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">Logo uploaded</p>
            <p className="truncate text-xs text-fg-subtle">{hint}</p>
          </div>
          <div className="flex flex-shrink-0 gap-1">
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              icon="ri-upload-2-line"
              loading={uploading}
              aria-label={`Replace ${label.toLowerCase()}`}
              title="Replace"
              onClick={() => fileRef.current?.click()}
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={`Remove ${label.toLowerCase()}`}
              title="Remove"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-base text-fg-muted transition-colors duration-150 hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <i className="ri-delete-bin-line" aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center gap-1 rounded-xl border border-dashed border-line-strong bg-surface-2 px-3 py-4 text-center transition-colors duration-150 hover:border-primary hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          <i
            className={cn(
              uploading ? "ri-loader-4-line animate-spin" : "ri-upload-cloud-2-line",
              "text-xl text-fg-subtle",
            )}
            aria-hidden
          />
          <span className="text-sm font-medium text-fg">
            {uploading ? "Uploading…" : `Upload ${label.toLowerCase()}`}
          </span>
          <span className="text-xs text-fg-subtle">{hint}</span>
        </button>
      )}

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-b border-line pb-5 last:border-b-0 last:pb-0">
      <h4 className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
        <i className={cn(icon, "text-xs")} aria-hidden />
        {title}
      </h4>
      {children}
    </section>
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
    <div className="bg-surface text-fg">
      {/* ── Scrollable body ── */}
      <div className="max-h-[520px] space-y-5 overflow-y-auto overscroll-contain p-4 [scrollbar-width:thin] sm:p-5">
        {/* LOGO */}
        <Section title="Your logo" icon="ri-image-line">
          <LogoUpload
            value={config.logoUrl}
            onChange={(v) => update({ logoUrl: v })}
            label="Stream logo"
            hint="PNG with transparency recommended · max 2MB"
          />
          <Switch
            checked={config.showLogo}
            onChange={(v) => update({ showLogo: v })}
            label="Show logo on stream"
            description="Top left corner"
          />
        </Section>

        {/* LIVE + MATCH TITLE */}
        <Section title="Top bar" icon="ri-layout-top-line">
          <Switch
            checked={config.showLiveBadge}
            onChange={(v) => update({ showLiveBadge: v })}
            label="LIVE badge"
            description="Pulsing red badge, top right"
          />
          <Switch
            checked={config.showMatchTitle}
            onChange={(v) => update({ showMatchTitle: v })}
            label="Match title"
            description="Tournament / match name, top centre"
          />
          {config.showMatchTitle && (
            <Field label="Title text" className="animate-fade-in">
              {({ id }) => (
                <Input
                  id={id}
                  type="text"
                  value={config.matchTitle}
                  onChange={(e) => update({ matchTitle: e.target.value })}
                  placeholder="IPL 2026 · RCB vs MI"
                />
              )}
            </Field>
          )}
        </Section>

        {/* SOCIAL */}
        <Section title="Social handle" icon="ri-at-line">
          <Switch
            checked={config.showSocialHandle}
            onChange={(v) => update({ showSocialHandle: v })}
            label="Show social handle"
            description="Bottom left corner"
          />
          {config.showSocialHandle && (
            <Field label="Handle" className="animate-fade-in">
              {({ id }) => (
                <Input
                  id={id}
                  type="text"
                  value={config.socialHandle}
                  onChange={(e) => update({ socialHandle: e.target.value })}
                  placeholder="@yourhandle"
                />
              )}
            </Field>
          )}
        </Section>

        {/* SPONSOR */}
        <Section title="Sponsor slot" icon="ri-hand-heart-line">
          <Switch
            checked={config.showSponsor}
            onChange={(v) => update({ showSponsor: v })}
            label="Show sponsor block"
            description="Bottom right corner"
          />
          {config.showSponsor && (
            <div className="space-y-3 animate-fade-in">
              <Field label="Label text">
                {({ id }) => (
                  <Input
                    id={id}
                    type="text"
                    value={config.sponsorLabel}
                    onChange={(e) => update({ sponsorLabel: e.target.value })}
                    placeholder="Powered by"
                  />
                )}
              </Field>
              <LogoUpload
                value={config.sponsorLogoUrl}
                onChange={(v) => update({ sponsorLogoUrl: v })}
                label="Sponsor logo"
                hint="PNG recommended · max 2MB"
              />
            </div>
          )}
        </Section>

        {/* ATMOSPHERE */}
        <Section title="Stream atmosphere" icon="ri-contrast-2-line">
          <Switch
            checked={config.showVignette}
            onChange={(v) => update({ showVignette: v })}
            label="Corner vignette"
            description="Subtle dark framing on all four corners"
          />
          <Switch
            checked={config.showWatermark}
            onChange={(v) => update({ showWatermark: v })}
            label="Watermark"
            description="Faint tiled logo across the stream"
          />
        </Section>
      </div>

      {/* ── Footer — Reset + Save ── */}
      <div className="flex items-center justify-between gap-2 border-t border-line bg-surface-2 px-4 py-3 sm:px-5">
        <Button variant="ghost" size="sm" icon="ri-restart-line" onClick={() => onChange(DEFAULT_BRANDING_CONFIG)}>
          Reset to defaults
        </Button>
        <Button
          variant={saved ? "secondary" : "primary"}
          size="sm"
          icon={saved ? "ri-check-line" : "ri-save-line"}
          onClick={handleSave}
        >
          {saved ? "Saved" : "Save & apply"}
        </Button>
        <span aria-live="polite" className="sr-only">
          {saved ? "Branding saved" : ""}
        </span>
      </div>
    </div>
  );
}
