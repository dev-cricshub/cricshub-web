import SiteHeader from "@/app/components/layout/SiteHeader";
import SiteFooter from "@/app/components/layout/SiteFooter";
import HeroSection, { HeroBackdrop } from "@/app/components/landing/HeroSection";
import StatsStrip from "@/app/components/landing/StatsStrip";
import FeatureBento from "@/app/components/landing/FeatureBento";
import StreamingShowcase from "@/app/components/landing/StreamingShowcase";
import TournamentShowcase from "@/app/components/landing/TournamentShowcase";
import AudienceMarquee from "@/app/components/landing/AudienceMarquee";
import HowItWorks from "@/app/components/landing/HowItWorks";
import Testimonials from "@/app/components/landing/Testimonials";
import PricingSection from "@/app/components/landing/PricingSection";
import FAQSection from "@/app/components/landing/FAQSection";
import DownloadCTA from "@/app/components/landing/DownloadCTA";

// The landing page has its own dark palette:
// data-theme="dark" scopes the dark tokens to this subtree, and .landing swaps in
// the landing palette + body font (see app/styles/tokens.css).
//
// Narrative: what it is (hero) → proof (numbers) → what it does (bento) → streaming
// and tournaments up close → who it's for → how a match flows → pricing → objections (FAQ) → close.
export default function Home() {
  return (
    // overflow-x-clip (not hidden) so the sticky header keeps working
    <div data-theme="dark" className="landing relative overflow-x-clip bg-canvas text-fg">
      <HeroBackdrop />
      <SiteHeader variant="cinematic" />
      <main>
        <HeroSection />
        <StatsStrip />
        <FeatureBento />
        <section id="showcase" className="relative mx-auto flex max-w-[1200px] flex-col gap-24 px-6 pb-10 pt-[60px]">
          <StreamingShowcase />
          <TournamentShowcase />
        </section>
        <AudienceMarquee />
        <HowItWorks />
        <Testimonials />
        <PricingSection />
        <FAQSection />
        <DownloadCTA />
      </main>
      <SiteFooter />
    </div>
  );
}
