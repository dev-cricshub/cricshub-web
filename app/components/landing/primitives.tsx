import { cn } from "@/app/components/ui";

/** Marks simulated content so visitors never mistake it for live data. */
export function DemoTag({ className, label = "Demo data" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-0.5 text-2xs font-semibold uppercase tracking-[0.14em] text-fg-muted",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
      {label}
    </span>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted", className)}>
      <span className="h-[2px] w-5 bg-primary" aria-hidden />
      {children}
    </p>
  );
}

/** Editorial section heading: condensed display headline + supporting copy. */
export function LandingHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
  id,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl", className)}>
      {eyebrow && <Eyebrow className={cn("mb-5", align === "center" && "justify-center")}>{eyebrow}</Eyebrow>}
      <h2
        id={id}
        className="font-display text-display-lg font-bold uppercase text-fg"
      >
        {title}
      </h2>
      {lead && <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">{lead}</p>}
    </div>
  );
}

/** Solid product frame — the container for every interactive demo on the page. */
export function Panel({
  className,
  children,
  as: Tag = "div",
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { as?: "div" | "section" | "article" }) {
  return (
    <Tag
      className={cn(
        "rounded-frame border border-line bg-surface shadow-frame",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Small realistic cricket ball (SVG). */
export function CricketBall({ size = 64, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <defs>
        <radialGradient id="ball-body" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ff6b5c" />
          <stop offset="45%" stopColor="#c0221a" />
          <stop offset="100%" stopColor="#4a0906" />
        </radialGradient>
        <radialGradient id="ball-shine" cx="32%" cy="26%" r="30%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#ball-body)" />
      <path d="M22 16 C 42 36, 42 64, 22 84" stroke="#f3e3c3" strokeWidth="2.2" fill="none" opacity="0.9" />
      <path d="M28 12 C 50 34, 50 66, 28 88" stroke="#f3e3c3" strokeWidth="2.2" fill="none" opacity="0.9" />
      {Array.from({ length: 9 }).map((_, i) => {
        const t = 0.12 + i * 0.095;
        const y = 14 + t * 72;
        const x = 25 + Math.sin(t * Math.PI) * 21;
        return <line key={i} x1={x - 4} y1={y} x2={x + 4} y2={y} stroke="#f3e3c3" strokeWidth="1.2" opacity="0.7" />;
      })}
      <circle cx="50" cy="50" r="46" fill="url(#ball-shine)" />
    </svg>
  );
}

export const ctaPrimary =
  "group relative inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-control bg-primary px-6 text-[15px] font-semibold text-primary-fg " +
  "shadow-[inset_0_1px_0_rgb(255_255_255/0.14)] transition-[background-color,transform] duration-150 ease-out " +
  "hover:bg-primary-hover active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

export const ctaSecondary =
  "group inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-control border border-line-strong px-6 text-[15px] font-medium text-fg " +
  "transition-[background-color,border-color,transform] duration-150 ease-out hover:border-fg-subtle hover:bg-surface-2 active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

/** Arrow that nudges right on parent hover. */
export function CtaArrow({ icon = "ri-arrow-right-line" }: { icon?: string }) {
  return <i className={cn(icon, "text-lg transition-transform duration-200 ease-out group-hover:translate-x-1")} aria-hidden />;
}
