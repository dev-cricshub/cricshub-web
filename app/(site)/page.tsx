import SiteHeader from "@/app/components/layout/SiteHeader";
import SiteFooter from "@/app/components/layout/SiteFooter";
import AnnouncementBar from "@/app/components/home/AnnouncementBar";
import Hero from "@/app/components/home/Hero";
import Features from "@/app/components/home/Features";
import Streaming from "@/app/components/home/Streaming";
import AppShowcase from "@/app/components/home/AppShowcase";
import FinalCta from "@/app/components/home/FinalCta";

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <Streaming />
        <AppShowcase />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
