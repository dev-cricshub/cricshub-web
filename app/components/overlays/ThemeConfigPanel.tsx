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
import { Badge, Button, Tabs, cn, controlClasses } from "@/app/components/ui";

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
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+6px)] left-0 z-50 whitespace-nowrap rounded-md bg-surface-inverse px-2 py-1 text-2xs text-fg-inverse shadow-pop animate-fade-in"
        >
          {text}
        </span>
      )}
    </span>
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
    <div className="mb-2 flex items-center gap-2">
      <h4 className="flex-1 text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{children}</h4>
      {badge}
    </div>
  );
}

// ── Colour swatch (native picker behind a token-framed swatch) ──
// The swatch fill is user data (the chosen overlay colour), so it stays inline.

function Swatch({
  value,
  pickerValue,
  onPick,
  label,
  modified,
  size = "md",
}: {
  value: string;
  pickerValue: string;
  onPick: (v: string) => void;
  label: string;
  modified?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <label
      className={cn(
        "relative flex-shrink-0 cursor-pointer rounded-md transition-shadow duration-150 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-surface",
        size === "sm" ? "h-5 w-5" : "h-7 w-7",
      )}
    >
      <span
        className={cn(
          "block h-full w-full rounded-md border shadow-xs",
          modified ? "border-warning ring-1 ring-warning/40" : "border-line-strong",
        )}
        style={{ background: value }}
        aria-hidden
      />
      <input
        type="color"
        value={pickerValue}
        onChange={(e) => onPick(e.target.value)}
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}

function ResetIcon({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Reset to default"
      aria-label={label}
      className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-sm text-warning transition-colors duration-150 hover:bg-warning-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <i className="ri-arrow-go-back-line" aria-hidden />
    </button>
  );
}

// ── Color row — compact single-line layout ──────────────────
// Layout: [label] [swatch] [hex input] [reset] — fits a 280px+ sidebar

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
    <div className="flex items-center gap-2 py-2">
      {/* Label */}
      <Tip text={desc}>
        <span
          tabIndex={0}
          className={cn(
            "w-[84px] flex-shrink-0 cursor-help truncate text-sm underline decoration-line-strong decoration-dotted underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            modified ? "font-medium text-fg" : "text-fg-muted",
          )}
        >
          {label}
        </span>
      </Tip>

      {/* Color swatch (native picker) */}
      <Swatch
        value={value}
        pickerValue={hex}
        modified={modified}
        label={`${label} colour`}
        onPick={(v) => {
          setLocalHex(v);
          onChange(v);
        }}
      />

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
        aria-label={`${label} hex value`}
        spellCheck={false}
        className={controlClasses(
          false,
          cn(
            "h-8 min-w-0 flex-1 px-2 font-mono text-xs uppercase",
            modified && "border-warning/60 text-warning-soft-fg",
          ),
        )}
      />

      {/* Reset — only takes space when modified */}
      <div className="flex w-7 flex-shrink-0 justify-center">
        {modified && (
          <ResetIcon
            label={`Reset ${label} to default`}
            onClick={() => {
              setLocalHex(defaultValue);
              onChange(defaultValue);
            }}
          />
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
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-lg border p-2 transition-colors duration-150",
        modified ? "border-warning/40 bg-warning-soft" : "border-line bg-surface-2",
      )}
    >
      {/* Badge preview — colours are the user's overlay data */}
      <Tip text={desc}>
        <span
          className={cn(
            "flex h-7 w-7 flex-shrink-0 cursor-help items-center justify-center rounded-md font-semibold",
            short.length > 1 ? "text-2xs" : "text-sm",
          )}
          style={{ background: value, color: textColor }}
          aria-hidden
        >
          {short}
        </span>
      </Tip>

      {/* Label */}
      <span className="min-w-0 flex-1 truncate text-xs text-fg-muted" title={desc}>
        {label}
      </span>

      {/* Reset */}
      {modified && <ResetIcon label={`Reset ${label} to default`} onClick={() => onChange(defaultValue)} />}

      {/* Swatch picker */}
      <Swatch
        value={value}
        pickerValue={toHex(value)}
        modified={modified}
        label={`${label} badge colour`}
        size="sm"
        onPick={onChange}
      />
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
  const name = tokenKey.replace(/-/g, " ");
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Swatch
        value={toHex(value)}
        pickerValue={toHex(value)}
        label={`${name} colour`}
        size="sm"
        onPick={onChange}
      />
      <span className="min-w-0 flex-1 truncate text-xs text-fg-muted" title={tokenKey}>
        {name}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${name} value`}
        spellCheck={false}
        className={controlClasses(false, "h-7 w-[84px] flex-shrink-0 px-2 font-mono text-2xs")}
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

  return (
    <div className="bg-surface text-fg">
      {/* ── Bundle tabs ── */}
      <div className="border-b border-line px-3 pb-3 pt-3 sm:px-4">
        <Tabs
          items={(Object.keys(BUNDLE_LABELS) as BundleId[]).map((id) => ({
            key: id,
            label: BUNDLE_LABELS[id],
          }))}
          value={activeBundle}
          onChange={setActiveBundle}
          size="sm"
          block
          ariaLabel="Overlay bundle"
        />

        {/* ── Description + reset bar ── */}
        <div className="mt-2.5 flex min-h-[28px] items-center justify-between gap-2">
          <span className="min-w-0 flex-1 truncate text-xs text-fg-muted">
            {BUNDLE_DESCRIPTIONS[activeBundle]}
          </span>
          {bundleHasOverrides && (
            <Button size="xs" variant="ghost" icon="ri-arrow-go-back-line" onClick={handleResetAll}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="max-h-[460px] overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:thin]">
        {/* Essential Colors */}
        <section className="px-3 pt-4 sm:px-4">
          <SectionLabel badge={<span className="text-2xs text-fg-subtle">Hover a label for info</span>}>
            Essential colours
          </SectionLabel>
          <div className="divide-y divide-line rounded-xl border border-line px-3">
            {MASTER_FIELDS.map((f) => (
              <ColorRow
                key={f.key}
                label={f.label}
                desc={f.desc}
                value={currentMaster[f.key]}
                defaultValue={DEFAULT_MASTER_COLORS[activeBundle][f.key]}
                onChange={(v) => handleMasterChange(f.key, v)}
              />
            ))}
          </div>
        </section>

        {/* Ball Badges */}
        <section className="px-3 pt-5 sm:px-4">
          <SectionLabel badge={<Badge size="xs">Auto contrast</Badge>}>Ball badges</SectionLabel>
          {/* 2-column grid — safe at 280px+ */}
          <div className="grid grid-cols-2 gap-1.5">
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
        </section>

        {/* Advanced mode toggle */}
        <section className="px-3 pb-4 pt-5 sm:px-4">
          <button
            type="button"
            onClick={() => setAdvOpen((v) => !v)}
            aria-expanded={advOpen}
            aria-controls="tcp-advanced"
            className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-3 text-sm font-medium text-fg-muted transition-colors duration-150 hover:bg-surface-3 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-center gap-2">
              <i className="ri-equalizer-line" aria-hidden />
              Advanced mode
            </span>
            <i
              className={cn("ri-arrow-down-s-line text-base transition-transform duration-200", advOpen && "rotate-180")}
              aria-hidden
            />
          </button>

          {/* Advanced: fine-tune tokens */}
          {advOpen && (
            <div id="tcp-advanced" className="mt-3 animate-fade-in">
              <p className="mb-2 text-xs leading-relaxed text-fg-subtle">
                Override individual derived tokens. These take precedence over the essential colours above.
              </p>
              {advEntries.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line-strong px-3 py-3 text-center text-xs text-fg-subtle">
                  No derived tokens yet. Adjust essential colours first.
                </p>
              ) : (
                <div className="divide-y divide-line">
                  {advEntries.map(([key, value]) => (
                    <AdvRow
                      key={key}
                      tokenKey={key}
                      value={value as string}
                      onChange={(v) => handleAdvChange(key, v)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ── Footer tip ── */}
      <div className="flex items-start gap-2 border-t border-line bg-surface-2 px-3 py-2.5 sm:px-4">
        <i className="ri-lightbulb-line mt-px text-sm text-fg-subtle" aria-hidden />
        <p className="text-xs leading-relaxed text-fg-subtle">
          Set the 6 essential colours. All dim variants, glows and shadows are auto-derived.
        </p>
      </div>
    </div>
  );
}
