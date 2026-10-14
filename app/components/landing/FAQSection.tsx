"use client";

import { useState } from "react";
import { cn } from "@/app/components/ui";
import { PlusIcon } from "./icons";
import { Section, SectionHead } from "./primitives";

const FAQS = [
  {
    q: "Is CricsHub free?",
    a: "Yes. The app is free on Google Play, and every match admin gets the streaming dashboard and a standard score overlay at no cost. Premium overlay bundles start at ₹49 per match.",
  },
  {
    q: "How does live scoring work?",
    a: "Start a match, add your teams and score ball by ball: runs, extras, wickets and undo. The scorecard, player stats and commentary stay up to date for everyone following.",
  },
  {
    q: "Can I manage a full tournament?",
    a: "Yes. Host a tournament, add teams, and CricsHub handles fixtures, points tables and knockout stages through to the final.",
  },
  {
    q: "How do I stream a match to YouTube?",
    a: "Open your match in Stream Studio on the web, add the CricsHub overlay to OBS or vMix as a browser source, and go live. The overlay syncs with every ball you score in the app.",
  },
  {
    q: "Is there an iPhone app?",
    a: "CricsHub is on Android via Google Play right now. Stream Studio works in any modern browser, including on a Mac or PC.",
  },
  {
    q: "Is fantasy cricket available?",
    a: "Fantasy is coming soon. Keep the app updated and follow CricsHub on social media to hear when it launches.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState(0);

  return (
    <Section id="faq" className="max-w-[820px] pb-20 pt-[60px]">
      <SectionHead
        kicker="FAQ"
        title={<span className="text-[clamp(2.4rem,5vw,3.4rem)]">Questions from the dressing room</span>}
        className="mb-9"
      />
      <div className="flex flex-col gap-2.5">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={f.q}
              className={cn("overflow-hidden rounded-[20px] border bg-surface transition-colors", isOpen ? "border-line-accent" : "border-line")}
            >
              <h3 className="m-0">
                <button
                  type="button"
                  id={`faq-q-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-bold text-fg"
                >
                  {f.q}
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-[transform,background-color,color] duration-[250ms]",
                      isOpen ? "rotate-45 bg-primary text-white" : "bg-primary-soft text-accent-soft",
                    )}
                  >
                    <PlusIcon />
                  </span>
                </button>
              </h3>
              <div
                id={`faq-a-${i}`}
                role="region"
                aria-labelledby={`faq-q-${i}`}
                hidden={!isOpen}
                className="px-5 pb-5 text-[15px] leading-relaxed text-fg-lead"
              >
                {f.a}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
