import { cn } from "./cn";

type CardProps = React.HTMLAttributes<HTMLElement> & {
  /** Adds hover lift + border emphasis for clickable cards */
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  as?: "div" | "section" | "article" | "li";
};

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function Card({
  interactive,
  padding = "md",
  as = "div",
  className,
  ...rest
}: CardProps) {
  const Tag = as as "div";
  return (
    <Tag
      {...(rest as React.HTMLAttributes<HTMLDivElement>)}
      className={cn(
        "rounded-card border border-line bg-surface shadow-card",
        interactive &&
          "transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-raised",
        paddings[padding],
        className,
      )}
    />
  );
}

export function CardHeader({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && <IconTile icon={icon} />}
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-fg">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

const tileTones = {
  primary: "bg-primary-soft text-primary-soft-fg",
  success: "bg-success-soft text-success-soft-fg",
  warning: "bg-warning-soft text-warning-soft-fg",
  danger: "bg-danger-soft text-danger-soft-fg",
  neutral: "bg-surface-2 text-fg-muted",
};

/** Square tinted icon container used in card headers, stats and lists. */
export function IconTile({
  icon,
  tone = "primary",
  size = "md",
  className,
}: {
  icon: string;
  tone?: keyof typeof tileTones;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const s =
    size === "sm" ? "h-8 w-8 rounded-lg text-base" : size === "lg" ? "h-12 w-12 rounded-xl text-2xl" : "h-10 w-10 rounded-xl text-lg";
  return (
    <span className={cn("inline-flex flex-shrink-0 items-center justify-center", s, tileTones[tone], className)}>
      <i className={icon} aria-hidden />
    </span>
  );
}
