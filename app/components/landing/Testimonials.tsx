import { cn } from "@/app/components/ui";
import { QuoteIcon } from "./icons";
import { Section, SectionHead } from "./primitives";

interface Testimonial {
  quote: string;
  name: string;
  /** e.g. "Organiser · City Premier League" */
  role: string;
}

/**
 * Real customer quotes only. The section stays hidden until at least one is added.
 * The middle card gets the highlighted treatment.
 */
const TESTIMONIALS: Testimonial[] = [];

export default function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;
  return (
    <Section id="stories" className="pb-20 pt-[60px]">
      <SectionHead kicker="Loved by clubs" title="Heard in the pavilion" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        {TESTIMONIALS.map((t, i) => {
          const featured = i === 1;
          return (
            <figure
              key={t.name}
              className={cn(
                "m-0 flex flex-col gap-5 rounded-[26px] border p-7",
                featured ? "border-line-accent bg-[linear-gradient(160deg,#16274A_0%,#131A2A_70%)]" : "border-line bg-surface",
              )}
            >
              <QuoteIcon className={featured ? "text-accent" : "text-primary"} />
              <blockquote className="m-0 text-[17px] leading-relaxed text-[#DCE3EE]">{t.quote}</blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line-accent bg-raised text-xs font-bold">
                  {t.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-extrabold">{t.name}</span>
                  <span className="text-xs text-fg-muted">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </Section>
  );
}
