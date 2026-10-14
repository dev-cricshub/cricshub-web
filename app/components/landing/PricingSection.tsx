import Link from "next/link";
import { cn } from "@/app/components/ui";
import { Section, SectionHead } from "./primitives";

const price = "font-display text-[52px] font-extrabold leading-none";
const unit = "text-xl text-fg-muted";
const body = "m-0 text-sm leading-[1.55] text-fg-muted";
const plan = "flex flex-col gap-3.5 rounded-[28px] border p-[30px]";

export default function PricingSection() {
  return (
    <Section id="pricing" className="pb-20 pt-[60px]">
      <SectionHead kicker="Pricing" title="Free to play. Pay only for premium." />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        <div className={cn(plan, "border-line bg-surface")}>
          <span className="text-[15px] font-extrabold">App &amp; scoring</span>
          <span className={price}>Free</span>
          <p className={body}>Live scoring, tournaments, teams and the standard score overlay for every match admin.</p>
        </div>

        <div
          className={cn(
            plan,
            "border-primary bg-[linear-gradient(160deg,#16274A_0%,#131A2A_70%)] shadow-[0_20px_50px_rgba(47,109,184,0.25)]",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-extrabold">Subscription</span>
            <span className="rounded-full bg-primary px-2.5 py-[5px] text-[11px] font-extrabold text-white">Best value</span>
          </div>
          <span className={price}>
            ₹149<span className={unit}>/month</span>
          </span>
          <p className={body}>Or ₹499 for 6 months. Includes a free premium overlay bundle credit for every match.</p>
        </div>

        <div className={cn(plan, "border-line bg-surface")}>
          <span className="text-[15px] font-extrabold">Overlay bundles</span>
          <span className={price}>
            <span className={unit}>from </span>₹49<span className={unit}>/match</span>
          </span>
          <p className={body}>Premium broadcast graphics for the matches that matter most.</p>
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <Link href="/pricing" className="text-[15px] font-bold text-accent-soft hover:text-primary-soft-fg">
          See full pricing →
        </Link>
      </div>
    </Section>
  );
}
