import Link from "next/link";
import { cn } from "@/app/components/ui";
import { BatIcon, BroadcastIcon, GavelBoxIcon, StarIcon, TrophyIcon, UsersIcon } from "./icons";
import { IconChip, Section, SectionHead, card } from "./primitives";

const KEY = "border border-[#22304A] bg-surface";
const PAD = [
  { v: "0", cls: KEY },
  { v: "1", cls: KEY },
  { v: "2", cls: KEY },
  { v: "3", cls: KEY },
  { v: "4", cls: "bg-primary" },
  { v: "6", cls: "bg-[#4A9EE0]" },
  { v: "Wd", cls: cn(KEY, "text-[22px] text-fg-muted") },
  { v: "W", cls: "bg-[#E8EDF5] font-extrabold text-canvas" },
];

const tile = cn(card, "flex min-w-0 flex-col gap-3 p-7");
const tileTitle = "m-0 text-[21px] font-extrabold";
const tileBody = "m-0 text-[15px] leading-relaxed text-fg-lead";

export default function FeatureBento() {
  return (
    <Section id="features" className="py-20">
      <SectionHead
        kicker="Everything in one app"
        title="Score it. Run it. Stream it."
        lead="From a Sunday friendly to a full league season, CricsHub handles the whole match day."
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        {/* Hero tile: scoring */}
        <div className="relative flex min-w-0 flex-wrap items-center gap-7 overflow-hidden rounded-[28px] border border-line-accent bg-[linear-gradient(160deg,#16274A_0%,#131A2A_60%)] p-[30px] min-[640px]:col-span-2">
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-80 w-80 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(74,158,224,0.3), rgba(74,158,224,0) 100%)" }}
          />
          <div className="relative flex flex-[1_1_260px] flex-col gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
              <BatIcon size={24} />
            </span>
            <h3 className="m-0 text-[26px] font-extrabold">Ball-by-ball live scoring</h3>
            <p className={tileBody}>
              One tap per delivery: runs, extras, wickets and undo. Scorecards, run rates and commentary update instantly
              for everyone following.
            </p>
          </div>
          <div aria-hidden className="relative grid flex-[1_1_240px] grid-cols-4 gap-2">
            {PAD.map((k) => (
              <span
                key={k.v}
                className={cn(
                  "flex h-14 items-center justify-center rounded-2xl font-display text-[26px] font-bold",
                  k.cls,
                )}
              >
                {k.v}
              </span>
            ))}
          </div>
        </div>

        <div className={tile}>
          <IconChip>
            <BroadcastIcon />
          </IconChip>
          <h3 className={tileTitle}>Broadcast overlays</h3>
          <p className={tileBody}>
            Add the score overlay to OBS or vMix and it syncs every ball to your YouTube stream. Free for every match
            admin.
          </p>
          <div aria-hidden className="mt-auto flex items-center gap-2.5 rounded-[14px] border border-[#22304A] bg-well px-3 py-2.5">
            <span className="rounded-[5px] bg-accent px-1.5 py-[3px] text-[10px] font-extrabold text-canvas">LIVE</span>
            <span className="font-display text-lg font-bold">
              MUM 171/4 <span className="text-sm text-fg-muted">19.1 · need 7 off 5</span>
            </span>
          </div>
        </div>

        <div className={tile}>
          <IconChip>
            <TrophyIcon />
          </IconChip>
          <h3 className={tileTitle}>Tournaments, end to end</h3>
          <p className={tileBody}>Fixtures, points tables with net run rate and knockout stages, all the way to the final.</p>
          <div aria-hidden className="mt-auto flex flex-col gap-1.5 text-[13px]">
            <div className="flex justify-between rounded-[10px] bg-raised px-3 py-2">
              <span className="font-bold">1 · Mumbai Strikers</span>
              <span className="text-primary-soft-fg">8 pts</span>
            </div>
            <div className="flex justify-between rounded-[10px] bg-well px-3 py-2">
              <span className="font-semibold">2 · Andheri Warriors</span>
              <span className="text-fg-muted">8 pts</span>
            </div>
          </div>
        </div>

        <div className={tile}>
          <IconChip>
            <UsersIcon />
          </IconChip>
          <h3 className={tileTitle}>Teams &amp; player stats</h3>
          <p className={tileBody}>
            Build squads, invite players with a link, assign captains and keepers, and track every run, average and strike
            rate.
          </p>
        </div>

        <div className={tile}>
          <IconChip>
            <GavelBoxIcon />
          </IconChip>
          <h3 className={tileTitle}>Player auctions</h3>
          <p className={tileBody}>Run a live auction for your league and build teams the IPL way.</p>
          <Link href="/auctions" className="mt-auto text-sm font-bold text-accent-soft hover:text-primary-soft-fg">
            Explore auctions →
          </Link>
        </div>

        <div className={cn(tile, "border-dashed border-[#2A3E62]")}>
          <div className="flex items-start justify-between">
            <IconChip>
              <StarIcon />
            </IconChip>
            <span className="rounded-full bg-primary-soft px-2.5 py-[5px] text-[11px] font-extrabold uppercase tracking-[1px] text-primary-soft-fg">
              Coming soon
            </span>
          </div>
          <h3 className={tileTitle}>Local fantasy</h3>
          <p className={tileBody}>Pick your XI from the players in your own league. Contests aren&apos;t open yet.</p>
        </div>
      </div>
    </Section>
  );
}
