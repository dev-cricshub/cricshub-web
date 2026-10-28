import Link from "next/link";
import { cn } from "@/app/components/ui";
import { EXPLORE_HREF } from "@/lib/site";
import { Section, SectionHead, ghostCta, primaryCta, tile } from "./primitives";

const FACTS = [
  { value: "Free", label: "score overlay for every match admin" },
  { value: "Every ball", label: "synced from the scorer’s app" },
  { value: "OBS · vMix", label: "added as a browser source" },
  { value: "₹49", label: "premium bundles, per match" },
];

const STEPS = [
  { title: "Score in the app", text: "Start the match on CricsHub and score as usual." },
  { title: "Add the overlay", text: "Paste the Stream Studio link into OBS or vMix as a browser source." },
  { title: "Go live on YouTube", text: "The score updates on its own, ball by ball." },
];

export default function StreamingShowcase() {
  return (
    <Section id="streaming" className="flex flex-wrap items-center gap-14">
      <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-6">
        <SectionHead
          kicker="Live streaming"
          title="Your match. On air, like the pros."
          lead="Turn any phone or camera stream into a TV-style broadcast. The CricsHub overlay sits on your YouTube stream and updates itself with every ball you score in the app."
          gap="gap-6"
        />
        <div className="grid grid-cols-2 gap-3" data-anim-stagger="80">
          {FACTS.map((f) => (
            <div key={f.value} data-anim="up" className={cn(tile, "rounded-[18px] border-white/[0.12] p-[18px]")}>
              <div className="font-display text-[30px] font-bold text-white">{f.value}</div>
              <div className="text-[13px] text-[#C3CEE0]">{f.label}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3" data-anim="up">
          <Link href={EXPLORE_HREF} className={primaryCta("md")}>
            Explore Stream Studio
          </Link>
          <Link href="/pricing" className={ghostCta("md")}>
            See overlay bundles
          </Link>
        </div>
      </div>

      <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4">
        <div data-anim="right">
          <StreamMock />
        </div>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 p-0" data-anim-stagger="90">
          {STEPS.map((s, i) => (
            <li key={s.title} data-anim="up" className={cn(tile, "flex flex-col gap-1.5 rounded-[18px] border-white/[0.12] p-[18px]")}>
              <span className="font-bold text-[#5AA9F0]">{i + 1}</span>
              <strong className="text-[15px] text-white">{s.title}</strong>
              <span className="text-[13px] leading-normal text-[#C3CEE0]">{s.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/** Illustrative YouTube frame with the CricsHub score bar on it. */
function StreamMock() {
  return (
    <div
      role="img"
      aria-label="Example YouTube live stream with the CricsHub score overlay: MUM 171/4 after 19.1 overs, need 7 off 5"
      className="ch-gl relative aspect-video overflow-hidden rounded-3xl border border-white/[0.16] bg-white/[0.05] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.75)]"
    >
      <div className="absolute left-[20%] top-[10%] h-[70%] w-[60%] rounded-full bg-[#16A34A] opacity-[0.22] blur-[60px]" />
      <div className="absolute inset-x-4 top-3.5 flex justify-between gap-3 text-xs text-[#D6E2F5]">
        <span className="truncate">YouTube Live · City Premier League · Final</span>
        <span className="inline-flex flex-none gap-2">
          <span className="rounded-md bg-[#DC2626] px-2 py-[3px] font-bold text-white">LIVE</span>
          <span className="rounded-md bg-white/[0.14] px-2 py-[3px]">1080p</span>
        </span>
      </div>
      <div className="ch-float2 ch-gl absolute left-5 top-[72px] flex items-center gap-2.5 rounded-[14px] border border-white/[0.26] bg-white/[0.12] px-3.5 py-2.5 text-[13px] text-white max-sm:top-12 max-sm:scale-90">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#5AA9F0] text-xs font-bold text-[#060A14]">RS</span>
        <span>
          <strong>R. Sharma · 50 up!</strong>
          <br />
          <span className="text-[#D6E2F5]">81* (48) · 7 fours · 4 sixes</span>
        </span>
      </div>
      <div className="ch-gl absolute inset-x-4 bottom-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-white/[0.18] bg-[rgba(6,10,20,0.6)] px-4 py-3 text-[13px] max-sm:inset-x-2 max-sm:bottom-2 max-sm:gap-x-2.5 max-sm:px-2.5 max-sm:py-2 max-sm:text-[11px]">
        <span className="font-bold tracking-[0.06em] text-[#5AA9F0]">CPL · FINAL</span>
        <span className="font-bold text-white">MUM v AND</span>
        <span className="font-display text-[22px] font-bold text-white max-sm:text-lg">
          171/4 <span className="font-sans text-xs font-medium text-[#C3CEE0]">19.1</span>
        </span>
        <span className="text-[#D6E2F5] max-sm:hidden">Sharma* 81 (48) · Pandya 2 (2)</span>
        <span className="ml-auto rounded-lg bg-[#F97316] px-2.5 py-1 font-bold text-[#060A14]">NEED 7 off 5</span>
      </div>
    </div>
  );
}
