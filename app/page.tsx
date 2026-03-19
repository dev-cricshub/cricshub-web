'use client';

import Hero from './components/Hero';
import Features from './components/Features';
import Countdown from './components/Countdown';
import SocialShare from './components/SocialShare';
import Footer from './components/Footer';
import Do from './components/Do';
import LiveStreamBanner from './components/LiveStreamBanner';
import Navbar from './components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* 1. Live stream announcement bar — very top */}
      <LiveStreamBanner />

      {/* 2. Sticky navbar with Login button */}
      <Navbar />

      {/* 3. Page content */}
      <Hero />
      <Countdown />
      <Features />
      <Do />
      <SocialShare />
      <Footer />
    </div>
  );
}