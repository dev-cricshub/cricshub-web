// Button styles from the web app designs (Home, auction admin). Plain class strings so they work on
// links, buttons and spans alike.

export const primaryBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-[11px] bg-[#2F6DB8] px-4 text-[13px] font-bold text-white shadow-[0_6px_16px_rgba(47,109,184,0.3)] transition-colors hover:bg-[#3A7BC8] disabled:pointer-events-none disabled:opacity-40";

export const secondaryBtn =
  "inline-flex h-10 flex-shrink-0 items-center justify-center gap-2 rounded-[11px] border border-line bg-well px-3.5 text-[13px] font-semibold text-fg transition-colors hover:border-line-strong disabled:pointer-events-none disabled:opacity-40";

/** Tinted call-to-action used inside cards (e.g. "Add teams" on a checklist row). */
export const softBtn =
  "inline-flex h-[34px] flex-shrink-0 items-center justify-center gap-1.5 rounded-[9px] border border-line-accent bg-raised px-3.5 text-[13px] font-semibold text-primary-soft-fg transition-colors hover:border-accent/60 disabled:pointer-events-none disabled:opacity-40";
