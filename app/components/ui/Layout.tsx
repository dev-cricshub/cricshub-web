import { cn } from "./cn";

/** Title row for an app page: heading, supporting text and actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-sm font-medium text-fg-muted">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-fg-muted sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Heading for a section within an app page. */
export function SectionTitle({
  title,
  count,
  description,
  icon,
  action,
  className,
  id,
}: {
  title: React.ReactNode;
  count?: number;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 id={id} className="flex items-center gap-2 text-base font-semibold tracking-tight text-fg sm:text-lg">
          {icon}
          {title}
          {count !== undefined && (
            <span className="rounded-full bg-surface-3 px-2 py-px text-xs font-medium tabular-nums text-fg-muted">
              {count}
            </span>
          )}
        </h2>
        {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/** Marketing section heading — eyebrow, title, lead paragraph. */
export function MarketingHeading({
  eyebrow,
  title,
  lead,
  align = "center",
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl", className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{title}</h2>
      {lead && <p className="mt-4 text-base leading-relaxed text-fg-muted sm:text-lg">{lead}</p>}
    </div>
  );
}

/** Compact metric tile. */
export function StatTile({
  label,
  value,
  icon,
  tone = "neutral",
  loading,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: string;
  tone?: "neutral" | "primary" | "live" | "warning" | "success";
  loading?: boolean;
  className?: string;
}) {
  const toneCls = {
    neutral: "text-fg-subtle",
    primary: "text-primary",
    live: "text-live",
    warning: "text-warning",
    success: "text-success",
  }[tone];
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-fg-muted sm:text-sm">{label}</p>
        {icon && <i className={cn(icon, "text-base", toneCls)} aria-hidden />}
      </div>
      {loading ? (
        <div className="skeleton mt-3 h-7 w-12" aria-hidden />
      ) : (
        <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight text-fg sm:text-3xl">{value}</p>
      )}
    </div>
  );
}
