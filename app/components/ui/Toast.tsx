"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cn } from "./cn";

export type ToastTone = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

type ShowToast = (title: string, opts?: { tone?: ToastTone; description?: string; duration?: number }) => void;

const ToastContext = createContext<ShowToast | null>(null);

const toneStyles: Record<ToastTone, { icon: string; color: string }> = {
  success: { icon: "ri-checkbox-circle-fill", color: "text-success" },
  error: { icon: "ri-error-warning-fill", color: "text-danger" },
  warning: { icon: "ri-alert-fill", color: "text-warning" },
  info: { icon: "ri-information-fill", color: "text-primary" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const show = useCallback<ShowToast>(
    (title, opts) => {
      const id = ++nextId.current;
      setToasts((t) => [...t.slice(-3), { id, title, tone: opts?.tone ?? "info", description: opts?.description }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), opts?.duration ?? 3500),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-[var(--tabbar-h,0px)] z-[400] flex flex-col items-center gap-2 p-4 pb-[max(1rem,calc(env(safe-area-inset-bottom)-var(--tabbar-h,0px)))] sm:items-end sm:p-6"
      >
        {toasts.map((t) => {
          const s = toneStyles[t.tone];
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-fg shadow-pop animate-toast-in"
            >
              <i className={cn(s.icon, s.color, "mt-px text-lg leading-none")} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs text-fg-muted">{t.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="-mr-1 flex h-6 w-6 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <i className="ri-close-line" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** Returns `toast(title, { tone, description })`. Falls back to a no-op outside the provider. */
export function useToast(): ShowToast {
  return useContext(ToastContext) ?? (() => {});
}
