"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import UpiCheckoutModal from "@/app/components/UpiCheckoutModal";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type BillingCycle = "monthly" | "sixmonth";
type PageStep = "plans" | "checkout" | "success";

interface SubscriptionPlan {
  id: string;
  cycle: BillingCycle;
  name: string;
  price: number;
  originalPrice?: number;
  perMonth?: number;
  badge?: string;
  highlight: boolean;
  streamingFeatures: string[];
  bundleFeatures: string[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  itemType: "subscription";
  meta?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "sub-monthly",
    cycle: "monthly",
    name: "Monthly",
    price: 149,
    originalPrice: 299,
    perMonth: 149,
    badge: "Most Flexible",
    highlight: false,
    streamingFeatures: [
      "Professional OBS overlay integration",
      "Real-time score sync · updates every ball",
      "Stream lock & co-host handover",
      "Priority support",
    ],
    bundleFeatures: [
      "1 free bundle credit per match you create",
      "Choose any style — IPL, WPL, Champions Trophy or Border-Gavaskar",
      "8 broadcast overlays unlocked instantly",
      "Unlimited matches covered",
    ],
  },
  {
    id: "sub-6month",
    cycle: "sixmonth",
    name: "6-Month Plan",
    price: 499,
    originalPrice: 999,
    perMonth: 83,
    badge: "Best Value",
    highlight: true,
    streamingFeatures: [
      "Everything in Monthly",
      "Early access to new overlay templates",
      "Usage analytics dashboard",
      "Priority support",
    ],
    bundleFeatures: [
      "1 free bundle credit per match · all 4 styles",
      "Just ₹83/month · saves ₹395 vs monthly",
      "Extended match history & reporting",
      "Multi-match management view",
    ],
  },
];

// Real bundle catalogue — mirrors what the stream dashboard fetches from backend
const BUNDLE_CATALOGUE = [
  {
    id: "bundle-basic",
    name: "IPL Bundle",
    price: 49,
    originalPrice: 99,
    gradient: "linear-gradient(135deg,#34B8FF,#1E88E5)",
    accentColor: "#1E88E5",
    desc: "8 clean professional overlays — the essential streaming kit for every match.",
    overlayCount: 8,
    overlays: [
      "Main Match Banner",
      "Live Score Overlay",
      "Match Summary",
      "Playing XI — Both Teams",
      "Batting XI (Team 1 & Team 2)",
      "Bowling XI (Team 1 & Team 2)",
    ],
    bannerKeys: [
      "main",
      "score",
      "summary",
      "playingXI_combined",
      "playingXI_bat_team1",
      "playingXI_bat_team2",
      "playingXI_bowl_team1",
      "playingXI_bowl_team2",
    ],
  },
  {
    id: "bundle-glass",
    name: "WPL Bundle",
    price: 49,
    originalPrice: 99,
    gradient: "linear-gradient(135deg,#00D4AA,#22D3EE)",
    accentColor: "#00D4AA",
    desc: "Frosted-glass aesthetic with teal glow accents — premium broadcast look.",
    overlayCount: 8,
    overlays: [
      "WPL Main Match Banner",
      "WPL Score Overlay",
      "WPL Match Summary",
      "WPL Playing XI — Both Teams",
      "WPL Batting XI (Team 1 & Team 2)",
      "WPL Bowling XI (Team 1 & Team 2)",
    ],
    bannerKeys: [
      "glass_main",
      "glass_score",
      "glass_summary",
      "glass_xi_combined",
      "glass_bat_team1",
      "glass_bat_team2",
      "glass_bowl_team1",
      "glass_bowl_team2",
    ],
  },
  {
    id: "bundle-material",
    name: "Champions Trophy Bundle",
    price: 49,
    originalPrice: 99,
    gradient: "linear-gradient(135deg,#009688,#00BCD4)",
    accentColor: "#009688",
    desc: "Clean flat-design overlays with crisp solid colors and stark broadcast typography.",
    overlayCount: 8,
    overlays: [
      "Champions Trophy Main Match Banner",
      "Champions Trophy Score Overlay",
      "Champions Trophy Match Summary",
      "Champions Trophy Playing XI — Both Teams",
      "Champions Trophy Batting XI (Team 1 & Team 2)",
      "Champions Trophy Bowling XI (Team 1 & Team 2)",
    ],
    bannerKeys: [
      "material_main",
      "material_score",
      "material_summary",
      "material_xi_combined",
      "material_bat_team1",
      "material_bat_team2",
      "material_bowl_team1",
      "material_bowl_team2",
    ],
  },
  {
    id: "bundle-aero",
    name: "Border-Gavaskar Bundle",
    price: 49,
    originalPrice: 99,
    gradient: "linear-gradient(135deg,#E0F2FE,#0D9488)",
    accentColor: "#0D9488",
    desc: "Apple-inspired floating islands with pill aesthetics — elegant light-mode design.",
    overlayCount: 8,
    overlays: [
      "Border-Gavaskar Main Match Banner",
      "Border-Gavaskar Score Stack",
      "Border-Gavaskar Match Summary",
      "Border-Gavaskar Playing XI — Both Teams",
      "Border-Gavaskar Batting XI (Team 1 & Team 2)",
      "Border-Gavaskar Bowling XI (Team 1 & Team 2)",
    ],
    bannerKeys: [
      "aero_main",
      "aero_score",
      "aero_summary",
      "aero_xi_combined",
      "aero_bat_team1",
      "aero_bat_team2",
      "aero_bowl_team1",
      "aero_bowl_team2",
    ],
  },
];

// Overlay details for preview — mirrors BUNDLE_OVERLAY_DETAILS in stream dashboard
const BUNDLE_OVERLAY_DETAILS: Record<
  string,
  { icon: string; title: string; desc: string; previewBg: string }
> = {
  main:                { icon: "ri-layout-top-2-line", title: "Main Match Banner",        desc: "Tournament name, both teams, venue, date and toss result.",                          previewBg: "linear-gradient(135deg,#34B8FF,#1E88E5)" },
  score:               { icon: "ri-bar-chart-line",    title: "Live Score Overlay",        desc: "Always-on bottom bar — live score, batters, bowler and ball-by-ball.",              previewBg: "linear-gradient(135deg,#0a1628,#1E88E5)" },
  summary:             { icon: "ri-file-list-3-line",  title: "Match Summary",             desc: "Top batters & bowlers from both teams.",                                             previewBg: "linear-gradient(135deg,#E2B94B,#8B6914)" },
  playingXI_combined:  { icon: "ri-team-line",         title: "Playing XI — Both Teams",   desc: "Side-by-side full lineup with player roles and captain badge.",                      previewBg: "linear-gradient(135deg,#4A9EF5,#A855F7)" },
  playingXI_bat_team1: { icon: "ri-group-line",        title: "Batting XI (Team 1)",        desc: "Full batting lineup for Team 1.",                                                    previewBg: "linear-gradient(135deg,#00b4d8,#0077b6)" },
  playingXI_bat_team2: { icon: "ri-group-line",        title: "Batting XI (Team 2)",        desc: "Full batting lineup for Team 2.",                                                    previewBg: "linear-gradient(135deg,#00b4d8,#0077b6)" },
  playingXI_bowl_team1:{ icon: "ri-group-2-line",      title: "Bowling XI (Team 1)",        desc: "Bowling lineup for Team 1.",                                                        previewBg: "linear-gradient(135deg,#8E54E9,#4776E6)" },
  playingXI_bowl_team2:{ icon: "ri-group-2-line",      title: "Bowling XI (Team 2)",        desc: "Bowling lineup for Team 2.",                                                        previewBg: "linear-gradient(135deg,#8E54E9,#4776E6)" },
  glass_main:          { icon: "ri-layout-top-2-line", title: "WPL Match Banner",                    desc: "Frosted-glass panel with teal glow accents.",                                       previewBg: "linear-gradient(135deg,#00D4AA,#22D3EE)" },
  glass_score:         { icon: "ri-bar-chart-line",    title: "WPL Score Overlay",                   desc: "Bottom score bar with backdrop blur and teal glow border.",                         previewBg: "linear-gradient(135deg,#00D4AA,#0a1628)" },
  glass_summary:       { icon: "ri-file-list-3-line",  title: "WPL Match Summary",                   desc: "Frosted-glass innings panels with cyan/pink accents.",                              previewBg: "linear-gradient(135deg,#0a1628,#22D3EE)" },
  glass_xi_combined:   { icon: "ri-team-line",         title: "WPL Playing XI",                      desc: "Two-column glassmorphism lineup card.",                                             previewBg: "linear-gradient(135deg,#22D3EE,#F472B6)" },
  glass_bat_team1:     { icon: "ri-group-line",        title: "WPL Batting XI (Team 1)",             desc: "Frosted batting lineup for Team 1.",                                                previewBg: "linear-gradient(135deg,#22D3EE,#0077b6)" },
  glass_bat_team2:     { icon: "ri-group-line",        title: "WPL Batting XI (Team 2)",             desc: "Frosted batting lineup for Team 2.",                                                previewBg: "linear-gradient(135deg,#22D3EE,#0077b6)" },
  glass_bowl_team1:    { icon: "ri-group-2-line",      title: "WPL Bowling XI (Team 1)",             desc: "Frosted bowling lineup for Team 1.",                                                previewBg: "linear-gradient(135deg,#00D4AA,#F472B6)" },
  glass_bowl_team2:    { icon: "ri-group-2-line",      title: "WPL Bowling XI (Team 2)",             desc: "Frosted bowling lineup for Team 2.",                                                previewBg: "linear-gradient(135deg,#00D4AA,#F472B6)" },
  material_main:          { icon: "ri-layout-top-2-line", title: "Champions Trophy Match Banner",    desc: "Clean flat-design tournament banner.",                previewBg: "#009688" },
  material_score:         { icon: "ri-bar-chart-line",    title: "Champions Trophy Score Overlay",   desc: "Solid high-contrast bottom score bar.",               previewBg: "#111827" },
  material_summary:       { icon: "ri-file-list-3-line",  title: "Champions Trophy Match Summary",   desc: "Flat color-blocked innings panels.",                  previewBg: "#030712" },
  material_xi_combined:   { icon: "ri-team-line",         title: "Champions Trophy Playing XI",      desc: "Side-by-side solid lineup card.",                     previewBg: "#00BCD4" },
  material_bat_team1:     { icon: "ri-group-line",        title: "Champions Trophy Batting XI (Team 1)", desc: "Solid batting lineup for Team 1.",                previewBg: "#00BCD4" },
  material_bat_team2:     { icon: "ri-group-line",        title: "Champions Trophy Batting XI (Team 2)", desc: "Solid batting lineup for Team 2.",                previewBg: "#00BCD4" },
  material_bowl_team1:    { icon: "ri-group-2-line",      title: "Champions Trophy Bowling XI (Team 1)", desc: "Solid bowling lineup for Team 1.",                previewBg: "#E91E63" },
  material_bowl_team2:    { icon: "ri-group-2-line",      title: "Champions Trophy Bowling XI (Team 2)", desc: "Solid bowling lineup for Team 2.",                previewBg: "#E91E63" },
  aero_main:           { icon: "ri-layout-top-2-line", title: "Border-Gavaskar Match Banner",         desc: "Floating modular stack with tournament pill and team islands.",                    previewBg: "#F3F4F6" },
  aero_score:          { icon: "ri-bar-chart-line",    title: "Border-Gavaskar Score Stack",           desc: "Decoupled modular floating islands.",                                              previewBg: "#FFFFFF" },
  aero_summary:        { icon: "ri-file-list-3-line",  title: "Border-Gavaskar Match Summary",         desc: "Elegant light-mode panels with soft gray backgrounds.",                           previewBg: "#F3F4F6" },
  aero_xi_combined:    { icon: "ri-team-line",         title: "Border-Gavaskar Playing XI",            desc: "Clean floating lineup with role pills.",                                           previewBg: "#FFFFFF" },
  aero_bat_team1:      { icon: "ri-group-line",        title: "Border-Gavaskar Batting XI (Team 1)",   desc: "Light-themed batting card — Team 1.",                                             previewBg: "#E0F2FE" },
  aero_bat_team2:      { icon: "ri-group-line",        title: "Border-Gavaskar Batting XI (Team 2)",   desc: "Light-themed batting card — Team 2.",                                             previewBg: "#E0F2FE" },
  aero_bowl_team1:     { icon: "ri-group-2-line",      title: "Border-Gavaskar Bowling XI (Team 1)",   desc: "Minimalist bowling lineup — Team 1.",                                             previewBg: "#FFE4E6" },
  aero_bowl_team2:     { icon: "ri-group-2-line",      title: "Border-Gavaskar Bowling XI (Team 2)",   desc: "Minimalist bowling lineup — Team 2.",                                             previewBg: "#FFE4E6" },
};

// Real premium add-on templates — mirrors ADDON_TEMPLATES in the stream dashboard
// These are fetched from backend in the dashboard; here they are shown as a static showcase
const ADDON_TEMPLATES = [
  {
    id: "tpl-pro-1",
    name: "Event Burst",
    tier: "pro" as const,
    price: 39,
    originalPrice: 79,
    previewGradient: "linear-gradient(135deg,#00F5A0,#00D9F5)",
    popular: true,
    features: [
      "Full-screen burst animations on 4, 6, wicket, 50 & 100",
      "Two-tone broadcast scorebar with team panels",
      "Animated ball-by-ball over tracker",
      "Live batter stats with strike rate badge",
      "Bowler figures with wicket highlight",
      "Target & required run rate display",
    ],
  },
  {
    id: "tpl-pro-2",
    name: "Inline Burst",
    tier: "pro" as const,
    price: 29,
    originalPrice: 59,
    previewGradient: "linear-gradient(135deg,#F7971E,#FFD200)",
    features: [
      "In-bar light beam animation on 4, 6, wicket, 50 & 100",
      "Broadcast-style scorebar",
      "No full-screen overlay takeover",
      "Player name & stat reveal on event",
    ],
  },
  {
    id: "tpl-pro-3",
    name: "Win Predictor",
    tier: "pro" as const,
    price: 21,
    originalPrice: 49,
    previewGradient: "linear-gradient(135deg,#2193b0,#6dd5ed)",
    features: [
      "Live win probability meter",
      "Updates every ball automatically",
      "Pressure colour system — green to red",
      "CRR vs RRR analysis",
      "Wickets & balls remaining context",
    ],
  },
  {
    id: "tpl-pro-4",
    name: "Stream Branding",
    tier: "pro" as const,
    price: 39,
    originalPrice: 79,
    previewGradient: "linear-gradient(135deg,#667eea,#764ba2)",
    popular: true,
    features: [
      "Custom logo upload",
      "LIVE badge & match title strip",
      "Social handle & sponsor slot",
      "Corner vignette & stream watermark",
    ],
  },
  {
    id: "tpl-pro-5",
    name: "Media Reel",
    tier: "pro" as const,
    price: 49,
    originalPrice: 99,
    previewGradient: "linear-gradient(135deg,#f093fb,#f5576c)",
    features: [
      "Upload images & videos (up to 10 assets)",
      "Broadcast-style frame with custom sequence",
      "Loop playback & full-screen takeover",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const cartTotal = (cart: CartItem[]) => cart.reduce((s, i) => s + i.price, 0);

// ═══════════════════════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function SectionLabel({
  icon,
  label,
  sub,
}: {
  icon: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5 sm:mb-6">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] flex items-center justify-center shadow-md shadow-blue-200 flex-shrink-0">
        <i className={`${icon} text-white text-base`} />
      </div>
      <div>
        <h2 className="font-black text-gray-900 text-lg sm:text-xl leading-none">
          {label}
        </h2>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERLAY PREVIEW MODAL  (iframe into /preview?overlay=key)
// ═══════════════════════════════════════════════════════════════════════════

function OverlayPreviewModal({
  bannerKey,
  bannerTitle,
  previewBg,
  onClose,
}: {
  bannerKey: string;
  bannerTitle: string;
  previewBg: string;
  onClose: () => void;
}) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const previewUrl = `/preview?overlay=${bannerKey}`;

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.93)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Header */}
      <div className="w-full max-w-5xl px-4 pb-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: previewBg }} />
          <div>
            <p className="text-white font-black text-sm">{bannerTitle}</p>
            <p className="text-white/40 text-xs">Live preview · 1920×1080 · sample data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all"
          >
            <i className="ri-external-link-line" />
            Open full size
          </a>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <i className="ri-close-line text-white" />
          </button>
        </div>
      </div>

      {/* 16:9 iframe */}
      <div className="w-full max-w-5xl px-4 flex-shrink-0">
        <div
          className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
          style={{ aspectRatio: "16/9" }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/images/matchStalkImage.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <i className="ri-loader-4-line text-white/40 text-3xl animate-spin mb-3" />
              <p className="text-white/40 text-sm font-medium">Loading overlay preview…</p>
            </div>
          )}
          <iframe
            src={previewUrl}
            className="absolute inset-0 w-full h-full"
            style={{ border: "none", opacity: iframeLoaded ? 1 : 0, transition: "opacity 0.3s" }}
            onLoad={() => setIframeLoaded(true)}
            allow="autoplay"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-5xl px-4 pt-3 flex items-center justify-between">
        <p className="text-white/30 text-xs">
          Preview uses sample data — actual overlay will show live match data
        </p>
        <button
          onClick={onClose}
          className="text-xs font-bold text-white/50 hover:text-white transition-colors"
        >
          Close preview
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BUNDLE OVERLAY LIST MODAL  (grid of all overlays in a bundle)
// ═══════════════════════════════════════════════════════════════════════════

function BundleOverlayListModal({
  bundle,
  onClose,
  onPreview,
}: {
  bundle: (typeof BUNDLE_CATALOGUE)[0];
  onClose: () => void;
  onPreview: (key: string, title: string, bg: string) => void;
}) {
  const cards = bundle.bannerKeys
    .map((key) => ({ key, ...BUNDLE_OVERLAY_DETAILS[key] }))
    .filter((c) => c.icon);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl w-full sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: bundle.gradient }}
            >
              <i className="ri-stack-line text-white" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-base sm:text-lg leading-none">
                {bundle.name}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {cards.length} overlays · ₹{bundle.price}/match · click any to preview
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <i className="ri-close-line text-gray-600 text-lg" />
          </button>
        </div>

        {/* Desc strip */}
        <div className="px-5 sm:px-6 py-3 bg-blue-50 border-b border-blue-100 flex-shrink-0">
          <p className="text-sm text-blue-800">{bundle.desc}</p>
        </div>

        {/* Overlay grid */}
        <div
          className="overflow-y-auto overscroll-contain p-4 sm:p-6"
          style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {cards.map((card) => (
              <div
                key={card.key}
                className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className="h-16 sm:h-20 w-full relative flex items-center justify-center"
                  style={{ background: card.previewBg }}
                >
                  <div className="bg-black/25 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                    <i className={`${card.icon} text-white text-sm`} />
                    <span className="text-white text-[10px] font-black tracking-widest uppercase">
                      OBS Overlay
                    </span>
                  </div>
                  <button
                    onClick={() => onPreview(card.key, card.title, card.previewBg)}
                    className="absolute top-1.5 right-2 flex items-center gap-1 bg-black/40 hover:bg-black/65 text-white text-[9px] font-bold px-2 py-1 rounded-full transition-colors backdrop-blur-sm"
                  >
                    <i className="ri-eye-line text-xs" />
                    Preview
                  </button>
                </div>
                <div className="p-3 sm:p-4">
                  <p className="font-black text-gray-900 text-sm leading-tight">{card.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4 flex-shrink-0">
          <p className="text-xs text-gray-400">All overlays update in real time with live match data.</p>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-sm font-bold rounded-xl hover:shadow-md transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAN CARD
// ═══════════════════════════════════════════════════════════════════════════

function PlanCard({
  plan,
  inCart,
  onToggle,
}: {
  plan: SubscriptionPlan;
  inCart: boolean;
  onToggle: () => void;
}) {
  const savings = plan.originalPrice ? plan.originalPrice - plan.price : 0;
  const savePct = plan.originalPrice
    ? Math.round((savings / plan.originalPrice) * 100)
    : 0;

  if (plan.highlight) {
    // ── Premium dark card (6-Month) ──────────────────────────────────────
    return (
      <div
        onClick={onToggle}
        className={`relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 select-none
          ${inCart ? "ring-2 ring-[#34B8FF] shadow-2xl shadow-blue-500/25 scale-[1.02]" : "shadow-xl hover:shadow-2xl hover:shadow-blue-900/40 hover:scale-[1.01]"}`}
        style={{ background: "linear-gradient(145deg,#0B1F40 0%,#0e2a58 60%,#1a3a6e 100%)" }}
      >
        {/* Subtle glow orbs */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-400/8 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-indigo-500/8 blur-3xl pointer-events-none" />
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#34B8FF]/60 to-transparent" />

        <div className="relative z-10 p-6 sm:p-7 flex flex-col h-full">
          {/* Badge row */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">
              {plan.badge}
            </span>
            <span className="flex items-center gap-1 bg-amber-400 text-amber-900 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
              🏷 Launch Offer
            </span>
          </div>

          {/* Plan name */}
          <h3 className="text-white font-black text-xl sm:text-2xl mb-4">
            {plan.name}
          </h3>

          {/* Pricing block */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1.5">
              {plan.originalPrice && (
                <span className="text-white/35 text-base font-semibold line-through">
                  {fmt(plan.originalPrice)}
                </span>
              )}
              {savePct > 0 && (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {savePct}% OFF
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-white font-black text-4xl sm:text-5xl tracking-tight">
                {fmt(plan.price)}
              </span>
              <span className="text-white/45 text-sm">for 6 months</span>
            </div>
            {plan.perMonth && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-blue-300 text-xs font-bold">
                  ≈ ₹{plan.perMonth}/month
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-white/35 text-xs">
                  Save {fmt(savings)}
                </span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 mb-5" />

          {/* Features */}
          <div className="space-y-4 mb-6 flex-1">
            <div>
              <p className="text-[9px] font-black text-blue-300/60 uppercase tracking-widest mb-2.5">
                Streaming Dashboard
              </p>
              <ul className="space-y-2">
                {plan.streamingFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/65">
                    <i className="ri-check-circle-fill text-[#34B8FF] flex-shrink-0 mt-0.5 text-[13px]" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[9px] font-black text-blue-300/60 uppercase tracking-widest mb-2.5">
                Included Overlays
              </p>
              <ul className="space-y-2">
                {plan.bundleFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/65">
                    <i className="ri-check-circle-fill text-[#34B8FF] flex-shrink-0 mt-0.5 text-[13px]" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div
            className={`w-full py-3.5 rounded-xl text-sm font-black text-center transition-all duration-200 ${
              inCart
                ? "bg-[#34B8FF]/15 text-[#34B8FF] border border-[#34B8FF]/30"
                : "bg-white text-[#0D2654] hover:bg-blue-50"
            }`}
          >
            {inCart ? "✓ Selected" : "⚡ Get Best Value"}
          </div>
        </div>
      </div>
    );
  }

  // ── Clean white card (Monthly) ─────────────────────────────────────────
  return (
    <div
      onClick={onToggle}
      className={`relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 select-none bg-white
        ${inCart ? "ring-2 ring-[#34B8FF] shadow-2xl shadow-blue-100 scale-[1.02]" : "border-2 border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-lg hover:scale-[1.01]"}`}
    >
      {/* Subtle top gradient strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5]" />

      <div className="p-6 sm:p-7 flex flex-col h-full pt-7">
        {/* Badge row */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {plan.badge}
          </span>
          <span className="flex items-center gap-1 bg-amber-400 text-amber-900 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
            🏷 Launch Offer
          </span>
        </div>

        {/* Plan name */}
        <h3 className="text-gray-900 font-black text-xl sm:text-2xl mb-4">
          {plan.name}
        </h3>

        {/* Pricing block */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1.5">
            {plan.originalPrice && (
              <span className="text-gray-350 text-base font-semibold line-through text-gray-400">
                {fmt(plan.originalPrice)}
              </span>
            )}
            {savePct > 0 && (
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-100">
                {savePct}% OFF
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[#1E88E5] font-black text-4xl sm:text-5xl tracking-tight">
              {fmt(plan.price)}
            </span>
            <span className="text-gray-400 text-sm">/month</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mb-5" />

        {/* Features */}
        <div className="space-y-4 mb-6 flex-1">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2.5">
              Streaming Dashboard
            </p>
            <ul className="space-y-2">
              {plan.streamingFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <i className="ri-check-circle-fill text-[#34B8FF] flex-shrink-0 mt-0.5 text-[13px]" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2.5">
              Included Overlays
            </p>
            <ul className="space-y-2">
              {plan.bundleFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <i className="ri-check-circle-fill text-[#34B8FF] flex-shrink-0 mt-0.5 text-[13px]" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div
          className={`w-full py-3.5 rounded-xl text-sm font-black text-center transition-all duration-200 ${
            inCart
              ? "bg-[#34B8FF]/10 text-[#1E88E5] border-2 border-[#34B8FF]/25"
              : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-blue-50 hover:text-[#1E88E5] hover:border-blue-100"
          }`}
        >
          {inCart ? "✓ Selected" : "Select Plan"}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BUNDLE SHOWCASE CARD
// ═══════════════════════════════════════════════════════════════════════════

function BundleShowcaseCard({
  bundle,
  onPreview,
}: {
  bundle: (typeof BUNDLE_CATALOGUE)[0];
  onPreview: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all flex flex-col">
      <div
        className="h-24 sm:h-28 relative flex-shrink-0"
        style={{ background: bundle.gradient }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-black/25 backdrop-blur-sm text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full">
            OBS Overlays
          </span>
        </div>
        <div className="absolute top-2.5 left-2.5 bg-white/20 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-full">
          {bundle.overlayCount} overlays
        </div>
        <div className="absolute top-2.5 right-2.5 bg-amber-400 text-amber-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
          🏷 Launch Offer
        </div>
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p className="font-black text-gray-900 text-base">{bundle.name}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">
              {bundle.desc}
            </p>
          </div>
          <div className="text-right flex-shrink-0 pl-2">
            {bundle.originalPrice && (
              <p className="text-xs text-gray-400 line-through leading-none mb-0.5">
                {fmt(bundle.originalPrice)}
              </p>
            )}
            <p className="font-black text-gray-900 text-lg leading-none">
              {fmt(bundle.price)}
            </p>
            <p className="text-[10px] text-gray-400">per match</p>
          </div>
        </div>

        {/* Overlay list — collapsible */}
        <ul
          className={`space-y-1 mt-3 overflow-hidden transition-all duration-300 flex-1 ${expanded ? "max-h-96" : "max-h-20"}`}
        >
          {bundle.overlays.map((o, i) => (
            <li
              key={i}
              className="flex items-start gap-1.5 text-xs text-gray-500"
            >
              <i className="ri-check-line text-[#34B8FF] flex-shrink-0 mt-0.5" />
              {o}
            </li>
          ))}
        </ul>
        {bundle.overlays.length > 3 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 text-xs font-bold text-[#34B8FF] hover:text-[#1E88E5] flex items-center gap-1 transition-colors"
          >
            <i className={`ri-arrow-${expanded ? "up" : "down"}-s-line`} />
            {expanded
              ? "Show less"
              : `+${bundle.overlays.length - 3} more overlays`}
          </button>
        )}

        <div className="flex gap-2 mt-3">
          <button
            onClick={onPreview}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:shadow-md hover:shadow-blue-200 transition-all"
          >
            <i className="ri-eye-line" />
            Preview Overlays
          </button>
          <div className="flex-shrink-0 py-2.5 px-3 rounded-xl bg-gray-50 text-gray-400 text-xs font-bold text-center border border-gray-100 flex items-center justify-center gap-1.5">
            <i className="ri-broadcast-line" />
            Dashboard
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADD-ON SHOWCASE CARD (view-only — purchase from Stream Dashboard)
// ═══════════════════════════════════════════════════════════════════════════

function AddOnShowcaseCard({
  tpl,
  onPreview,
}: {
  tpl: (typeof ADDON_TEMPLATES)[0];
  onPreview: () => void;
}) {
  const tierStyle = "bg-amber-100 text-amber-700 border-amber-200";

  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all flex flex-col">
      <div
        className="h-24 sm:h-28 relative flex-shrink-0 cursor-pointer group"
        style={{ background: tpl.previewGradient }}
        onClick={onPreview}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-black/25 backdrop-blur-sm text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full group-hover:bg-black/40 transition-colors">
            OBS Overlay
          </span>
        </div>
        {/* Preview hint on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <i className="ri-eye-line" />
            Click to preview
          </span>
        </div>
        {(tpl as any).popular && (
          <div className="absolute top-2.5 left-2.5 bg-amber-400 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
            🔥 Popular
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <p className="font-black text-gray-900 text-base">{tpl.name}</p>
            <span
              className={`text-[9px] font-black border px-2 py-0.5 rounded-full inline-block mt-1 ${tierStyle}`}
            >
              {tpl.tier.toUpperCase()}
            </span>
          </div>
          <div className="text-right flex-shrink-0 pl-2">
            {(tpl as any).originalPrice && (
              <p className="text-xs text-gray-400 line-through leading-none mb-0.5">
                ₹{(tpl as any).originalPrice}
              </p>
            )}
            <p className="font-black text-gray-900 text-lg leading-none">₹{tpl.price}</p>
            <p className="text-[10px] text-gray-400">per match</p>
          </div>
        </div>
        <ul className="space-y-1 mb-4 flex-1">
          {tpl.features.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-1.5 text-xs text-gray-500"
            >
              <i className="ri-check-line text-[#34B8FF] flex-shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mt-auto">
          <button
            onClick={onPreview}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:shadow-md hover:shadow-blue-200 transition-all"
          >
            <i className="ri-eye-line" />
            Preview
          </button>
          <div className="flex-shrink-0 py-2.5 px-3 rounded-xl bg-gray-50 text-gray-400 text-xs font-bold text-center border border-gray-100 flex items-center justify-center gap-1.5">
            <i className="ri-broadcast-line" />
            Dashboard
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUCCESS SCREEN
// ═══════════════════════════════════════════════════════════════════════════

function SuccessScreen({
  plan,
  onDone,
}: {
  plan: SubscriptionPlan;
  onDone: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto text-center py-10 sm:py-12 px-4">
      <div className="relative w-24 sm:w-28 h-24 sm:h-28 mx-auto mb-6 sm:mb-8">
        <div
          className="absolute inset-0 rounded-full bg-emerald-400"
          style={{ animation: "ping .8s ease 1" }}
        />
        <div className="relative w-24 sm:w-28 h-24 sm:h-28 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-2xl shadow-green-200">
          <i className="ri-check-line text-4xl sm:text-5xl text-white" />
        </div>
      </div>
      <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
        All set! 🎉
      </h2>
      <p className="text-gray-500 mb-8 sm:mb-10 text-sm sm:text-base">
        Your <strong>{plan.name}</strong> plan is active once the owner confirms
        your payment. Head to the streaming dashboard to get started.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onDone}
          className="flex-1 h-12 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
        >
          Back to Plans
        </button>
        <Link
          href="/dashboard"
          className="flex-1 h-12 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
        >
          <i className="ri-live-line" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function PricingPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<PageStep>("plans");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Preview modals
  const [previewBundle, setPreviewBundle] = useState<(typeof BUNDLE_CATALOGUE)[0] | null>(null);
  const [previewOverlay, setPreviewOverlay] = useState<{ key: string; title: string; bg: string } | null>(null);

  const openOverlayPreview = (key: string, title: string, bg: string) => {
    setPreviewBundle(null);
    setPreviewOverlay({ key, title, bg });
  };

  const isInCart = (id: string) => cart.some((c) => c.id === id);
  const total = cartTotal(cart); // No GST

  const togglePlan = (plan: SubscriptionPlan) => {
    if (isInCart(plan.id)) {
      setCart([]);
      setSelectedPlan(null);
    } else {
      setCart([
        {
          id: plan.id,
          name: `${plan.name} Subscription`,
          price: plan.price,
          itemType: "subscription",
          meta: plan.cycle === "monthly" ? "₹149/month" : "6-month · ₹499",
        },
      ]);
      setSelectedPlan(plan);
    }
  };

  const handleCheckout = () => {
    const userId = localStorage.getItem("userUUID");
    if (!userId) {
      alert("You must be logged in to purchase a plan.");
      return;
    }
    if (!selectedPlan) return;
    setShowCheckout(true);
  };

  const handlePaymentConfirmed = () => {
    setShowCheckout(false);
    localStorage.setItem("hasSubscription", "true");
    setStep("success");
  };

  const userId =
    typeof window !== "undefined"
      ? (localStorage.getItem("userUUID") ?? "")
      : "";
  const planEnum = selectedPlan?.id === "sub-monthly" ? "MONTHLY" : "SIX_MONTH";

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Bundle overlay list modal */}
      {previewBundle && (
        <BundleOverlayListModal
          bundle={previewBundle}
          onClose={() => setPreviewBundle(null)}
          onPreview={openOverlayPreview}
        />
      )}

      {/* Single overlay preview modal */}
      {previewOverlay && (
        <OverlayPreviewModal
          bannerKey={previewOverlay.key}
          bannerTitle={previewOverlay.title}
          previewBg={previewOverlay.bg}
          onClose={() => setPreviewOverlay(null)}
        />
      )}

      {/* UPI Checkout Modal */}
      {showCheckout && selectedPlan && (
        <UpiCheckoutModal
          userId={userId}
          subscriptionPlan={planEnum as "MONTHLY" | "SIX_MONTH"}
          onClose={() => setShowCheckout(false)}
          onConfirmed={handlePaymentConfirmed}
        />
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
          >
            <Image
              src="/images/iconLogo.png"
              alt="Cricshub"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <Image
              src="/images/textLogo.png"
              alt="Cricshub"
              width={88}
              height={26}
              className="object-contain hidden sm:block"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-800 font-semibold transition-colors hidden sm:block"
            >
              Dashboard
            </Link>
            {cart.length > 0 && (
              <button
                onClick={handleCheckout}
                className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all"
              >
                <i className="ri-qr-code-line" />
                <span className="hidden min-[480px]:inline">Pay via UPI</span>
                <span className="min-[480px]:hidden">Pay</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-6xl">
        {step === "success" && selectedPlan && (
          <SuccessScreen
            plan={selectedPlan}
            onDone={() => {
              setStep("plans");
              setCart([]);
              setSelectedPlan(null);
            }}
          />
        )}

        {step === "plans" && (
          <div className="space-y-12 sm:space-y-16">
            {/* Hero */}
            <div className="text-center px-2">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#1E88E5] text-xs font-black px-4 py-2 rounded-full mb-4 sm:mb-5 uppercase tracking-widest">
                <i className="ri-live-line text-red-500 animate-pulse" />
                Streaming Plans
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-3 sm:mb-4 leading-tight">
                Stream for free.
                <br />
                <span className="bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] bg-clip-text text-transparent">
                  Upgrade per match.
                </span>
              </h1>
              <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
                The streaming dashboard is free for all match admins. Buy a
                bundle (from ₹49/match) for polished overlays, or subscribe to
                get one free bundle credit per match you create.
              </p>
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold px-4 py-2 rounded-full mt-4 flex-wrap justify-center">
                <i className="ri-bank-line" />
                Pay via UPI · PhonePe · GPay · Paytm · BHIM
              </div>
            </div>

            {/* Free tier */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                <i className="ri-bar-chart-2-line text-gray-400 text-lg" />
              </div>
              <div className="flex-1">
                <p className="font-black text-gray-900">Free — always</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Every match admin gets the streaming dashboard and a plain
                  score overlay (live score, batters, bowler) at no cost.
                </p>
              </div>
              <span className="text-xs font-black text-gray-400 bg-white border border-gray-200 px-3 py-1.5 rounded-full flex-shrink-0 self-start sm:self-auto">
                ₹0
              </span>
            </div>

            {/* Basic Bundle callout */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="ri-stack-line text-[#34B8FF] text-lg" />
              </div>
              <div className="flex-1">
                <p className="font-black text-gray-900">
                  Overlay Bundles{" "}
                  <span className="text-xs font-bold text-[#1E88E5] bg-blue-100 px-2 py-0.5 rounded-full ml-1">
                    per match
                  </span>
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  4 bundle styles available — IPL, WPL, Champions Trophy, and
                  Border-Gavaskar. Each bundle unlocks 8 overlays for one match. Buy
                  directly from your Stream Dashboard.
                </p>
              </div>
              <span className="text-xs font-black text-[#1E88E5] bg-blue-100 px-3 py-1.5 rounded-full flex-shrink-0 self-start sm:self-auto whitespace-nowrap">
                from ₹49 / match
              </span>
            </div>

            {/* Subscription Plans */}
            <div>
              <SectionLabel
                icon="ri-vip-crown-line"
                label="Subscription Plans"
                sub="Get 1 free bundle credit per match — choose your overlay style each time."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    inCart={isInCart(plan.id)}
                    onToggle={() => togglePlan(plan)}
                  />
                ))}
              </div>
            </div>

            {/* Bundle Showcase */}
            <div>
              <SectionLabel
                icon="ri-layout-top-2-line"
                label="Overlay Bundles"
                sub="4 styles, 8 overlays each — ₹49/match · Launch Offer. Buy from your Stream Dashboard."
              />

              {/* How it works — responsive steps */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 sm:px-6 py-4 mb-5 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#1E88E5] font-black shadow-sm flex-shrink-0 text-sm">
                      1
                    </div>
                    <p className="text-sm font-semibold text-blue-900">
                      Open your Match Dashboard.
                    </p>
                  </div>
                  <i className="ri-arrow-right-line text-blue-300 hidden sm:block flex-shrink-0" />
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#1E88E5] font-black shadow-sm flex-shrink-0 text-sm">
                      2
                    </div>
                    <p className="text-sm font-semibold text-blue-900">
                      Pick a bundle style & pay via UPI.
                    </p>
                  </div>
                  <i className="ri-arrow-right-line text-blue-300 hidden sm:block flex-shrink-0" />
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1E88E5] flex items-center justify-center text-white font-black shadow-sm flex-shrink-0 text-sm">
                      3
                    </div>
                    <p className="text-sm font-semibold text-blue-900">
                      Activate overlays on your stream.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {BUNDLE_CATALOGUE.map((bundle) => (
                  <BundleShowcaseCard
                    key={bundle.id}
                    bundle={bundle}
                    onPreview={() => setPreviewBundle(bundle)}
                  />
                ))}
              </div>
            </div>

            {/* Premium Add-on Templates */}
            <div>
              <SectionLabel
                icon="ri-vip-crown-line"
                label="Premium Add-on Templates"
                sub="5 animated per-match templates · ₹21–₹49 · Launch Offer. Buy from your Stream Dashboard."
              />
              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 sm:px-6 py-4 mb-5 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <i className="ri-information-line text-amber-600 text-xl flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  These animated templates are purchased per match directly from
                  your{" "}
                  <Link href="/dashboard" className="font-bold underline">
                    Stream Dashboard
                  </Link>
                  . No subscription required — each template unlocks for a
                  single match.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 text-xs font-black bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                  ⚡ Pro tier
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-black bg-blue-50 text-[#1E88E5] border border-blue-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                  ₹21–₹49 / match
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-black bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                  5 templates
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ADDON_TEMPLATES.map((tpl) => (
                  <AddOnShowcaseCard
                    key={tpl.id}
                    tpl={tpl}
                    onPreview={() =>
                      openOverlayPreview(
                        tpl.id,
                        tpl.name,
                        tpl.previewGradient ?? "linear-gradient(135deg,#111,#333)",
                      )
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom checkout bar */}
      {step === "plans" && cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-2xl">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between max-w-6xl gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl border-2 border-white flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] shadow-md">
                <i className="ri-vip-crown-line text-white text-xs" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 truncate max-w-[140px] sm:max-w-none">
                  {cart[0].name}
                </p>
                <p className="font-black text-gray-900 text-sm">{fmt(total)}</p>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="flex items-center gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white font-black px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl hover:shadow-xl hover:shadow-blue-200 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <i className="ri-qr-code-line text-lg" />
              <span>Pay via UPI</span>
            </button>
          </div>
        </div>
      )}
      {cart.length > 0 && step === "plans" && <div className="h-24" />}

      <link
        href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
        rel="stylesheet"
      />
    </div>
  );
}
