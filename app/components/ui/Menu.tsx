"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "./cn";

export type MenuEntry =
  | { type?: "item"; label: string; icon?: string; href?: string; onSelect?: () => void; tone?: "danger" }
  | { type: "separator" }
  | { type: "label"; label: React.ReactNode };

/**
 * Dropdown menu with keyboard support (arrows, Home/End, Escape) and click-outside.
 * `trigger` receives props to spread onto a button.
 */
export function Menu({
  trigger,
  items,
  align = "end",
  className,
}: {
  trigger: (props: {
    ref: React.Ref<HTMLButtonElement>;
    onClick: () => void;
    "aria-haspopup": "menu";
    "aria-expanded": boolean;
    "aria-controls": string;
  }) => React.ReactNode;
  items: MenuEntry[];
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    const els = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const i = els.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (e.key === "ArrowDown") next = (i + 1) % els.length;
    else if (e.key === "ArrowUp") next = (i - 1 + els.length) % els.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = els.length - 1;
    else if (e.key === "Tab") setOpen(false);
    if (next >= 0) {
      e.preventDefault();
      els[next]?.focus();
    }
  };

  const itemCls = (tone?: "danger") =>
    cn(
      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm outline-none transition-colors",
      tone === "danger"
        ? "text-danger hover:bg-danger-soft focus:bg-danger-soft"
        : "text-fg hover:bg-surface-2 focus:bg-surface-2",
    );

  return (
    <div className={cn("relative", className)}>
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen((o) => !o),
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": id,
      })}
      {open && (
        <div
          ref={menuRef}
          id={id}
          role="menu"
          onKeyDown={onMenuKey}
          className={cn(
            "absolute top-full z-50 mt-2 min-w-[13rem] origin-top rounded-xl border border-line bg-surface p-1.5 shadow-pop animate-scale-in",
            align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left",
          )}
        >
          {items.map((item, idx) => {
            if (item.type === "separator") return <div key={idx} className="my-1 h-px bg-line" role="separator" />;
            if (item.type === "label")
              return (
                <div key={idx} className="px-2.5 pb-1.5 pt-1">
                  {item.label}
                </div>
              );
            const inner = (
              <>
                {item.icon && <i className={cn(item.icon, "text-base text-fg-subtle", item.tone === "danger" && "text-danger")} aria-hidden />}
                {item.label}
              </>
            );
            return item.href ? (
              <Link
                key={idx}
                href={item.href}
                role="menuitem"
                tabIndex={-1}
                className={itemCls(item.tone)}
                onClick={() => setOpen(false)}
              >
                {inner}
              </Link>
            ) : (
              <button
                key={idx}
                type="button"
                role="menuitem"
                tabIndex={-1}
                className={itemCls(item.tone)}
                onClick={() => {
                  setOpen(false);
                  item.onSelect?.();
                }}
              >
                {inner}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
