import Link from "next/link";
import { cn } from "@/app/components/ui";
import { FeatureIcon } from "@/app/components/auth/FeatureOrbit";
import { EXPLORE_HREF } from "@/lib/site";
import { TrophyIcon, UndoIcon } from "./icons";
import { Kicker, Section, body, lead, tile } from "./primitives";

const KEY = "ch-key flex min-h-14 items-center justify-center rounded-2xl border font-display text-[26px] font-bold";
const PAD = [
  { v: "0" },
  { v: "1" },
  { v: "2" },
  { v: "3" },
  { v: "4", hot: "bg-[#5AA9F0]" },
  { v: "6", hot: "bg-[#5AA9F0]" },
  { v: "Wd" },
  { v: "Nb" },
  { v: "W", hot: "bg-[#F97316]" },
];

// Base card surface; each card adds its own direction, gap and padding (cn() doesn't resolve conflicts).
const card = cn(tile, "ch-lift flex min-w-0 rounded-[26px]");
const small = "flex-col gap-3.5 p-7";
const wide = "flex-row flex-wrap items-center gap-6 p-7";
const cardTitle = "m-0 text-xl font-semibold text-white";
const cardBody = "m-0 text-sm leading-relaxed text-[#C3CEE0]";

export default function FeatureBento() {
  return (
    <Section id="features" className="flex flex-col gap-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-[1_1_520px] flex-col gap-3.5" data-anim="up">
          <Kicker>Everything in one app</Kicker>
          <h2 className="m-0 font-display text-[clamp(3rem,7vw,4.5rem)] font-bold uppercase leading-[0.92] text-white">
            Score it. Run it. <span className="text-[#5AA9F0]">Stream it.</span>
          </h2>
        </div>
        <p className={cn(lead, "flex-[0_1_360px]")} data-anim="up" style={{ "--d": "120ms" } as React.CSSProperties}>
          From a Sunday friendly to a full league season, CricsHub handles the whole match day.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 min-[900px]:grid-cols-6" data-anim-stagger="90">
        {/* Live scoring: hero tile */}
        <article data-anim="up" className={cn(card, "flex-col gap-6 p-7 sm:p-9 min-[900px]:col-span-4 min-[900px]:row-span-2")}>
          <div className="flex flex-wrap items-start gap-8">
            <div className="flex flex-[1_1_260px] flex-col gap-3.5">
              <span className="inline-flex items-center gap-2 self-start rounded-full border border-white/[0.16] bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-[0.08em] text-white">
                <span className="ch-live h-[7px] w-[7px] rounded-full bg-[#F97316]" />
                LIVE SCORING
              </span>
              <h3 className="m-0 font-display text-[44px] font-bold uppercase leading-[0.95] text-white">Ball-by-ball, one tap each</h3>
              <p className="m-0 text-base leading-relaxed text-[#C3CEE0]">
                Runs, extras, wickets and undo. Scorecards, run rates and commentary update instantly for everyone following.
              </p>
            </div>

            <div aria-hidden className="ch-gl flex flex-[1_1_280px] flex-col gap-3 rounded-[22px] border border-white/[0.14] bg-[rgba(6,10,20,0.45)] p-[18px]">
              <div className="flex items-baseline justify-between px-1 pb-2 pt-1">
                <span className="text-[13px] text-[#C3CEE0]">Over 16.2</span>
                <span className="font-display text-[28px] font-bold text-white">142/4</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PAD.map((k) => (
                  <span
                    key={k.v}
                    className={cn(KEY, k.hot ? `${k.hot} border-transparent text-[#060A14]` : "border-white/[0.16] bg-white/[0.08] text-white")}
                  >
                    {k.v}
                  </span>
                ))}
              </div>
              <span className="ch-key flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-white/[0.14] bg-white/[0.06] text-sm font-semibold text-[#D6E2F5]">
                <UndoIcon />
                Undo
              </span>
            </div>
          </div>

          <div className="mt-auto flex items-center gap-3 rounded-2xl border border-white/[0.12] bg-white/[0.06] px-[18px] py-3.5 text-sm text-[#D6E2F5]">
            <span className="inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-[#5AA9F0] font-bold text-[#060A14]">6</span>
            16.2 Khan to Iyer, SIX! Lofted cleanly over long-on.
          </div>
        </article>

        {/* Broadcast overlays */}
        <article data-anim="up" className={cn(card, small, "min-[900px]:col-span-2")}>
          <FeatureIcon name="stream" size={26} />
          <h3 className={cardTitle}>Broadcast overlays</h3>
          <p className={cardBody}>Add it to OBS or vMix and it syncs every ball to YouTube. Free for every match admin.</p>
          <div aria-hidden className="mt-auto flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.14] bg-[rgba(6,10,20,0.6)] px-3 py-2.5 text-xs">
            <span className="font-bold text-[#FFD3B0]">LIVE</span>
            <span className="font-semibold text-white">MUM 171/4 19.1</span>
            <span className="text-[#C3CEE0]">· need 7 off 5</span>
          </div>
        </article>

        {/* Tournaments */}
        <article data-anim="up" className={cn(card, small, "min-[900px]:col-span-2")}>
          <TrophyIcon size={26} className="text-[#C4B5FD]" />
          <h3 className={cardTitle}>Tournaments, end to end</h3>
          <p className={cardBody}>Fixtures, points tables with NRR and knockouts, all the way to the final.</p>
          <div aria-hidden className="mt-auto flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between rounded-[10px] bg-white/[0.08] px-2.5 py-2">
              <span className="text-white">1 · Mumbai Strikers</span>
              <span className="text-[#C3CEE0]">8 pts</span>
            </div>
            <div className="flex justify-between rounded-[10px] bg-white/[0.04] px-2.5 py-2">
              <span className="text-white">2 · Andheri Warriors</span>
              <span className="text-[#C3CEE0]">8 pts</span>
            </div>
          </div>
        </article>

        {/* Teams & stats */}
        <article data-anim="up" className={cn(card, wide, "min-[900px]:col-span-3")}>
          <div className="flex flex-[1_1_220px] flex-col gap-2.5">
            <h3 className={cardTitle}>Teams &amp; player stats</h3>
            <p className={cardBody}>Build squads, invite players with a link, assign captains and keepers, and track every run.</p>
          </div>
          <div aria-hidden className="grid flex-[1_1_200px] grid-cols-3 gap-2">
            {[
              { v: "412", l: "Runs" },
              { v: "41.2", l: "Avg" },
              { v: "148", l: "SR", accent: true },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-white/[0.12] bg-white/[0.07] px-2.5 py-3.5 text-center">
                <div className={cn("font-display text-[30px] font-bold", s.accent ? "text-[#5AA9F0]" : "text-white")}>{s.v}</div>
                <div className="text-xs text-[#C3CEE0]">{s.l}</div>
              </div>
            ))}
          </div>
        </article>

        {/* Player auctions */}
        <article data-anim="up" className={cn(card, wide, "min-[900px]:col-span-3")}>
          <div className="flex flex-[1_1_220px] flex-col gap-2.5">
            <h3 className={cardTitle}>Player auctions</h3>
            <p className={cardBody}>Run a live auction for your league and build teams the IPL way.</p>
            <Link href={EXPLORE_HREF} className="inline-flex min-h-11 items-center self-start text-[15px] font-semibold text-[#5AA9F0] hover:text-[#7CC4FF]">
              Explore auctions →
            </Link>
          </div>
          <div
            aria-hidden
            className="ch-float flex h-[120px] w-[120px] flex-none items-center justify-center rounded-[32px] border border-white/[0.36] bg-[linear-gradient(150deg,rgba(255,255,255,0.28),rgba(255,255,255,0.06)_60%,rgba(255,255,255,0.14))] shadow-[0_0_40px_-10px_#F97316,inset_0_1px_0_rgba(255,255,255,0.35)]"
          >
            <FeatureIcon name="auction" size={52} color="#FFD3B0" />
          </div>
        </article>

        {/* Local fantasy */}
        <article data-anim="up" className="ch-gl flex flex-wrap items-center gap-4 rounded-[22px] border border-dashed border-white/[0.24] bg-white/[0.03] px-7 py-[22px] min-[900px]:col-span-6">
          <span className="rounded-full bg-white/10 px-2.5 py-[5px] text-[11px] font-bold uppercase tracking-[0.08em] text-white">Coming soon</span>
          <h3 className="m-0 text-lg font-semibold text-white">Local fantasy</h3>
          <p className={body}>Pick your XI from the players in your own league. Contests aren&apos;t open yet.</p>
        </article>
      </div>
    </Section>
  );
}
