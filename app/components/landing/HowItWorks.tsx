import { Section, SectionHead } from "./primitives";

const STEPS = [
  { title: "Create a match", body: "Pick tournament, format and venue. The scorecard and a shareable match page are ready in seconds." },
  { title: "Add teams", body: "Bring in squads or invite players by link. Lock in captains, keepers and the toss." },
  { title: "Score live", body: "One tap per ball. Figures, run rates and auto commentary update instantly." },
  { title: "Go on air", body: "The overlay syncs every ball to YouTube through OBS or vMix." },
  { title: "Standings update", body: "Results flow straight into the points table, ready for the knockouts." },
];

export default function HowItWorks() {
  return (
    <Section id="how" className="pb-20 pt-[60px]">
      <SectionHead kicker="How it works" title="From first ball to final table" className="mb-12" />
      <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5 p-0">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex flex-col gap-2.5 rounded-3xl border border-line bg-surface p-6">
            <span className="font-display text-[40px] font-extrabold leading-none text-accent">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="m-0 text-[17px] font-extrabold">{s.title}</h3>
            <p className="m-0 text-sm leading-[1.55] text-fg-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
