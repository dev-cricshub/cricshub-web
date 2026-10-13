"use client";

import { forwardRef, useId } from "react";
import { cn } from "./cn";

const control =
  "w-full rounded-lg border bg-surface text-sm text-fg placeholder:text-fg-subtle shadow-xs " +
  "transition-[border-color,box-shadow] duration-150 ease-out " +
  "focus:outline-none focus:border-primary focus:shadow-focus " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70";

export const controlClasses = (invalid?: boolean, className?: string) =>
  cn(control, invalid ? "border-danger focus:border-danger" : "border-line-strong hover:border-fg-subtle", className);

/** Label + control + hint/error, with ids wired for screen readers. */
export function Field({
  label,
  hint,
  error,
  required,
  optional,
  className,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="flex items-center gap-1 text-sm font-medium text-fg">
        {label}
        {required && <span className="text-danger" aria-hidden>*</span>}
        {optional && <span className="font-normal text-fg-subtle">(optional)</span>}
      </label>
      {children({ id, describedBy, invalid: !!error })}
      {error ? (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-xs font-medium text-danger animate-fade-in">
          <i className="ri-error-warning-fill" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  /** Remix icon shown inside the left edge */
  icon?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, icon, className, ...rest },
  ref,
) {
  if (icon) {
    return (
      <div className="relative">
        <i
          className={cn(icon, "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-fg-subtle")}
          aria-hidden
        />
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className={controlClasses(invalid, cn("h-10 pl-9 pr-3", className))}
          {...rest}
        />
      </div>
    );
  }
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={controlClasses(invalid, cn("h-10 px-3", className))}
      {...rest}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ invalid, className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={controlClasses(invalid, cn("min-h-[120px] resize-y px-3 py-2.5 leading-relaxed", className))}
      {...rest}
    />
  );
});

/** Accessible switch. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const btn = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-line-strong",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow-raised transition-transform duration-200 ease-spring",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
  if (!label) return <span className={className}>{btn}</span>;
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium text-fg">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-fg-muted">{description}</span>}
      </label>
      {btn}
    </div>
  );
}

/** Styled checkbox with label. */
export function Checkbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("group inline-flex cursor-pointer select-none items-center gap-2.5", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors duration-150",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface",
          checked ? "border-primary bg-primary text-primary-fg" : "border-line-strong bg-surface group-hover:border-fg-subtle",
        )}
        aria-hidden
      >
        {checked && <i className="ri-check-line text-xs leading-none animate-pop" />}
      </span>
      <span className="text-sm text-fg-muted transition-colors group-hover:text-fg">{label}</span>
    </label>
  );
}
