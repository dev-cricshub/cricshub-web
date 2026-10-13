import { cn } from "./cn";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger" | "live" | "outline";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-fg-muted ring-line",
  primary: "bg-primary-soft text-primary-soft-fg ring-primary/20",
  success: "bg-success-soft text-success-soft-fg ring-success/20",
  warning: "bg-warning-soft text-warning-soft-fg ring-warning/25",
  danger: "bg-danger-soft text-danger-soft-fg ring-danger/20",
  live: "bg-live text-white ring-live",
  outline: "bg-transparent text-fg-muted ring-line-strong",
};

export function Badge({
  tone = "neutral",
  icon,
  size = "sm",
  className,
  children,
}: {
  tone?: BadgeTone;
  icon?: string;
  size?: "xs" | "sm";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium ring-1 ring-inset",
        size === "xs" ? "px-1.5 py-px text-2xs" : "px-2 py-0.5 text-xs",
        tones[tone],
        className,
      )}
    >
      {icon && <i className={cn(icon, "text-[1.05em] leading-none")} aria-hidden />}
      {children}
    </span>
  );
}

/** Pulsing dot used for anything currently live/streaming. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)} aria-hidden>
      <span className="absolute inset-0 rounded-full bg-current animate-live-ping" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
    </span>
  );
}

export function LiveBadge({ label = "Live", className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-live px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-white",
        className,
      )}
    >
      <LiveDot />
      {label}
    </span>
  );
}
