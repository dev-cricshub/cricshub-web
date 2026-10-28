import { cn } from "@/app/components/ui";
import { Section, SectionHead, tile } from "./primitives";

const AUDIENCES = [
  { title: "Organisers", body: "Set up leagues, fixtures and venues in minutes. No more spreadsheets or WhatsApp tables." },
  { title: "Scorers", body: "Score from the boundary rope with one tap per ball, with undo when you need it." },
  { title: "Streamers", body: "Put a broadcast-style score bar on your YouTube stream that updates by itself." },
  { title: "Players & fans", body: "Follow scores ball by ball and keep your career runs, averages and strike rate in one profile." },
];

export default function Audience() {
  return (
    <Section className="flex flex-col gap-10">
      <SectionHead kicker="Built for everyone at the ground" title="Whoever you are on match day" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4" data-anim-stagger="90">
        {AUDIENCES.map((a) => (
          <article key={a.title} data-anim="up" className={cn(tile, "ch-lift flex flex-col gap-2.5 rounded-[22px] p-[26px]")}>
            <h3 className="m-0 text-[19px] font-semibold text-white">{a.title}</h3>
            <p className="m-0 text-[15px] leading-relaxed text-[#C3CEE0]">{a.body}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
