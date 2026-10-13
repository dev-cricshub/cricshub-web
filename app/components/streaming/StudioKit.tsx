"use client";

import { useId, useState } from "react";
import { Badge, IconTile, cn } from "@/app/components/ui";
import type { BadgeTone } from "@/app/components/ui";

// ═══════════════════════════════════════════════════════════
// Stream Studio kit — small presentation helpers shared by the
// OBS / vMix control panels and the overlay config panels.
// ═══════════════════════════════════════════════════════════

/** Collapsible card used for each control group in the studio sidebar. */
export function ControlSection({
  title,
  icon,
  badge,
  badgeTone = "neutral",
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: string;
  badge?: string;
  badgeTone?: BadgeTone;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className="flex min-w-0 items-center gap-3">
          <IconTile icon={icon} size="sm" tone="neutral" />
          <span className="truncate text-sm font-semibold tracking-tight text-fg">{title}</span>
          {badge && (
            <Badge tone={badgeTone} size="xs">
              {badge}
            </Badge>
          )}
        </span>
        <i
          className={cn(
            "ri-arrow-down-s-line text-lg text-fg-subtle transition-transform duration-200 ease-out",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div id={bodyId} className="space-y-5 border-t border-line px-4 pb-4 pt-4 animate-fade-in">
          {children}
        </div>
      )}
    </section>
  );
}

/** Small uppercase label above a group of controls. */
export function SubLabel({
  icon,
  children,
  action,
  className,
}: {
  icon?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2 flex items-center justify-between gap-2", className)}>
      <p className="flex min-w-0 items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
        {icon && <i className={cn(icon, "text-xs")} aria-hidden />}
        <span className="truncate">{children}</span>
      </p>
      {action}
    </div>
  );
}

/** Muted helper text under a control group. */
export function Hint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs leading-relaxed text-fg-subtle", className)}>{children}</p>;
}

/**
 * Classes for a pressable/toggle-style control (segmented buttons, scene
 * buttons, transition picker…). Pair with `aria-pressed`.
 */
export function pressClasses(active: boolean, tone: "primary" | "live" = "primary", className?: string) {
  return cn(
    "inline-flex min-h-[40px] select-none items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    "disabled:pointer-events-none disabled:opacity-50",
    active
      ? tone === "live"
        ? "border-live bg-live text-white shadow-xs"
        : "border-primary bg-primary text-primary-fg shadow-xs"
      : "border-line-strong bg-surface text-fg-muted hover:border-fg-subtle hover:bg-surface-2 hover:text-fg",
    className,
  );
}

/** Token-styled range input with a filled track. */
export function RangeSlider({
  value,
  min,
  max,
  step,
  onChange,
  ariaLabel,
  ariaValueText,
  className,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number, raw: string) => void;
  ariaLabel: string;
  ariaValueText?: string;
  className?: string;
}) {
  const pct = max === min ? 0 : Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      aria-valuetext={ariaValueText}
      onChange={(e) => onChange(parseFloat(e.target.value), e.target.value)}
      style={{
        background: `linear-gradient(to right, rgb(var(--primary)) ${pct}%, rgb(var(--surface-3)) ${pct}%)`,
      }}
      className={cn(
        "h-1.5 w-full min-w-0 flex-1 cursor-pointer appearance-none rounded-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
        "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:shadow-raised",
        "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2",
        "[&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-surface",
        className,
      )}
    />
  );
}

/** Status strip shown while something is on air / recording / active. */
export function StatusStrip({
  tone,
  label,
  meta,
  pulse = true,
}: {
  tone: "live" | "warning" | "primary" | "success";
  label: string;
  meta?: React.ReactNode;
  pulse?: boolean;
}) {
  const toneCls = {
    live: "border-live/25 bg-live/10 text-live",
    warning: "border-warning/25 bg-warning-soft text-warning-soft-fg",
    primary: "border-primary/20 bg-primary-soft text-primary-soft-fg",
    success: "border-success/20 bg-success-soft text-success-soft-fg",
  }[tone];
  return (
    <div
      role="status"
      className={cn("flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border px-3", toneCls)}
    >
      <span className="relative inline-flex h-2 w-2 flex-shrink-0" aria-hidden>
        {pulse && <span className="absolute inset-0 rounded-full bg-current animate-live-ping" />}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      <span className="truncate text-xs font-semibold uppercase tracking-wider">{label}</span>
      {meta != null && <span className="ml-auto font-mono text-xs tabular-nums opacity-90">{meta}</span>}
    </div>
  );
}

/** Row container for list items (sources, audio channels, assets…). */
export const rowClasses = "rounded-xl border border-line bg-surface-2 px-3 py-2.5";

/** Native select styled like the shared Input, sized for the studio. */
export const selectClasses = "h-10 px-3 pr-8";
