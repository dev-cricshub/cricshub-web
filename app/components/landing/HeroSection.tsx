import Image from "next/image";
import Link from "next/link";
import { cn } from "@/app/components/ui";
import { EXPLORE_HREF } from "@/lib/site";
import { CheckItem, PlayStoreButton, ghostCta } from "./primitives";
import { ChevronRightIcon, PlayIcon, ScreenPlayIcon } from "./icons";

/** Top-of-page glow + fading grid. Sits behind the header and hero. */
export function HeroBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-560px] -ml-[800px] h-[1200px] w-[1600px] rounded-full opacity-60"
        style={{ background: "radial-gradient(closest-side, #4A9EE0 0%, #4A9EE055 40%, rgba(10,14,23,0) 100%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[1000px]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(127,179,232,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(127,179,232,0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 60% 70% at 50% 0%, #000 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 70% at 50% 0%, #000 0%, transparent 100%)",
        }}
      />
      {/* Stadium photo: dimmed, tinted toward brand navy, and faded into the canvas so the hero copy stays legible. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[1180px] overflow-hidden">
        <Image
          src="/images/hero-ground.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%] [filter:saturate(0.9)_brightness(0.6)]"
        />
        <div className="absolute inset-0 bg-[#1E3A6E] opacity-45 mix-blend-color" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_50%_26%,rgba(10,14,23,0.55)_0%,rgba(10,14,23,0)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,23,0.55)_0%,rgba(13,24,48,0.45)_30%,rgba(10,14,23,0.82)_62%,#0A0E17_92%)]" />
      </div>
    </>
  );
}

export default function HeroSection() {
  return (
    <div className="relative mx-auto flex max-w-[1200px] flex-col items-center gap-[26px] px-6 pt-16 text-center sm:pt-[84px]">
      <Link
        href={EXPLORE_HREF}
        className="flex items-center gap-2.5 rounded-full border border-line-accent bg-primary-soft/70 py-1.5 pl-1.5 pr-3.5 text-[13px] font-bold text-[#C9D3E2] transition-colors hover:bg-primary-soft"
      >
        <span className="rounded-full bg-primary px-[9px] py-1 text-[11px] font-extrabold tracking-[1px] text-white">NEW</span>
        Run player auctions for your league
        <ChevronRightIcon />
      </Link>

      <h1 className="m-0 max-w-[980px] font-display text-[clamp(3.2rem,8vw,6.4rem)] font-extrabold uppercase leading-[0.92] tracking-[0.5px]">
        The home of <span className="text-accent">grassroots</span> cricket
      </h1>
      <p className="m-0 max-w-[620px] text-[clamp(16px,1.6vw,19px)] leading-relaxed text-fg-lead">
        Score every ball, run your league from fixtures to final, and stream matches to YouTube with pro overlays. All
        from one free app.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <PlayStoreButton />
        <a href="#how" className={cn("flex h-[60px] items-center gap-2.5 rounded-full pl-2.5 pr-6 text-base text-[#E8EDF5]", ghostCta)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8EDF5] text-canvas">
            <PlayIcon />
          </span>
          See how it works
        </a>
      </div>

      <div className="flex flex-wrap justify-center gap-[22px] text-[13px] font-semibold text-fg-muted">
        <CheckItem>Free to use</CheckItem>
        <CheckItem>Free YouTube overlay</CheckItem>
        <CheckItem>Any format, any overs</CheckItem>
      </div>

      <PhoneTrio />
    </div>
  );
}

const phoneFrame = "box-border border border-line-strong bg-surface-3 shadow-[0_40px_80px_rgba(0,0,0,0.6)]";
const phoneScreen = "flex h-full w-full flex-col overflow-hidden bg-canvas text-left";
const sidePhone = cn(
  phoneFrame,
  "absolute left-1/2 top-[70px] hidden h-[510px] w-[250px] rounded-[40px] p-[9px] opacity-[0.92] min-[900px]:block",
);
const floatChip =
  "absolute z-[3] hidden items-center rounded-[18px] border border-accent-soft/25 bg-[rgba(22,30,48,0.88)] text-left shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-[14px] min-[900px]:flex";

const TABLE = [
  ["1 Mumbai Strikers", "8 · +1.24"],
  ["2 Andheri Warriors", "8 · +0.87"],
  ["3 Thane Titans", "4 · −0.31"],
  ["4 Borivali Blasters", "0 · −1.76"],
];
const SQUAD = [
  ["RM", "R. Mehta", "C"],
  ["SI", "S. Iyer", "AR"],
  ["KR", "K. Rao", "WK"],
  ["AP", "A. Patil", "BOWL"],
];
const OVER = [
  { v: "1", cls: "bg-raised" },
  { v: "4", cls: "bg-primary" },
  { v: "W", cls: "bg-[#E8EDF5] text-canvas font-extrabold" },
  { v: "6", cls: "bg-[#4A9EE0] text-canvas font-extrabold" },
];

/** Three illustrative app screens: points table, live match, squad. */
function PhoneTrio() {
  return (
    <div aria-hidden className="relative mt-[30px] flex h-[600px] w-full items-start justify-center">
      <div
        className="absolute left-1/2 top-20 -ml-[450px] h-[520px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(74,158,224,0.3), rgba(74,158,224,0) 100%)" }}
      />

      {/* left: points table */}
      <div className={cn(sidePhone, "-ml-[400px] -rotate-[8deg]")}>
        <div className={cn(phoneScreen, "gap-2.5 rounded-[32px] px-3.5 pb-3.5 pt-7")}>
          <span className="text-sm font-extrabold">City Premier League</span>
          <span className="text-[11px] text-fg-muted">8 teams · T20 · League + knockouts</span>
          <div className="flex gap-1 rounded-xl bg-surface p-[3px] text-[11px] font-bold">
            <span className="flex-1 rounded-[9px] p-1.5 text-center text-fg-muted">Fixtures</span>
            <span className="flex-1 rounded-[9px] bg-primary p-1.5 text-center">Table</span>
          </div>
          <div className="flex flex-col gap-[5px] text-[11px]">
            {TABLE.map(([team, pts], i) => (
              <div key={team} className={cn("flex justify-between rounded-[10px] px-2.5 py-2", i === 0 ? "bg-raised" : "bg-surface")}>
                <span className={i === 0 ? "font-bold" : "font-semibold"}>{team}</span>
                <span className={i === 0 ? "" : "text-fg-muted"}>{pts}</span>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex flex-col gap-1 rounded-[14px] border border-line bg-surface p-2.5">
            <span className="text-[10px] font-bold text-accent-soft">FINAL · SUN 9:00 AM</span>
            <span className="text-[13px] font-extrabold">MUM vs AND</span>
          </div>
        </div>
      </div>

      {/* right: squad */}
      <div className={cn(sidePhone, "ml-[150px] rotate-[8deg]")}>
        <div className={cn(phoneScreen, "gap-2.5 rounded-[32px] px-3.5 pb-3.5 pt-7")}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line-accent bg-raised font-display text-base font-bold">
              MS
            </span>
            <span className="flex flex-col">
              <span className="text-[13px] font-extrabold">Mumbai Strikers</span>
              <span className="text-[10px] text-fg-muted">15 players</span>
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {SQUAD.map(([ini, name, role], i) => (
              <div
                key={name}
                className={cn("flex items-center gap-2 rounded-xl border bg-surface p-2", i === 0 ? "border-primary" : "border-line")}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-raised text-[10px] font-bold">{ini}</span>
                <span className="flex-1 text-xs font-bold">{name}</span>
                {i === 0 ? (
                  <span className="rounded-md bg-accent px-1.5 py-0.5 text-[9px] font-extrabold text-canvas">{role}</span>
                ) : (
                  <span className="text-[9px] font-bold text-accent-soft">{role}</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-3 gap-1.5 text-center">
            {[
              ["412", "Runs"],
              ["41.2", "Avg"],
              ["148", "SR"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-[10px] bg-surface px-1 py-2">
                <div className="font-display text-lg font-bold">{v}</div>
                <div className="text-[9px] text-fg-muted">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* center: live match */}
      <div
        className={cn(
          phoneFrame,
          "relative z-[2] h-[590px] w-[290px] rounded-[46px] p-2.5 shadow-[0_50px_100px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08)]",
        )}
      >
        <div className={cn(phoneScreen, "relative gap-3 rounded-[37px] px-[15px] pb-[15px] pt-8")}>
          <div
            className="absolute left-1/2 top-[-120px] -ml-[190px] h-[260px] w-[380px] rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(74,158,224,0.45), rgba(74,158,224,0) 100%)" }}
          />
          <div className="relative flex items-center justify-between">
            <span className="text-[15px] font-extrabold">MUM vs AND</span>
            <span className="flex items-center gap-[5px] rounded-full bg-primary-soft px-2 py-1 text-[10px] font-extrabold tracking-[1px] text-primary-soft-fg">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              LIVE
            </span>
          </div>
          <div className="relative flex flex-col gap-1.5 rounded-[20px] bg-[linear-gradient(115deg,#3584C9_0%,#3263B4_50%,#2E3A8C_100%)] p-4">
            <span className="text-[11px] font-semibold text-[#E6EEFF]">Mumbai Strikers · chasing 178</span>
            <span className="font-display text-[46px] font-bold leading-none text-white">
              142/4 <span className="text-lg">16.2 ov</span>
            </span>
            <span className="text-xs font-semibold text-white">Need 36 off 22 · CRR 8.69</span>
          </div>
          <div className="relative flex gap-1 rounded-xl bg-surface p-[3px] text-[11px] font-bold">
            <span className="flex-1 rounded-[9px] bg-primary p-[7px] text-center">Summary</span>
            <span className="flex-1 p-[7px] text-center text-fg-muted">Scorecard</span>
            <span className="flex-1 p-[7px] text-center text-fg-muted">Live</span>
          </div>
          <div className="relative flex flex-col gap-[7px] rounded-2xl border border-line bg-surface px-3 py-2.5 text-xs">
            <div className="flex justify-between">
              <span className="font-bold">S. Iyer*</span>
              <span className="text-fg-muted">47 (29)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">K. Rao</span>
              <span className="text-fg-muted">12 (9)</span>
            </div>
            <div className="h-px bg-line" />
            <div className="flex justify-between text-fg-muted">
              <span>V. Khan</span>
              <span>2-28 (3.2)</span>
            </div>
          </div>
          <div className="relative flex items-center gap-1.5">
            <span className="mr-0.5 text-[10px] font-bold text-fg-muted">THIS OVER</span>
            {OVER.map((b, i) => (
              <span key={i} className={cn("flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11px] font-bold", b.cls)}>
                {b.v}
              </span>
            ))}
          </div>
          <div className="relative rounded-[14px] border border-line bg-well px-3 py-2.5 text-xs leading-[1.45] text-[#C9D3E2]">
            <span className="font-extrabold text-accent">16.2</span> Khan to Iyer, SIX! Lofted cleanly over long-on.
          </div>
        </div>
      </div>

      {/* floating chips */}
      <div className={cn(floatChip, "left-1/2 top-[380px] -ml-[300px] gap-3 px-4 py-3")}>
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-primary text-white">
          <ScreenPlayIcon size={18} />
        </span>
        <span className="flex flex-col gap-px">
          <span className="text-[13px] font-extrabold">Streaming on YouTube</span>
          <span className="text-[11px] text-fg-muted">Overlay synced · every ball</span>
        </span>
      </div>
      <div className={cn(floatChip, "left-1/2 top-40 ml-[170px] gap-2.5 rounded-2xl px-3.5 py-2.5")}>
        <span className="font-display text-[26px] font-extrabold text-accent">6</span>
        <span className="flex flex-col gap-px">
          <span className="text-[13px] font-extrabold">Iyer hits a six</span>
          <span className="text-[11px] text-fg-muted">Commentary auto-updated</span>
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[4] h-40 bg-[linear-gradient(180deg,rgba(10,14,23,0)_0%,#0A0E17_90%)]" />
    </div>
  );
}
