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
    <Section id="faq" className="flex flex-wrap gap-12">
      <SectionHead kicker="FAQ" title="Questions from the dressing room" className="flex-[1_1_320px] self-start" />
      <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-2.5" data-anim-stagger="70">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={f.q}
              data-anim="up"
              className={cn(
                "ch-gl overflow-hidden rounded-[18px] border transition-colors duration-[250ms]",
                isOpen ? "border-white/[0.24] bg-white/10" : "border-white/[0.12] bg-white/[0.05]",
              )}
            >
              <h3 className="m-0">
                <button
                  type="button"
                  id={`faq-q-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex min-h-[60px] w-full items-center justify-between gap-4 px-[22px] py-3 text-left text-base font-semibold text-white"
                >
                  {f.q}
                  <PlusIcon
                    size={18}
                    strokeWidth={2}
                    className={cn("flex-none text-[#D6E2F5] transition-transform duration-[250ms]", isOpen && "rotate-45")}
                  />
                </button>
              </h3>
              <div
                id={`faq-a-${i}`}
                role="region"
                aria-labelledby={`faq-q-${i}`}
                hidden={!isOpen}
                className="px-[22px] pb-5 text-[15px] leading-[1.65] text-[#C3CEE0]"
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
