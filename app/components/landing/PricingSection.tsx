import Link from "next/link";
import { cn } from "@/app/components/ui";
import { Section, SectionHead, tile } from "./primitives";

const price = "font-display text-[56px] font-bold leading-none text-white";
const unit = "font-sans text-base font-medium text-[#C3CEE0]";
const name = "text-[15px] font-semibold text-[#D6E2F5]";
const text = "m-0 text-[15px] leading-relaxed text-[#C3CEE0]";
const plan = "ch-lift flex flex-col gap-3.5 rounded-[26px] p-8";

export default function PricingSection() {
  return (
    <Section id="pricing" className="flex flex-col gap-10">
      <SectionHead kicker="Pricing" title="Free to play. Pay only for premium." />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-stretch gap-5" data-anim-stagger="110">
        <article data-anim="scale" className={cn(tile, plan)}>
          <span className={name}>App &amp; scoring</span>
          <span className={price}>Free</span>
          <p className={text}>Live scoring, tournaments, teams and the standard score overlay for every match admin.</p>
        </article>

        <article
          data-anim="scale"
          className={cn(
            plan,
            "ch-gl relative border-[1.5px] border-[#5AA9F0] bg-white/[0.11] shadow-[0_30px_80px_-30px_#5AA9F0]",
          )}
        >
          <span className="absolute -top-[13px] right-6 rounded-full bg-[#5AA9F0] px-3 py-[5px] text-xs font-bold text-[#060A14]">
            Best value
          </span>
          <span className={name}>Subscription</span>
          <span className={price}>
            ₹149<span className={unit}>/month</span>
          </span>
          <p className={text}>Or ₹499 for 6 months. Includes a free premium overlay bundle credit for every match.</p>
        </article>

        <article data-anim="scale" className={cn(tile, plan)}>
          <span className={name}>Overlay bundles</span>
          <span className={price}>
            <span className={unit}>from </span>₹49<span className={unit}>/match</span>
          </span>
          <p className={text}>Premium broadcast graphics for the matches that matter most.</p>
        </article>
      </div>
      <Link
        data-anim="up"
        href="/pricing"
        className="inline-flex min-h-11 items-center self-start text-[15px] font-semibold text-[#5AA9F0] hover:text-[#7CC4FF]"
      >
        See full pricing →
      </Link>
    </Section>
  );
}
