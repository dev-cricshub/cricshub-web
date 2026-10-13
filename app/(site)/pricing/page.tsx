"use client";

import { useState } from "react";
import UpiCheckoutModal from "@/app/components/UpiCheckoutModal";
import { AppHeader } from "@/app/components/layout/AppHeader";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  IconTile,
  Modal,
  SectionTitle,
  cn,
  useToast,
} from "@/app/components/ui";

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
  id,
}: {
  icon: string;
  label: string;
  sub?: string;
  id?: string;
}) {
  return (
    <SectionTitle
      id={id}
      className="mb-5 sm:mb-6"
      icon={<i className={cn(icon, "text-primary")} aria-hidden />}
      title={label}
      description={sub}
    />
  );
}

/** Strike-through original price + current price, right-aligned. */
function PriceTag({ price, originalPrice, unit = "per match" }: { price: number; originalPrice?: number; unit?: string }) {
  return (
    <div className="flex-shrink-0 pl-2 text-right">
      {originalPrice && (
        <p className="font-mono text-xs tabular-nums text-fg-subtle line-through">
          <span className="sr-only">Was </span>
          {fmt(originalPrice)}
        </p>
      )}
      <p className="font-display text-2xl font-bold leading-none tabular-nums text-fg">{fmt(price)}</p>
      <p className="text-2xs text-fg-subtle">{unit}</p>
    </div>
  );
}

function CheckList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-1.5", className)}>
      {items.map((f, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-fg-muted">
          <i className="ri-check-line mt-0.5 flex-shrink-0 text-primary" aria-hidden />
          <span>{f}</span>
        </li>
      ))}
    </ul>
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
    <Modal
      open
      onClose={onClose}
      size="full"
      title={bannerTitle}
      description="Live preview · 1920×1080 · sample data"
      icon={
        <span
          className="h-10 w-10 flex-shrink-0 rounded-xl ring-1 ring-inset ring-line"
          style={{ background: previewBg }}
          aria-hidden
        />
      }
      footer={
        <>
          <p className="mr-auto hidden text-xs text-fg-subtle sm:block">
            Preview uses sample data — actual overlay will show live match data
          </p>
          <Button variant="secondary" onClick={onClose}>
            Close preview
          </Button>
          <ButtonLink href={previewUrl} external variant="outline" icon="ri-external-link-line">
            Open full size
          </ButtonLink>
        </>
      }
    >
      {/* 16:9 broadcast frame — media is always shown on black, like a monitor */}
      <div
        className="relative w-full overflow-hidden rounded-xl bg-black ring-1 ring-line"
        style={{ aspectRatio: "16/9" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/images/matchStalkImage.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
        {!iframeLoaded && (
          <div role="status" className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/50">
            <i className="ri-loader-4-line animate-spin text-3xl text-white/70" aria-hidden />
            <p className="text-sm font-medium text-white/70">Loading overlay preview…</p>
          </div>
        )}
        <iframe
          src={previewUrl}
          title={`${bannerTitle} overlay preview`}
          className="absolute inset-0 h-full w-full"
          style={{ border: "none", opacity: iframeLoaded ? 1 : 0, transition: "opacity 0.3s" }}
          onLoad={() => setIframeLoaded(true)}
          allow="autoplay"
        />
      </div>
      <p className="mt-3 text-xs text-fg-subtle sm:hidden">
        Preview uses sample data — actual overlay will show live match data
      </p>
    </Modal>
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
    <Modal
      open
      onClose={onClose}
      size="2xl"
      title={bundle.name}
      description={`${cards.length} overlays · ₹${bundle.price}/match · select any to preview`}
      icon={
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg text-white ring-1 ring-inset ring-black/5"
          style={{ background: bundle.gradient }}
          aria-hidden
        >
          <i className="ri-stack-line drop-shadow-sm" />
        </span>
      }
      footer={
        <>
          <p className="mr-auto hidden text-xs text-fg-subtle sm:block">
            All overlays update in real time with live match data.
          </p>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-fg-muted">{bundle.desc}</p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.key}>
            <button
              type="button"
              onClick={() => onPreview(card.key, card.title, card.previewBg)}
              className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-line bg-surface text-left transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="relative flex h-20 w-full items-center justify-center" style={{ background: card.previewBg }}>
                <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-2xs font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                  <i className={card.icon} aria-hidden />
                  OBS overlay
                </span>
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-2xs font-medium text-white opacity-90 transition-opacity group-hover:opacity-100">
                  <i className="ri-eye-line" aria-hidden />
                  Preview
                </span>
              </span>
              <span className="block p-3.5">
                <span className="block text-sm font-medium leading-snug text-fg">{card.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-fg-muted">{card.desc}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
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
  // Highlighted (6-month) plan uses the selected/highlight treatment: primary ring + soft tint, gold badge.
  const hl = plan.highlight;
  const period = plan.cycle === "monthly" ? "/month" : "for 6 months";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-card border p-5 text-fg transition-[box-shadow,transform,border-color,background-color] duration-200 ease-out sm:p-6",
        hl ? "border-primary/40 bg-primary-soft/40 shadow-raised" : "border-line bg-surface shadow-card",
        inCart
          ? "ring-2 ring-primary ring-offset-2 ring-offset-canvas"
          : cn("hover:-translate-y-0.5 hover:shadow-raised", hl ? "ring-2 ring-primary" : "hover:border-line-strong"),
      )}
    >
      {/* Badge row */}
      <div className="mb-4 flex items-center justify-between gap-2">
        {hl ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold ring-1 ring-inset ring-gold/30">
            <i className="ri-star-fill" aria-hidden />
            {plan.badge}
          </span>
        ) : (
          <span className="text-xs font-medium text-fg-muted">{plan.badge}</span>
        )}
        <Badge tone="warning" icon="ri-price-tag-3-line" size="xs">
          Launch offer
        </Badge>
      </div>

      <h3 className="text-base font-semibold">{plan.name}</h3>

      {/* Pricing block */}
      <div className="mt-2">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-5xl font-bold leading-none tabular-nums">{fmt(plan.price)}</span>
          <span className="text-sm text-fg-muted">{period}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {plan.originalPrice && (
            <span className="font-mono tabular-nums text-fg-subtle line-through">
              <span className="sr-only">Was </span>
              {fmt(plan.originalPrice)}
            </span>
          )}
          {savePct > 0 && (
            <Badge tone="success" size="xs">
              {savePct}% off
            </Badge>
          )}
          {hl && plan.perMonth && (
            <span className="text-fg-muted">
              ≈ ₹{plan.perMonth}/month · Save {fmt(savings)}
            </span>
          )}
        </div>
      </div>

      <div className="my-5 h-px bg-line" aria-hidden />

      {/* Features */}
      <div className="mb-6 flex-1 space-y-4">
        {[
          { label: "Streaming dashboard", items: plan.streamingFeatures },
          { label: "Included overlays", items: plan.bundleFeatures },
        ].map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-fg-subtle">
              {group.label}
            </p>
            <ul className="space-y-2">
              {group.items.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-fg-muted">
                  <i className="ri-check-line mt-0.5 flex-shrink-0 text-primary" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* CTA — the whole card is clickable via the stretched ::after, but this is the single real control */}
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={inCart}
        aria-label={`${plan.name} — ${fmt(plan.price)} ${period}`}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98]",
          "after:absolute after:inset-0 after:rounded-card after:content-['']",
          "focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-canvas",
          inCart
            ? "bg-primary-soft text-primary-soft-fg ring-1 ring-inset ring-primary/30 hover:bg-primary-soft/70"
            : hl
              ? "bg-primary text-primary-fg shadow-xs hover:bg-primary-hover"
              : "border border-line-strong bg-surface text-fg shadow-xs hover:border-fg-subtle hover:bg-surface-2",
        )}
      >
        <i className={inCart ? "ri-checkbox-circle-fill" : hl ? "ri-flashlight-line" : "ri-add-line"} aria-hidden />
        {inCart ? "Selected" : hl ? "Get best value" : "Select plan"}
      </button>
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
  const listId = `${bundle.id}-overlays`;
  const visible = expanded ? bundle.overlays : bundle.overlays.slice(0, 3);
  return (
    <Card padding="none" className="flex flex-col overflow-hidden">
      <div className="relative h-24 flex-shrink-0 sm:h-28" style={{ background: bundle.gradient }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-black/30 px-3 py-1 text-2xs font-medium uppercase tracking-wider text-white backdrop-blur-sm">
            OBS overlays
          </span>
        </div>
        <span className="absolute left-2.5 top-2.5 rounded-full bg-black/30 px-2 py-0.5 text-2xs font-medium text-white backdrop-blur-sm">
          {bundle.overlayCount} overlays
        </span>
        <Badge tone="warning" size="xs" className="absolute right-2.5 top-2.5">
          Launch offer
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-fg">{bundle.name}</h3>
            <p className="mt-0.5 text-sm leading-snug text-fg-muted">{bundle.desc}</p>
          </div>
          <PriceTag price={bundle.price} originalPrice={bundle.originalPrice} />
        </div>

        <ul id={listId} className="mt-4 flex-1 space-y-1.5">
          {visible.map((o, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-fg-muted animate-fade-in">
              <i className="ri-check-line mt-px flex-shrink-0 text-primary" aria-hidden />
              {o}
            </li>
          ))}
        </ul>
        {bundle.overlays.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={listId}
            className="mt-2 inline-flex items-center gap-1 self-start rounded text-xs font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <i className={`ri-arrow-${expanded ? "up" : "down"}-s-line`} aria-hidden />
            {expanded ? "Show less" : `+${bundle.overlays.length - 3} more overlays`}
          </button>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" icon="ri-eye-line" className="flex-1" onClick={onPreview}>
            Preview overlays
          </Button>
          <ButtonLink href="/dashboard" variant="ghost" size="sm" icon="ri-broadcast-line">
            Dashboard
          </ButtonLink>
        </div>
      </div>
    </Card>
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
  return (
    <Card padding="none" className="flex flex-col overflow-hidden">
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Preview ${tpl.name}`}
        className="group relative h-24 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:h-28"
        style={{ background: tpl.previewGradient }}
      >
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-2xs font-medium uppercase tracking-wider text-white backdrop-blur-sm transition-colors group-hover:bg-black/50">
            <i className="ri-eye-line opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
            OBS overlay
          </span>
        </span>
        {tpl.popular && (
          <Badge tone="warning" size="xs" icon="ri-fire-line" className="absolute left-2.5 top-2.5">
            Popular
          </Badge>
        )}
      </button>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-fg">{tpl.name}</h3>
            <Badge tone="outline" size="xs" className="mt-1 uppercase tracking-wider">
              {tpl.tier}
            </Badge>
          </div>
          <PriceTag price={tpl.price} originalPrice={tpl.originalPrice} />
        </div>
        <ul className="mb-4 flex-1 space-y-1.5">
          {tpl.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-fg-muted">
              <i className="ri-check-line mt-px flex-shrink-0 text-primary" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex gap-2">
          <Button variant="outline" size="sm" icon="ri-eye-line" className="flex-1" onClick={onPreview}>
            Preview
          </Button>
          <ButtonLink href="/dashboard" variant="ghost" size="sm" icon="ri-broadcast-line">
            Dashboard
          </ButtonLink>
        </div>
      </div>
    </Card>
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
    <Card padding="lg" className="mx-auto max-w-lg text-center animate-fade-up">
      <div className="relative mx-auto mb-6 h-16 w-16">
        <span className="absolute inset-0 rounded-full bg-success/30 animate-live-ping [animation-iteration-count:2]" aria-hidden />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-success text-3xl text-white shadow-raised animate-pop">
          <i className="ri-check-line" aria-hidden />
        </span>
      </div>
      <h2 className="font-display text-3xl font-bold uppercase leading-none text-fg sm:text-4xl">You&rsquo;re all set</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-fg-muted sm:text-base">
        Your <strong className="font-medium text-fg">{plan.name}</strong> plan is active once the owner confirms
        your payment. Head to the streaming dashboard to get started.
      </p>
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onDone}>
          Back to plans
        </Button>
        <ButtonLink href="/dashboard" size="lg" icon="ri-live-line" className="flex-1">
          Go to dashboard
        </ButtonLink>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

const HOW_IT_WORKS = [
  "Open your Match Dashboard.",
  "Pick a bundle style & pay via UPI.",
  "Activate overlays on your stream.",
];

export default function PricingPage() {
  const toast = useToast();
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
      // The pricing page uses AppHeader (no login-modal listener), so point to its Log in button.
      toast("Log in to continue", {
        tone: "warning",
        description: "You must be logged in to purchase a plan. Use Log in at the top of the page.",
      });
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
  const showCheckoutBar = step === "plans" && cart.length > 0;

  return (
    <div className="min-h-screen bg-canvas">
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

      <AppHeader
        maxWidth="max-w-6xl"
        trailing={
          cart.length > 0 && (
            <Button size="sm" icon="ri-qr-code-line" onClick={handleCheckout} className="hidden sm:inline-flex">
              Pay via UPI
            </Button>
          )
        }
      />

      <main className="container-page max-w-6xl py-8 sm:py-12">
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
            <header className="mx-auto max-w-2xl text-center animate-fade-up">
              <p className="eyebrow mb-3">
                <span className="h-[2px] w-5 bg-primary" aria-hidden />
                Streaming plans
              </p>
              <h1 className="font-display text-[2.6rem] font-bold uppercase leading-[0.92] tracking-[-0.01em] text-fg sm:text-6xl">
                Stream for free.
                <br />
                Upgrade per match.
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-fg-muted">
                The streaming dashboard is free for all match admins. Buy a
                bundle (from ₹49/match) for polished overlays, or subscribe to
                get one free bundle credit per match you create.
              </p>
              <p className="mt-5 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-fg-muted shadow-xs">
                <i className="ri-bank-line text-primary" aria-hidden />
                Pay via UPI · PhonePe · GPay · Paytm · BHIM
              </p>
            </header>

            {/* Free tier + bundle callouts */}
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <Card padding="none" className="flex items-start gap-4 p-4 sm:p-5">
                <IconTile icon="ri-bar-chart-2-line" tone="neutral" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-fg">Free — always</h2>
                    <span className="font-display text-2xl font-bold leading-none tabular-nums text-fg">₹0</span>
                  </div>
                  <p className="mt-1 text-sm text-fg-muted">
                    Every match admin gets the streaming dashboard and a plain
                    score overlay (live score, batters, bowler) at no cost.
                  </p>
                </div>
              </Card>
              <Card padding="none" className="flex items-start gap-4 p-4 sm:p-5">
                <IconTile icon="ri-stack-line" tone="primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-fg">Overlay Bundles</h2>
                    <span className="whitespace-nowrap font-display text-2xl font-bold leading-none tabular-nums text-fg">
                      <span className="font-sans text-xs font-normal text-fg-subtle">from </span>₹49
                      <span className="font-sans text-xs font-normal text-fg-subtle"> / match</span>
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-fg-muted">
                    4 bundle styles available — IPL, WPL, Champions Trophy, and
                    Border-Gavaskar. Each bundle unlocks 8 overlays for one match. Buy
                    directly from your Stream Dashboard.
                  </p>
                </div>
              </Card>
            </div>

            {/* Subscription Plans */}
            <section aria-labelledby="plans-heading">
              <SectionLabel
                id="plans-heading"
                icon="ri-vip-crown-line"
                label="Subscription Plans"
                sub="Get 1 free bundle credit per match — choose your overlay style each time."
              />
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:max-w-4xl">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    inCart={isInCart(plan.id)}
                    onToggle={() => togglePlan(plan)}
                  />
                ))}
              </div>
            </section>

            {/* Bundle Showcase */}
            <section aria-labelledby="bundles-heading">
              <SectionLabel
                id="bundles-heading"
                icon="ri-layout-top-2-line"
                label="Overlay Bundles"
                sub="4 styles, 8 overlays each — ₹49/match · Launch Offer. Buy from your Stream Dashboard."
              />

              {/* How it works */}
              <ol className="mb-5 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:mb-6 sm:grid-cols-3">
                {HOW_IT_WORKS.map((text, i) => (
                  <li key={i} className="flex items-center gap-3 bg-surface px-4 py-3.5 sm:px-5">
                    <span
                      className={cn(
                        "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                        i === HOW_IT_WORKS.length - 1
                          ? "bg-primary text-primary-fg"
                          : "bg-primary-soft text-primary-soft-fg",
                      )}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm font-medium text-fg">{text}</p>
                  </li>
                ))}
              </ol>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                {BUNDLE_CATALOGUE.map((bundle) => (
                  <BundleShowcaseCard
                    key={bundle.id}
                    bundle={bundle}
                    onPreview={() => setPreviewBundle(bundle)}
                  />
                ))}
              </div>
            </section>

            {/* Premium Add-on Templates */}
            <section aria-labelledby="addons-heading">
              <SectionLabel
                id="addons-heading"
                icon="ri-magic-line"
                label="Premium Add-on Templates"
                sub="5 animated per-match templates · ₹21–₹49 · Launch Offer. Buy from your Stream Dashboard."
              />
              <Alert tone="info" className="mb-4">
                These animated templates are purchased per match directly from
                your{" "}
                <a href="/dashboard" className="rounded-sm font-medium underline underline-offset-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Stream Dashboard
                </a>
                . No subscription required — each template unlocks for a
                single match.
              </Alert>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge tone="warning" icon="ri-flashlight-line">Pro tier</Badge>
                <Badge tone="primary">₹21–₹49 / match</Badge>
                <Badge tone="neutral">5 templates</Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ADDON_TEMPLATES.map((tpl) => (
                  <AddOnShowcaseCard
                    key={tpl.id}
                    tpl={tpl}
                    onPreview={() =>
                      openOverlayPreview(
                        tpl.id,
                        tpl.name,
                        tpl.previewGradient ?? "rgb(var(--surface-3))",
                      )
                    }
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Sticky bottom checkout bar */}
      {showCheckoutBar && (
        <div className="fixed inset-x-0 bottom-[var(--tabbar-h,0px)] z-30 border-t border-line bg-surface/95 shadow-pop backdrop-blur-xl animate-sheet-up supports-[backdrop-filter]:bg-surface/80">
          <div className="container-page flex max-w-6xl items-center justify-between gap-3 py-3 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)-var(--tabbar-h,0px)))] sm:gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <IconTile icon="ri-vip-crown-line" size="sm" />
              <div className="min-w-0" aria-live="polite">
                <p className="truncate text-xs text-fg-muted">{cart[0].name}</p>
                <p className="font-display text-2xl font-bold leading-none tabular-nums text-fg">{fmt(total)}</p>
              </div>
            </div>
            <Button size="lg" icon="ri-qr-code-line" onClick={handleCheckout} className="flex-shrink-0">
              Pay via UPI
            </Button>
          </div>
        </div>
      )}
      {showCheckoutBar && <div className="h-24" aria-hidden />}
    </div>
  );
}
