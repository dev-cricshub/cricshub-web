"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "./cn";

export interface TabItem<K extends string> {
  key: K;
  label: React.ReactNode;
  icon?: string;
  count?: number;
  disabled?: boolean;
}

/**
 * Segmented tab control with a sliding indicator. Arrow keys move between tabs.
 * Pass `idPrefix` and render panels with id `${idPrefix}-panel-${key}` for full ARIA wiring.
 */
export function Tabs<K extends string>({
  items,
  value,
  onChange,
  size = "md",
  block,
  idPrefix,
  className,
  ariaLabel,
}: {
  items: TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  size?: "sm" | "md";
  block?: boolean;
  idPrefix?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const el = list.querySelector<HTMLElement>(`[data-key="${value}"]`);
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [value, items.length]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const enabled = items.filter((i) => !i.disabled);
    const idx = enabled.findIndex((i) => i.key === value);
    const next = enabled[(idx + (e.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length];
    onChange(next.key);
    listRef.current?.querySelector<HTMLElement>(`[data-key="${next.key}"]`)?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        "relative isolate flex rounded-xl border border-line bg-surface-2 p-1",
        block ? "w-full" : "w-fit max-w-full overflow-x-auto scrollbar-none",
        className,
      )}
    >
      {indicator && (
        <span
          aria-hidden
          className="absolute inset-y-1 -z-10 rounded-lg bg-surface shadow-card ring-1 ring-line transition-[left,width] duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            data-key={item.key}
            type="button"
            role="tab"
            id={idPrefix ? `${idPrefix}-tab-${item.key}` : undefined}
            aria-controls={idPrefix ? `${idPrefix}-panel-${item.key}` : undefined}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.key)}
            className={cn(
              "relative flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm",
              block && "flex-1",
              active ? "text-fg" : "text-fg-muted hover:text-fg",
            )}
          >
            {item.icon && <i className={cn(item.icon, "text-[1.05em]")} aria-hidden />}
            <span className="truncate">{item.label}</span>
            {item.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-2xs font-semibold tabular-nums transition-colors",
                  active ? "bg-primary-soft text-primary-soft-fg" : "bg-surface-3 text-fg-subtle",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
