import { cn } from "@/app/components/ui";
import { PLAY_STORE_URL } from "@/lib/site";
import { CheckIcon } from "./icons";

/** Small uppercase label with a rule — also used by the legal/contact pages. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted", className)}>
      <span className="h-[2px] w-5 bg-primary" aria-hidden />
      {children}
    </p>
  );
}

/** Glass theme accent (see app/styles/glass.css). */
export const ACCENT = "#5AA9F0";

/** Landing section eyebrow: wide-tracked, accent blue. */
export function Kicker({ children, className, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("text-[13px] font-semibold uppercase tracking-[0.1em] text-[#5AA9F0]", className)} {...rest}>
      {children}
    </span>
  );
}

export const h2 = "m-0 font-display text-[clamp(2.75rem,6vw,4rem)] font-bold uppercase leading-[0.95] text-white";
export const lead = "m-0 text-[17px] leading-relaxed text-[#D6E2F5]";
export const body = "m-0 text-[15px] leading-relaxed text-[#C3CEE0]";

/** Left-aligned section heading used by most landing sections. */
export function SectionHead({
  kicker,
  title,
  lead: leadText,
  gap = "gap-3.5",
  className,
}: {
  kicker: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** Vertical rhythm between kicker, title and lead. */
  gap?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", gap, className)} data-anim-stagger="90">
      <Kicker data-anim="up">{kicker}</Kicker>
      <h2 className={h2} data-anim="up">
        {title}
      </h2>
      {leadText && (
        <p className={cn(lead, "max-w-[560px]")} data-anim="up">
          {leadText}
        </p>
      )}
    </div>
  );
}

/** Landing section; the page container supplies width and gutters. */
export function Section({
  id,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement> & { id?: string }) {
  return (
    <section id={id} className={cn("relative scroll-mt-28", className)} {...rest}>
      {children}
    </section>
  );
}

/** Frosted tile: the base surface for every landing card. */
export const tile = "ch-gl ch-tile";

// cn() only joins classes (no Tailwind conflict resolution), so CTA sizes are picked here, not overridden.
const ctaSize = {
  lg: "min-h-14 rounded-2xl px-6 text-base",
  md: "min-h-[52px] rounded-[14px] px-[22px] text-[15px]",
};
type CtaSize = keyof typeof ctaSize;

/** Accent-filled CTA with the moving shine. */
export const primaryCta = (size: CtaSize = "lg") =>
  `ch-btn inline-flex items-center justify-center gap-2.5 bg-[#5AA9F0] font-semibold text-[#060A14] ${ctaSize[size]}`;

/** Frosted secondary CTA. */
export const ghostCta = (size: CtaSize = "lg") =>
  `ch-gl inline-flex items-center justify-center border border-white/20 bg-white/[0.08] font-semibold text-white transition-colors hover:bg-white/[0.14] ${ctaSize[size]}`;

export function CheckItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <CheckIcon size={16} strokeWidth={2.4} className="shrink-0 text-[#5AA9F0]" />
      {children}
    </span>
  );
}

/** "Get it free on Google Play" CTA. */
export function PlayStoreButton({ className, withIcon = true }: { className?: string; withIcon?: boolean }) {
  return (
    <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={cn(primaryCta(), className)}>
      {withIcon && (
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 2.5v19l10-9.5L4 2.5Zm11.5 8 2.7-2.6L6.5 1.6l9 8.9Zm0 3-9 8.9 11.7-6.3-2.7-2.6Zm4.3-4.1L17 11l-1.3 1L17 13l2.8 1.6c.9-.5.9-1.7 0-2.2Z" />
        </svg>
      )}
      Get it free on Google Play
    </a>
  );
}
