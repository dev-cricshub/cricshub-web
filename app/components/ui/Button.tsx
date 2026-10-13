import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "./cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "inverse"
  | "live";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-fg shadow-xs hover:bg-primary-hover",
  secondary: "bg-surface-2 text-fg hover:bg-surface-3",
  outline: "border border-line-strong bg-surface text-fg shadow-xs hover:border-fg-subtle hover:bg-surface-2",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
  danger: "bg-danger text-white shadow-xs hover:bg-danger/90",
  inverse: "bg-surface-inverse text-fg-inverse shadow-xs hover:bg-surface-inverse/90",
  live: "bg-live text-white shadow-xs hover:bg-live/90",
};

const sizes: Record<ButtonSize, string> = {
  xs: "h-7 rounded-md px-2.5 text-xs",
  sm: "h-8 rounded-lg px-3 text-sm",
  md: "h-10 rounded-lg px-4 text-sm",
  lg: "h-12 rounded-xl px-6 text-base",
};

const iconOnlySizes: Record<ButtonSize, string> = {
  xs: "h-7 w-7 rounded-md text-sm",
  sm: "h-8 w-8 rounded-lg text-base",
  md: "h-10 w-10 rounded-lg text-lg",
  lg: "h-12 w-12 rounded-xl text-xl",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  iconOnly = false,
  block = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  block?: boolean;
  className?: string;
} = {}) {
  return cn(
    base,
    variants[variant],
    iconOnly ? iconOnlySizes[size] : sizes[size],
    block && "w-full",
    className,
  );
}

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Remix icon class, e.g. "ri-arrow-right-line" */
  icon?: string;
  /** Icon rendered after the label */
  trailingIcon?: string;
  loading?: boolean;
  block?: boolean;
  /** Square button with only an icon — requires aria-label */
  iconOnly?: boolean;
}

export type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

function Content({
  icon,
  trailingIcon,
  loading,
  children,
}: Pick<CommonProps, "icon" | "trailingIcon" | "loading"> & { children?: React.ReactNode }) {
  return (
    <>
      {loading ? (
        <i className="ri-loader-4-line animate-spin text-[1.1em] leading-none" aria-hidden />
      ) : icon ? (
        <i className={cn(icon, "text-[1.1em] leading-none")} aria-hidden />
      ) : null}
      {children}
      {trailingIcon && !loading && (
        <i className={cn(trailingIcon, "text-[1.1em] leading-none")} aria-hidden />
      )}
    </>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant,
    size,
    icon,
    trailingIcon,
    loading,
    block,
    iconOnly,
    className,
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, iconOnly, block, className })}
      {...rest}
    >
      <Content icon={icon} trailingIcon={trailingIcon} loading={loading}>
        {children}
      </Content>
    </button>
  );
});

export type ButtonLinkProps = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
    external?: boolean;
  };

/** Link styled as a button. Uses next/link for internal routes. */
export function ButtonLink({
  variant,
  size,
  icon,
  trailingIcon,
  block,
  iconOnly,
  className,
  children,
  href,
  external,
  loading,
  ...rest
}: ButtonLinkProps) {
  const cls = buttonClasses({ variant, size, iconOnly, block, className });
  const content = (
    <Content icon={icon} trailingIcon={trailingIcon} loading={loading}>
      {children}
    </Content>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {content}
    </Link>
  );
}
