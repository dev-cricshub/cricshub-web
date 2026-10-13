"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "./cn";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const sizes = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-2xl",
  "2xl": "sm:max-w-4xl",
  full: "sm:max-w-6xl",
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Icon tile shown beside the title */
  icon?: React.ReactNode;
  size?: keyof typeof sizes;
  footer?: React.ReactNode;
  /** Allow backdrop click / Escape to close. Defaults to true. */
  dismissible?: boolean;
  hideClose?: boolean;
  /** Renders as a bottom sheet on small screens. Defaults to true. */
  sheetOnMobile?: boolean;
  /** Body padding — set false for edge-to-edge content */
  padded?: boolean;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
  /** Accessible label when no visible title is rendered */
  ariaLabel?: string;
  /** Force a theme for this dialog (e.g. dark on the always-dark landing page) */
  theme?: "dark" | "light";
}

/**
 * Accessible dialog: portals into #app-portal (inside .app-shell so tokens apply),
 * traps focus, locks scroll, restores focus on close and closes on Escape.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  size = "md",
  footer,
  dismissible = true,
  hideClose,
  sheetOnMobile = true,
  padded = true,
  className,
  bodyClassName,
  children,
  ariaLabel,
  theme,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Focus first focusable element (or the panel) after paint
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const autofocus = panel.querySelector<HTMLElement>("[data-autofocus]");
      const first = autofocus ?? panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, dismissible]);

  if (!mounted || !open) return null;

  const target = document.getElementById("app-portal") ?? document.body;
  const hasHeader = title || !hideClose;

  return createPortal(
    <div
      data-theme={theme}
      className={cn(
        "fixed inset-0 z-[200] flex justify-center",
        sheetOnMobile ? "items-end sm:items-center sm:p-4" : "items-center p-4",
      )}
    >
      <div
        className="absolute inset-0 bg-[rgb(8_12_20/0.55)] backdrop-blur-[2px] animate-fade-in"
        onClick={() => dismissible && onClose()}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        aria-label={!title ? ariaLabel : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-surface text-fg shadow-overlay outline-none",
          sheetOnMobile
            ? "rounded-t-3xl animate-sheet-up sm:rounded-frame sm:animate-scale-in"
            : "rounded-frame animate-scale-in",
          sizes[size],
          className,
        )}
      >
        {sheetOnMobile && (
          <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-line-strong" />
          </div>
        )}
        {hasHeader && (
          <div className="flex flex-shrink-0 items-start gap-3 px-5 pb-1 pt-4 sm:px-6 sm:pt-5">
            {icon}
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id={titleId} className="text-lg font-semibold tracking-tight text-fg">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="mt-1 text-sm text-fg-muted">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1.5 -mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <i className="ri-close-line text-xl" aria-hidden />
              </button>
            )}
          </div>
        )}
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain",
            padded && "px-5 pb-5 pt-3 sm:px-6 sm:pb-6",
            bodyClassName,
          )}
        >
          {children}
        </div>
        {footer && (
          <div className="flex flex-shrink-0 flex-col-reverse gap-2 border-t border-line bg-surface-2/60 px-5 py-3.5 pb-safe sm:flex-row sm:items-center sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    target,
  );
}
