import Image from "next/image";
import Link from "next/link";
import { FeatureOrbit } from "@/app/components/auth/FeatureOrbit";
import { EXPLORE_HREF } from "@/lib/site";
import { CheckItem, PlayStoreButton, ghostCta } from "./primitives";

/** Page-long ambient layer: drifting colour orbs plus the stadium photo behind the hero. */
export function HeroBackdrop() {
  const orb = "absolute rounded-full";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={`ch-home-orb-a ${orb} left-[-10%] top-[-200px] h-[720px] w-[720px] bg-[#5AA9F0] opacity-45 blur-[130px]`} />
      <div className={`ch-home-orb-b ${orb} right-[-12%] top-[300px] h-[760px] w-[760px] bg-[#7C3AED] opacity-40 blur-[140px]`} />

      {/* Stadium photo: dimmed, tinted toward brand navy, and faded into the canvas so the hero copy stays legible. */}
      <div className="absolute inset-x-0 top-0 h-[1180px] overflow-hidden">
        <Image
          src="/images/hero-ground.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%] [filter:saturate(0.9)_brightness(0.6)]"
        />
        <div className="absolute inset-0 bg-[#1E3A6E] opacity-45 mix-blend-color" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_50%_26%,rgba(10,14,23,0.55)_0%,rgba(10,14,23,0)_100%)]" />
        {/* Ends on the glass canvas colour (#060A14) so there's no seam where the photo stops */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,23,0.55)_0%,rgba(13,24,48,0.45)_30%,rgba(10,14,23,0.82)_62%,#060A14_92%)]" />
      </div>

      <div className={`ch-home-orb-a ${orb} left-[20%] top-[2200px] h-[700px] w-[700px] bg-[#7C3AED] opacity-30 blur-[140px]`} />
      <div className={`ch-home-orb-b ${orb} right-[-5%] top-[3400px] h-[640px] w-[640px] bg-[#5AA9F0] opacity-30 blur-[130px]`} />
      <div className={`ch-home-orb-a ${orb} left-[-8%] top-[4700px] h-[620px] w-[620px] bg-[#F97316] opacity-[0.18] blur-[130px]`} />
    </div>
  );
}

export default function HeroSection() {
  return (
    // Exactly one screen below the 4rem sticky header: type, gaps and the orbit scale with viewport height.
    // Phones stack the orbit under the copy and let it shrink into whatever height is left.
    <section className="flex h-[calc(100svh-4rem)] min-h-[520px] flex-col justify-center gap-[clamp(16px,4vh,56px)] py-[clamp(16px,4vh,48px)] lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-none flex-col gap-[clamp(14px,3.2vh,28px)] lg:flex-1" data-anim-stagger="80">
        <Link
          data-anim="up"
          href={EXPLORE_HREF}
          className="ch-enter ch-gl inline-flex items-center gap-2.5 self-start rounded-full border border-white/[0.16] bg-white/[0.07] py-1.5 pl-1.5 pr-3.5 text-sm text-[#D6E2F5] transition-colors hover:text-white"
        >
          <span className="rounded-full bg-[#5AA9F0] px-[9px] py-[5px] text-[11px] font-bold tracking-[0.08em] text-[#060A14]">NEW</span>
          Run player auctions for your league
          <span aria-hidden>→</span>
        </Link>

        <h1 data-anim="up" className="ch-enter m-0 font-display text-[clamp(2.75rem,min(8.5vw,10.5vh),6rem)] font-bold uppercase leading-[0.9] text-white [animation-delay:0.08s]">
          Every ball. Every league. <span className="text-[#5AA9F0]">Live.</span>
        </h1>

        <p data-anim="up" className="ch-enter m-0 max-w-[540px] text-[clamp(15px,2.1vh,18px)] leading-relaxed text-[#D6E2F5] [animation-delay:0.16s]">
          Score every ball, run your league from fixtures to final, and stream matches to YouTube with pro overlays. All
          from one free app.
        </p>

        <div data-anim="up" className="ch-enter flex flex-wrap gap-3 [animation-delay:0.24s]">
          <PlayStoreButton />
          <a href="#how" className={ghostCta()}>
            See how it works
          </a>
        </div>

        <ul data-anim="up" className="ch-enter m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm text-[#C3CEE0] [animation-delay:0.32s]">
          <li>
            <CheckItem>Free to use</CheckItem>
          </li>
          <li>
            <CheckItem>Free YouTube overlay</CheckItem>
          </li>
          <li>
            <CheckItem>Any format, any overs</CheckItem>
          </li>
        </ul>
      </div>

      <div data-anim="scale" className="ch-enter min-h-0 min-w-0 flex-1 basis-0 [animation-delay:0.2s] max-lg:max-h-[340px] lg:h-[min(420px,60vh)] lg:flex-none lg:basis-auto lg:w-[46%]">
        <FeatureOrbit />
      </div>
    </section>
  );
}
