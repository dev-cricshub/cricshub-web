// Inline line icons for the landing page (24×24 grid, currentColor).

type IconProps = { size?: number; className?: string; strokeWidth?: number };

function Svg({
  size = 22,
  className,
  strokeWidth = 1.8,
  fill = "none",
  children,
}: IconProps & { fill?: string; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={fill === "none" ? "currentColor" : undefined}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const CheckIcon = ({ size = 15, strokeWidth = 3, ...p }: IconProps) => (
  <Svg size={size} strokeWidth={strokeWidth} {...p}>
    <path d="m5 12 5 5 9-10" />
  </Svg>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Svg size={14} strokeWidth={2.4} {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Svg size={18} strokeWidth={2.2} {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Svg>
);

export const PlayIcon = (p: IconProps) => (
  <Svg size={16} fill="currentColor" {...p}>
    <path d="M7 4.5v15l12-7.5z" />
  </Svg>
);

/** Full-colour Google Play mark: four segments meeting at the centre, clipped to a rounded triangle. */
export const PlayStoreIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="30 10 540 580" className={className} aria-hidden>
    <defs>
      <clipPath id="gplay-clip">
        <path d="M40 72Q40 18 90 42L532 268Q566 300 532 332L90 558Q40 582 40 528Z" />
      </clipPath>
    </defs>
    <g clipPath="url(#gplay-clip)">
      <path d="M0 0 340 300 0 600Z" fill="#2196F3" />
      <path d="M0 0H655L340 300Z" fill="#4CAF50" />
      <path d="M340 300 655 0H700V600H655Z" fill="#FFC107" />
      <path d="M0 600 340 300 655 600Z" fill="#F44336" />
    </g>
  </svg>
);

export const BatIcon = (p: IconProps) => (
  <Svg strokeWidth={2} {...p}>
    <rect x="5.75" y="1.6" width="5.5" height="13.4" rx="1.8" transform="rotate(-45 8.5 8.3)" fill="currentColor" stroke="none" />
    <path d="M12.6 12.6 19.6 19.6" strokeWidth={2.6} />
    <circle cx="17.6" cy="5.4" r="2.7" fill="currentColor" stroke="none" />
  </Svg>
);

export const ScreenPlayIcon = (p: IconProps) => (
  <Svg strokeWidth={2} {...p}>
    <rect x="2" y="6" width="20" height="14" rx="2" />
    <path d="m10 10 5 3-5 3z" />
  </Svg>
);

export const BroadcastIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="6" width="20" height="14" rx="2" />
    <path d="m8 2 4 4 4-4" />
    <path d="m10 10 5 3-5 3z" />
  </Svg>
);

export const TrophyIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
    <path d="M17 5h3v2a3 3 0 0 1-3 3" />
    <path d="M7 5H4v2a3 3 0 0 0 3 3" />
  </Svg>
);

export const UsersIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M17 14a5 5 0 0 1 4.5 6" />
  </Svg>
);

export const GavelBoxIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16v13H4z" />
    <path d="M9 7V4h6v3" />
    <path d="M4 12h16" />
  </Svg>
);

export const StarIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9z" />
  </Svg>
);

export const ClipboardIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="17" rx="2" />
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <path d="M8 11h8" />
    <path d="M8 15h5" />
  </Svg>
);

export const PlusIcon = (p: IconProps) => (
  <Svg size={16} strokeWidth={2.6} {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Svg>
);

export const QuoteIcon = ({ size = 28, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M4 18v-5a6 6 0 0 1 6-6v3a3 3 0 0 0-3 3h3v5zm10 0v-5a6 6 0 0 1 6-6v3a3 3 0 0 0-3 3h3v5z" />
  </svg>
);
