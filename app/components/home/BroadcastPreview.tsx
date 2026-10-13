import Image from "next/image";

const BALLS = ["1", "4", "•", "W", "2", "6"];

/** Decorative product visual: a match frame with a broadcast score bar, like Stream Studio outputs. */
export default function BroadcastPreview() {
  return (
    <div className="relative" aria-hidden>
      {/* Glow */}
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-primary/20 blur-3xl dark:bg-primary/15" />

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-overlay">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="ml-3 truncate font-mono text-2xs text-fg-subtle">cricshub.com/overlay/…  ·  1920×1080</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-live px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Live
          </span>
        </div>

        {/* Frame */}
        <div className="relative aspect-video">
          <Image
            src="/images/matchStalkImage.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10" />

          {/* Top-left tournament chip */}
          <div className="absolute left-[4%] top-[6%] rounded-md bg-black/55 px-2 py-1 text-[clamp(8px,1.4vw,11px)] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            City Premier League · Final
          </div>

          {/* Score bar */}
          <div className="absolute inset-x-[4%] bottom-[6%] flex items-stretch overflow-hidden rounded-lg text-white shadow-2xl">
            <div className="flex items-center gap-2 bg-[#0B1F40] px-[3%] py-[1.6%]">
              <span className="rounded bg-[#1E88E5] px-1.5 py-0.5 text-[clamp(8px,1.4vw,11px)] font-bold">MUM</span>
              <span className="font-mono text-[clamp(11px,2.2vw,18px)] font-semibold tabular-nums">142/3</span>
              <span className="text-[clamp(8px,1.3vw,11px)] text-white/60 tabular-nums">16.2</span>
            </div>
            <div className="hidden flex-1 items-center justify-between gap-3 bg-[#0e2a58]/95 px-[3%] text-[clamp(8px,1.3vw,11px)] min-[420px]:flex">
              <div className="space-y-0.5 whitespace-nowrap">
                <p>
                  <span className="text-white/90">R. Sharma*</span>{" "}
                  <span className="font-mono tabular-nums text-white/70">58 (37)</span>
                </p>
                <p>
                  <span className="text-white/70">S. Yadav</span>{" "}
                  <span className="font-mono tabular-nums text-white/50">21 (14)</span>
                </p>
              </div>
              <div className="flex gap-1">
                {BALLS.map((b, i) => (
                  <span
                    key={i}
                    className={
                      "flex h-[clamp(14px,2.2vw,20px)] w-[clamp(14px,2.2vw,20px)] items-center justify-center rounded-full font-bold animate-pop " +
                      (b === "W"
                        ? "bg-[#E53935]"
                        : b === "6" || b === "4"
                          ? "bg-[#1E88E5]"
                          : "bg-white/15")
                    }
                    style={{ animationDelay: `${600 + i * 180}ms` }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center bg-[#1E88E5] px-[3%] text-[clamp(8px,1.3vw,11px)] font-semibold">
              CRR 8.69
            </div>
          </div>
        </div>
      </div>

      {/* Floating status card */}
      <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-pop animate-fade-up sm:flex [animation-delay:900ms]">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-soft text-success">
          <i className="ri-refresh-line" />
        </span>
        <div>
          <p className="text-xs font-semibold text-fg">Synced every ball</p>
          <p className="text-2xs text-fg-muted">Scorer → overlay in real time</p>
        </div>
      </div>
    </div>
  );
}
