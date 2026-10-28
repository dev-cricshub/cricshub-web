import { cn } from "@/app/components/ui";
import { Section, SectionHead, tile } from "./primitives";

const STEPS = [
  { title: "Create a match", body: "Pick tournament, format and venue. The scorecard and a shareable match page are ready in seconds." },
  { title: "Add teams", body: "Bring in squads or invite players by link. Lock in captains, keepers and the toss." },
  { title: "Score live", body: "One tap per ball. Figures, run rates and auto commentary update instantly." },
  { title: "Go on air", body: "The overlay syncs every ball to YouTube through OBS or vMix." },
  { title: "Standings update", body: "Results flow straight into the points table, ready for the knockouts." },
];

export default function HowItWorks() {
  return (
    <Section id="how" className="flex flex-col gap-10">
      <SectionHead kicker="How it works" title="From first ball to final table" />
      <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 p-0" data-anim-stagger="90">
        {STEPS.map((s, i) => (
          <li key={s.title} data-anim="up" className={cn(tile, "ch-lift flex flex-col gap-3 rounded-[22px] p-6")}>
            <span className="font-display text-[40px] font-bold leading-none text-[#5AA9F0]">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="m-0 text-lg font-semibold text-white">{s.title}</h3>
            <p className="m-0 text-sm leading-relaxed text-[#C3CEE0]">{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
