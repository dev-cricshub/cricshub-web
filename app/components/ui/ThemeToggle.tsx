"use client";

import { useEffect, useState } from "react";
import { cn } from "./cn";

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** Light/dark switch. Persists to localStorage("ch-theme"); applied pre-paint in app/layout.tsx. */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => setTheme(readTheme()), []);

  const toggle = () => {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("ch-theme", next);
    } catch {}
    setTheme(next);
  };

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <i
        className={cn(
          "ri-sun-line absolute text-lg transition-all duration-300 ease-out",
          isDark ? "translate-y-0 rotate-0 opacity-100" : "translate-y-5 rotate-90 opacity-0",
        )}
        aria-hidden
      />
      <i
        className={cn(
          "ri-moon-line absolute text-lg transition-all duration-300 ease-out",
          isDark ? "-translate-y-5 -rotate-90 opacity-0" : "translate-y-0 rotate-0 opacity-100",
        )}
        aria-hidden
      />
    </button>
  );
}
