import { cn } from "./cn";

/** Shimmer placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center", className)}>
      <i className="ri-loader-4-line animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Centered placeholder for empty lists and "nothing here yet" states. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-surface/60 text-center",
        compact ? "px-4 py-8" : "px-6 py-12",
        className,
      )}
    >
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-xl text-fg-subtle ring-1 ring-line">
        <i className={icon} aria-hidden />
      </span>
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const alertTones = {
  info: { wrap: "bg-primary-soft border-primary/20 text-primary-soft-fg", icon: "ri-information-line" },
  success: { wrap: "bg-success-soft border-success/20 text-success-soft-fg", icon: "ri-checkbox-circle-line" },
  warning: { wrap: "bg-warning-soft border-warning/25 text-warning-soft-fg", icon: "ri-alert-line" },
  danger: { wrap: "bg-danger-soft border-danger/20 text-danger-soft-fg", icon: "ri-error-warning-line" },
};

/** Inline contextual message (info/success/warning/danger). */
export function Alert({
  tone = "info",
  title,
  children,
  icon,
  action,
  className,
}: {
  tone?: keyof typeof alertTones;
  title?: React.ReactNode;
  children?: React.ReactNode;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const t = alertTones[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center",
        t.wrap,
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <i className={cn(icon ?? t.icon, "mt-0.5 text-lg leading-none")} aria-hidden />
        <div className="min-w-0 text-sm">
          {title && <p className="font-semibold">{title}</p>}
          {children && <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div>}
        </div>
      </div>
      {action && <div className="flex-shrink-0 sm:ml-2">{action}</div>}
    </div>
  );
}
