import SiteHeader from "@/app/components/layout/SiteHeader";
import SiteFooter from "@/app/components/layout/SiteFooter";
import HeroSection from "@/app/components/landing/HeroSection";
import LiveScoreboard from "@/app/components/landing/LiveScoreboard";
import FeatureShowcase from "@/app/components/landing/FeatureShowcase";
import ProductStory from "@/app/components/landing/ProductStory";
import AppPreview from "@/app/components/landing/AppPreview";
import FAQSection from "@/app/components/landing/FAQSection";
import FinalCTA from "@/app/components/landing/FinalCTA";

// The landing page is always-dark, independent of the app theme toggle:
// data-theme="dark" scopes the dark tokens to this subtree.
//
// Narrative: what it is (hero) → try it (scoreboard) → what else it does (streaming,
// tournaments, fantasy) → how a match flows end to end → the app in your pocket →
// objections (FAQ) → close.
export default function Home() {
  return (
    <div data-theme="dark" className="landing bg-canvas text-fg">
      <SiteHeader variant="cinematic" />
      <main>
        <HeroSection />
        <LiveScoreboard />
        <FeatureShowcase />
        <ProductStory />
        <AppPreview />
        <FAQSection />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}
