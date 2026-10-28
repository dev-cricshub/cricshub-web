import SiteHeader from "@/app/components/layout/SiteHeader";
import SiteFooter from "@/app/components/layout/SiteFooter";
import HeroSection, { HeroBackdrop } from "@/app/components/landing/HeroSection";
import StatsStrip from "@/app/components/landing/StatsStrip";
import FeatureBento from "@/app/components/landing/FeatureBento";
import StreamingShowcase from "@/app/components/landing/StreamingShowcase";
import TournamentShowcase from "@/app/components/landing/TournamentShowcase";
import Audience from "@/app/components/landing/Audience";
import HowItWorks from "@/app/components/landing/HowItWorks";
import Testimonials from "@/app/components/landing/Testimonials";
import PricingSection from "@/app/components/landing/PricingSection";
import FAQSection from "@/app/components/landing/FAQSection";
import DownloadCTA from "@/app/components/landing/DownloadCTA";
import ScrollMotion from "@/app/components/landing/ScrollMotion";

// The landing page uses the glass theme (app/styles/glass.css) on its own dark canvas.
// data-theme="dark" + .landing keep the shared header/footer on the landing palette (see tokens.css).
//
// Narrative: what it is (hero) → proof (numbers) → what it does (bento) → streaming
// and tournaments up close → who it's for → how a match flows → pricing → objections (FAQ) → close.
export default function Home() {
  return (
    // overflow-x-clip (not hidden) so the sticky header keeps working
    <div data-theme="dark" className="landing ch-home relative overflow-x-clip">
      <HeroBackdrop />
      <SiteHeader variant="cinematic" />
      <main className="relative mx-auto flex max-w-[1200px] flex-col gap-[clamp(88px,10vw,140px)] px-6">
        <HeroSection />
        <StatsStrip />
        <FeatureBento />
        <StreamingShowcase />
        <TournamentShowcase />
        <Audience />
        <HowItWorks />
        <Testimonials />
        <PricingSection />
        <FAQSection />
        <DownloadCTA />
      </main>
      <SiteFooter variant="glass" />
      <ScrollMotion />
    </div>
  );
}
