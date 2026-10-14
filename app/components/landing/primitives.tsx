import { cn } from "@/app/components/ui";
import { PLAY_STORE_URL } from "@/lib/site";
import { CheckIcon, PlayStoreIcon } from "./icons";

/** Small uppercase label with a rule — also used by the legal/contact pages. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted", className)}>
      <span className="h-[2px] w-5 bg-primary" aria-hidden />
      {children}
    </p>
  );
}

/** Landing section eyebrow: bold, wide-tracked, light blue. */
export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-[13px] font-extrabold uppercase tracking-[2px] text-accent-soft", className)}>{children}</span>
  );
}

/** Centered section heading used by most landing sections. */
export function SectionHead({
  kicker,
  title,
  lead,
  className,
}: {
  kicker: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-11 flex flex-col items-center gap-3.5 text-center", className)}>
      <Kicker>{kicker}</Kicker>
      <h2 className="m-0 font-display text-[clamp(2.4rem,5vw,3.6rem)] font-extrabold uppercase leading-none">{title}</h2>
      {lead && <p className="m-0 max-w-[560px] text-[17px] leading-relaxed text-fg-lead">{lead}</p>}
    </div>
  );
}

/** Max-width wrapper with the landing gutters. */
export function Section({
  id,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement> & { id?: string }) {
  return (
    <section id={id} className={cn("relative mx-auto max-w-[1200px] scroll-mt-24 px-6", className)} {...rest}>
      {children}
    </section>
  );
}

/** Rounded icon tile used on feature and audience cards. */
export function IconChip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary-soft text-accent-soft",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function CheckItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <CheckIcon className="shrink-0 text-accent" />
      {children}
    </span>
  );
}

export const gradientCta =
  "bg-[linear-gradient(115deg,#4A9EE0_0%,#3263B4_60%,#2E3A8C_100%)] text-white " +
  "shadow-[0_14px_34px_rgba(74,158,224,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] " +
  "transition-[transform,filter] duration-200 ease-out hover:brightness-110 active:scale-[0.98]";

export const ghostCta =
  "border border-line-accent bg-primary-soft/60 font-bold transition-colors hover:bg-primary-soft";

/** "Get it free on Google Play" pill. */
export function PlayStoreButton({ className }: { className?: string }) {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("inline-flex h-[60px] items-center gap-3 rounded-full pl-2.5 pr-[26px]", gradientCta, className)}
    >
      {/* White chip so the logo's blue segment doesn't melt into the blue gradient */}
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
        <PlayStoreIcon size={20} className="translate-x-px" />
      </span>
      <span className="flex flex-col items-start leading-[1.1]">
        <span className="text-[11px] font-semibold">Get it free on</span>
        <span className="text-[17px] font-extrabold">Google Play</span>
      </span>
    </a>
  );
}

/** Dark card surface shared by most landing tiles. */
export const card = "rounded-[28px] border border-line bg-surface";
