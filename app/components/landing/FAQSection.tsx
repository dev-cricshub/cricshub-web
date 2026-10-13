"use client";

import Link from "next/link";
import { PLAY_STORE_URL, SUPPORT_EMAIL } from "@/lib/site";
import { LandingHeading } from "./primitives";

interface Faq {
  id: string;
  q: string;
  a: React.ReactNode;
}

const link = "font-medium text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm";

const FAQS: Faq[] = [
  {
    id: "free",
    q: "Is CricsHub free?",
    a: (
      <>
        <p>
          Yes. The CricsHub app is free on{" "}
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={link}>
            Google Play
          </a>
          , and every match admin gets the streaming dashboard and a score overlay for free.
        </p>
        <p>
          Premium overlay bundles start at ₹49 per match. A subscription — ₹149/month or ₹499 for 6 months — includes a
          free bundle credit for every match. See{" "}
          <Link href="/pricing" className={link}>
            pricing
          </Link>{" "}
          for details.
        </p>
      </>
    ),
  },
  {
    id: "scoring",
    q: "How does live scoring work?",
    a: (
      <p>
        Start a match in the app, add your teams, then score ball by ball — runs, extras, wickets and
        undo. CricsHub keeps the scorecard, player stats and commentary up to date as you go, so everyone following the
        match sees every ball.
      </p>
    ),
  },
  {
    id: "tournament",
    q: "Can I manage a full tournament?",
    a: (
      <p>
        Yes. Host a tournament, add teams, and CricsHub handles fixtures, points tables and knockout stages through to the
        final — with every match scored live in the same place.
      </p>
    ),
  },
  {
    id: "stream",
    q: "How do I stream a match to YouTube?",
    a: (
      <>
        <p>
          Log in to Stream Studio on the web at cricshub.com and open your match. Add the CricsHub overlay to OBS or
          vMix as a browser source, then go live to YouTube from your broadcast software — the overlay syncs
          automatically with every ball you score in the app.
        </p>
        <p>
          The score overlay is free; premium overlay bundles are available from ₹49 per match (
          <Link href="/pricing" className={link}>
            see pricing
          </Link>
          ).
        </p>
      </>
    ),
  },
  {
    id: "ios",
    q: "Is there an iPhone app?",
    a: (
      <p>
        CricsHub is currently available on Android through{" "}
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={link}>
          Google Play
        </a>
        . Stream Studio works in any modern browser, including on a Mac or PC.
      </p>
    ),
  },
  {
    id: "fantasy",
    q: "Is fantasy cricket available?",
    a: <p>Fantasy cricket is coming soon. Keep the app updated and follow us on social media to hear when it launches.</p>,
  },
  {
    id: "support",
    q: "How do I get support?",
    a: (
      <p>
        Email us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className={link}>
          {SUPPORT_EMAIL}
        </a>{" "}
        or use the{" "}
        <Link href="/contact-us" className={link}>
          contact form
        </Link>
        .
      </p>
    ),
  },
];

export default function FAQSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative scroll-mt-20 py-section">
      <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <LandingHeading
            id="faq-title"
            eyebrow="FAQ"
            title={
              <>
                Questions from the dressing room
              </>
            }
            lead="Everything organisers, scorers and streamers ask before their first match on CricsHub."
          />
          <div className="mt-10 hidden rounded-card border border-line p-6 lg:block">
            <p className="font-display text-xl font-semibold uppercase tracking-wide text-fg">Still have a question?</p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">Our team is happy to help you get your league or stream set up.</p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a href={`mailto:${SUPPORT_EMAIL}`} className={link}>
                {SUPPORT_EMAIL}
              </a>
              <Link href="/contact-us" className={link}>
                Contact us
              </Link>
            </div>
          </div>
        </div>

        <div>
          <dl className="border-t border-line">
            {FAQS.map((f) => (
              <div key={f.id} className="border-b border-line py-6">
                <dt className="text-base font-medium text-fg sm:text-lg">{f.q}</dt>
                <dd className="mt-3 space-y-3 text-[15px] leading-relaxed text-fg-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-sm text-fg-subtle lg:hidden">
            Still have a question?{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className={link}>
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
