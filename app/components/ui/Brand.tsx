import Image from "next/image";
import Link from "next/link";
import { cn } from "./cn";

/** CricsHub logo mark + wordmark. The wordmark is live text so it adapts to light/dark themes. */
export function Logo({
  href = "/",
  size = "md",
  showWordmark = true,
  className,
}: {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}) {
  const mark = size === "sm" ? 26 : size === "lg" ? 40 : 32;
  const text = size === "sm" ? "text-[15px]" : size === "lg" ? "text-2xl" : "text-lg";
  const content = (
    <>
      <Image
        src="/images/iconLogoTransparent.png"
        alt=""
        width={mark}
        height={Math.round(mark * 0.893)}
        priority
        className="flex-shrink-0"
      />
      {showWordmark && (
        <span className={cn("font-extrabold leading-none tracking-[-0.03em]", text)}>
          <span className="text-fg">CRICS</span>
          <span className="text-brand">HUB</span>
        </span>
      )}
      <span className="sr-only">CricsHub home</span>
    </>
  );
  const cls = cn("inline-flex items-center gap-2 rounded-lg", className);
  if (href === null) return <span className={cls}>{content}</span>;
  return (
    <Link href={href} className={cn(cls, "transition-opacity hover:opacity-80")}>
      {content}
    </Link>
  );
}

const avatarPalette = [
  "bg-[#1E88E5] text-white",
  "bg-[#7C3AED] text-white",
  "bg-[#0D9488] text-white",
  "bg-[#DB2777] text-white",
  "bg-[#EA580C] text-white",
  "bg-[#4F46E5] text-white",
  "bg-[#059669] text-white",
  "bg-[#B45309] text-white",
];

export const initials = (n: string) =>
  (n || "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function hash(s: string) {
  s = s || "";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Initials or image avatar. Colour is derived from the name so the same team always matches. */
export function Avatar({
  name,
  src,
  size = "md",
  shape = "rounded",
  className,
}: {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "rounded" | "circle";
  className?: string;
}) {
  const s = {
    xs: "h-6 w-6 text-2xs",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-2xl",
  }[size];
  const radius = shape === "circle" ? "rounded-full" : size === "xl" || size === "lg" ? "rounded-2xl" : "rounded-xl";
  if (src) {
    return (
      <span className={cn("relative flex-shrink-0 overflow-hidden bg-surface-2 ring-1 ring-line", s, radius, className)}>
        <Image src={src} alt={name || ""} fill sizes="80px" className="object-cover" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex flex-shrink-0 items-center justify-center font-semibold",
        s,
        radius,
        avatarPalette[hash(name) % avatarPalette.length],
        className,
      )}
      aria-hidden
    >
      {initials(name) || "?"}
    </span>
  );
}
