import { cn } from "@/app/components/ui";
import { BatIcon, BroadcastIcon, ClipboardIcon, UsersIcon } from "./icons";
import { IconChip, Section, SectionHead } from "./primitives";

const AUDIENCES = [
  { title: "Organisers", body: "Set up leagues, fixtures and venues in minutes. No more spreadsheets or WhatsApp tables.", Icon: ClipboardIcon },
  { title: "Scorers", body: "Score from the boundary rope with one tap per ball, with undo when you need it.", Icon: BatIcon },
  { title: "Streamers", body: "Put a broadcast-style score bar on your YouTube stream that updates by itself.", Icon: BroadcastIcon },
  { title: "Players & fans", body: "Follow scores ball by ball and keep your career runs, averages and strike rate in one profile.", Icon: UsersIcon },
];

export default function AudienceMarquee() {
  return (
    <Section id="who" className="py-20">
      <SectionHead kicker="Built for everyone at the ground" title="Whoever you are on match day" />
      {/* The list is rendered twice so the track can loop seamlessly; the copy is hidden from assistive tech. */}
      <div className="landing-marquee relative overflow-hidden py-1.5 [mask-image:linear-gradient(90deg,transparent_0%,#000_8%,#000_92%,transparent_100%)]">
        <div className="landing-marquee-track flex w-max gap-4">
          {[false, true].map((dup) =>
            AUDIENCES.map(({ title, body, Icon }) => (
              <div
                key={`${title}-${dup}`}
                aria-hidden={dup || undefined}
                className={cn(
                  "flex w-[300px] shrink-0 flex-col gap-3 rounded-[26px] border border-line bg-surface p-[26px]",
                  "transition-[transform,border-color] duration-300 ease-out hover:-translate-y-1.5 hover:border-primary",
                )}
              >
                <IconChip>
                  <Icon />
                </IconChip>
                <h3 className="m-0 text-[19px] font-extrabold">{title}</h3>
                <p className="m-0 text-sm leading-[1.55] text-fg-muted">{body}</p>
              </div>
            )),
          )}
        </div>
      </div>
    </Section>
  );
}
