"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import UpiCheckoutModal from "@/app/components/UpiCheckoutModal";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES  (unchanged)
// ═══════════════════════════════════════════════════════════════════════════

type BillingCycle = "monthly" | "sixmonth";
type AddOnTier = "pro" | "elite";
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
  includedFeatures: string[];
  dashboardFeatures: string[];
  overlayFeatures: string[];
}

interface AddOnTemplate {
  id: string;
  name: string;
  tier: AddOnTier;
  price: number;
  previewGradient: string;
  features: string[];
  popular?: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  itemType: "subscription";
  meta?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA  (unchanged from original)
// ═══════════════════════════════════════════════════════════════════════════

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "sub-monthly",
    cycle: "monthly",
    name: "Monthly",
    price: 499,
    perMonth: 499,
    badge: "Most Flexible",
    highlight: false,
    includedFeatures: [
      "OBS browser source URL generation",
      "Stream lock & operator handover",
      "Real-time score sync (auto)",
      "Priority support access",
    ],
    dashboardFeatures: [
      "Basic Bundle auto-unlocked for ALL your matches",
      "No more ₹99/match for standard overlays",
      "Score, Main, Playing XI & Summary banners included",
      "Unlimited matches covered",
    ],
    overlayFeatures: [
      "Live score ticker (always-on)",
      "Ball-by-ball over tracker",
      "Match summary & playing XI banners",
    ],
  },
  {
    id: "sub-6month",
    cycle: "sixmonth",
    name: "6-Month Plan",
    price: 2499,
    originalPrice: 2994,
    perMonth: 416,
    badge: "Best Value",
    highlight: true,
    includedFeatures: [
      "Everything in Monthly",
      "Priority support",
      "Early access to new overlay templates",
      "Usage analytics dashboard",
    ],
    dashboardFeatures: [
      "All Monthly benefits",
      "Saves vs buying bundles per match",
      "Extended match history",
      "Multi-match management view",
    ],
    overlayFeatures: [
      "All standard overlays included",
      "Watermark-free banners",
      "Custom colour accent (coming soon)",
    ],
  },
];

const ADDON_TEMPLATES: AddOnTemplate[] = [
  {
    id: "tpl-pro-1",
    name: "Event Burst",
    tier: "pro",
    price: 99,
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
    tier: "pro",
    price: 99,
    previewGradient: "linear-gradient(135deg,#F7971E,#FFD200)",
    features: [
      "In-bar light beam animation on 4, 6, wicket, 50 & 100",
      "Broadcast-style scorebar",
      "No full-screen takeover",
      "Player name & stat reveal",
    ],
  },
  {
    id: "tpl-pro-3",
    name: "Win Predictor",
    tier: "pro",
    price: 99,
    previewGradient: "linear-gradient(135deg,#2193b0,#6dd5ed)",
    features: [
      "Live win probability meter",
      "Updates every ball",
      "Pressure colour system",
      "CRR vs RRR analysis",
      "Wickets & balls remaining context",
    ],
  },
  {
    id: "tpl-elite-1",
    name: "Diamond Premium",
    tier: "elite",
    price: 199,
    previewGradient: "linear-gradient(135deg,#8E54E9,#4776E6)",
    popular: true,
    features: [
      "Full stats dashboard",
      "Wagon wheel display",
      "Custom branding",
      "Priority OBS render",
      "Dedicated support",
    ],
  },
  {
    id: "tpl-elite-2",
    name: "Crimson Grand",
    tier: "elite",
    price: 249,
    previewGradient: "linear-gradient(135deg,#FF416C,#FF4B2B)",
    features: [
      "Cinematic red theme",
      "MOTM highlight card",
      "Custom branding",
      "Wagon wheel",
      "Dedicated support",
    ],
  },
  {
    id: "tpl-elite-3",
    name: "Cosmic Elite",
    tier: "elite",
    price: 229,
    previewGradient: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)",
    features: [
      "Dark cinematic overlay",
      "Star particle effects",
      "Custom branding",
      "Full stats",
      "Priority render",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const GST = 0.18;
const addGst = (n: number) => n + Math.round(n * GST);
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const cartTotal = (cart: CartItem[]) => cart.reduce((s, i) => s + i.price, 0);

// ═══════════════════════════════════════════════════════════════════════════
// SMALL COMPONENTS  (unchanged)
// ═══════════════════════════════════════════════════════════════════════════

function Check({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <li
      className={`flex items-start gap-2.5 text-sm ${muted ? "text-gray-400" : "text-gray-600"}`}
    >
      <i
        className={`ri-check-circle-fill flex-shrink-0 mt-0.5 ${muted ? "text-gray-300" : "text-[#34B8FF]"}`}
      />
      {text}
    </li>
  );
}

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
    <div className="flex items-center gap-3 mb-6">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] flex items-center justify-center shadow-md shadow-blue-200">
        <i className={`${icon} text-white text-base`} />
      </div>
      <div>
        <h2 className="font-black text-gray-900 text-xl leading-none">
          {label}
        </h2>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAN CARD  (unchanged)
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
  return (
    <div
      onClick={onToggle}
      className={`relative cursor-pointer rounded-3xl overflow-hidden border-2 transition-all duration-300 select-none
        ${inCart ? "border-[#34B8FF] shadow-2xl shadow-blue-100 scale-[1.01]" : plan.highlight ? "border-[#34B8FF]/40 shadow-xl hover:border-[#34B8FF] hover:shadow-2xl hover:shadow-blue-100" : "border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md"}`}
    >
      {plan.highlight && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#34B8FF] via-purple-400 to-[#34B8FF]" />
      )}
      <div
        className={`px-7 pt-7 pb-6 relative overflow-hidden ${plan.highlight ? "bg-gradient-to-br from-[#0f2744] to-[#1a3a6e]" : "bg-gradient-to-br from-[#34B8FF] to-[#1E88E5]"}`}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative z-10">
          {plan.badge && (
            <span className="inline-block bg-white/20 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full mb-4">
              {plan.badge}
            </span>
          )}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-white font-black text-2xl">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-white font-black text-4xl">
                  {fmt(plan.price)}
                </span>
                <span className="text-white/60 text-sm">
                  {plan.cycle === "monthly" ? "/month" : "for 6 months"}
                </span>
              </div>
              {plan.perMonth && plan.cycle === "sixmonth" && (
                <p className="text-white/50 text-xs mt-1">
                  Just {fmt(plan.perMonth)}/month
                </p>
              )}
              {savings > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                  <i className="ri-price-tag-3-line" />
                  Save {fmt(savings)}
                </div>
              )}
            </div>
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${inCart ? "bg-white border-white shadow-lg" : "bg-white/15 border-white/40"}`}
            >
              {inCart ? (
                <i className="ri-check-line text-[#1E88E5] font-black text-lg" />
              ) : (
                <i className="ri-add-line text-white text-lg" />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white px-7 py-6 space-y-5">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Streaming Dashboard
          </p>
          <ul className="space-y-2">
            {plan.includedFeatures.map((f, i) => (
              <Check key={i} text={f} />
            ))}
          </ul>
        </div>
        <div className="border-t border-gray-50" />
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Included Banners & Overlays
          </p>
          <ul className="space-y-2">
            {plan.dashboardFeatures.map((f, i) => (
              <Check key={i} text={f} />
            ))}
          </ul>
        </div>
        <div className="border-t border-gray-50" />
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Overlay Details
          </p>
          <ul className="space-y-2">
            {plan.overlayFeatures.map((f, i) => (
              <Check key={i} text={f} />
            ))}
          </ul>
        </div>
        <div
          className={`w-full py-3 rounded-2xl text-sm font-black text-center transition-all duration-200 ${inCart ? "bg-[#34B8FF]/10 text-[#1E88E5] border-2 border-[#34B8FF]/30" : plan.highlight ? "bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white shadow-md shadow-blue-200" : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100"}`}
        >
          {inCart
            ? "✓ Selected"
            : plan.highlight
              ? "⚡ Get Best Value"
              : "Select Plan"}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADD-ON SHOWCASE (view-only on this page — unchanged)
// ═══════════════════════════════════════════════════════════════════════════

function AddOnShowcaseCard({ tpl }: { tpl: AddOnTemplate }) {
  const tierStyle =
    tpl.tier === "elite"
      ? "bg-purple-100 text-purple-700 border-purple-200"
      : "bg-amber-100 text-amber-700 border-amber-200";

  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all group">
      <div
        className="h-32 relative"
        style={{ background: tpl.previewGradient }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-black/25 backdrop-blur-sm text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full">
            OBS Overlay
          </span>
        </div>
        {tpl.popular && (
          <div className="absolute top-2.5 left-2.5 bg-amber-400 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
            🔥 Popular
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-black text-gray-900 text-base">{tpl.name}</p>
            <span
              className={`text-[9px] font-black border px-2 py-0.5 rounded-full inline-block mt-1 ${tierStyle}`}
            >
              {tpl.tier.toUpperCase()}
            </span>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-black text-gray-900 text-lg">{fmt(tpl.price)}</p>
            <p className="text-[10px] text-gray-400">per match</p>
          </div>
        </div>
        <ul className="space-y-1 mb-4">
          {tpl.features.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-1.5 text-xs text-gray-500"
            >
              <i className="ri-check-line text-[#34B8FF] flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <div className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-500 text-xs font-bold text-center border border-gray-100 flex items-center justify-center gap-1.5">
          <i className="ri-broadcast-line" />
          Available in Dashboard
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
    <div className="max-w-lg mx-auto text-center py-12 px-4">
      <div className="relative w-28 h-28 mx-auto mb-8">
        <div
          className="absolute inset-0 rounded-full bg-emerald-400"
          style={{ animation: "ping .8s ease 1" }}
        />
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-2xl shadow-green-200">
          <i className="ri-check-line text-5xl text-white" />
        </div>
      </div>
      <h2 className="text-4xl font-black text-gray-900 mb-2">All set! 🎉</h2>
      <p className="text-gray-500 mb-10">
        Your <strong>{plan.name}</strong> plan is active once the owner confirms
        your payment. Head to the streaming dashboard to get started.
      </p>
      <div className="flex gap-3">
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
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [showCheckout, setShowCheckout] = useState(false);
  const [tierFilter, setTierFilter] = useState<"all" | "pro" | "elite">("all");

  const isInCart = (id: string) => cart.some((c) => c.id === id);
  const sub = cartTotal(cart);
  const total = addGst(sub);

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
          meta: plan.cycle === "monthly" ? "₹499/month" : "6-month bundle",
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

  const filteredAddons =
    tierFilter === "all"
      ? ADDON_TEMPLATES
      : ADDON_TEMPLATES.filter((t) => t.tier === tierFilter);

  const userId =
    typeof window !== "undefined"
      ? (localStorage.getItem("userUUID") ?? "")
      : "";
  const planEnum = selectedPlan?.id === "sub-monthly" ? "MONTHLY" : "SIX_MONTH";

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
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
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/iconLogo.png"
              alt="Cricshub"
              width={34}
              height={34}
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
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-800 font-semibold transition-colors hidden sm:block"
            >
              Dashboard
            </Link>
            {cart.length > 0 && (
              <button
                onClick={handleCheckout}
                className="flex items-center gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-sm font-bold px-4 py-2 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all"
              >
                <i className="ri-qr-code-line" />
                Pay via UPI
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-6xl">
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
          <div className="space-y-16">
            {/* Hero */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#1E88E5] text-xs font-black px-4 py-2 rounded-full mb-5 uppercase tracking-widest">
                <i className="ri-live-line text-red-500 animate-pulse" />
                Streaming Plans
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
                Stream for free.
                <br />
                <span className="bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] bg-clip-text text-transparent">
                  Upgrade per match.
                </span>
              </h1>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                The streaming dashboard is free for all match admins. Buy a
                Basic Bundle (₹99/match) for polished overlays, or subscribe to
                auto-unlock them for every match you run.
              </p>

              {/* UPI payment badge */}
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold px-4 py-2 rounded-full mt-4">
                <i className="ri-bank-line" />
                Pay via UPI · PhonePe · GPay · Paytm · BHIM
              </div>
            </div>

            {/* Free tier callout */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
              <span className="text-xs font-black text-gray-400 bg-white border border-gray-200 px-3 py-1.5 rounded-full flex-shrink-0">
                ₹0
              </span>
            </div>

            {/* Basic Bundle callout */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="ri-gift-line text-[#34B8FF] text-lg" />
              </div>
              <div className="flex-1">
                <p className="font-black text-gray-900">
                  Basic Bundle{" "}
                  <span className="text-xs font-bold text-[#1E88E5] bg-blue-100 px-2 py-0.5 rounded-full ml-1">
                    per match
                  </span>
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Unlock 8 polished overlays for one match — Score, Main, Match
                  Summary, and Playing XI banners. Buy directly from the Stream
                  Dashboard.
                </p>
              </div>
              <span className="text-xs font-black text-[#1E88E5] bg-blue-100 px-3 py-1.5 rounded-full flex-shrink-0">
                ₹99 / match
              </span>
            </div>

            {/* Subscription Plans */}
            <div>
              <SectionLabel
                icon="ri-vip-crown-line"
                label="Subscription Plans"
                sub="Auto-unlock the Basic Bundle for every match you run — no per-match fee."
              />
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
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

            {/* Add-on Showcase */}
            <div>
              <SectionLabel
                icon="ri-layout-top-2-line"
                label="Premium Overlays (Add-ons)"
                sub="Per-match animated templates. No subscription required — buy from your Stream Dashboard."
              />
              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-4 flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1E88E5] font-black shadow-sm">
                    1
                  </div>
                  <p className="text-sm font-semibold text-blue-900">
                    Open your Match Dashboard.
                  </p>
                </div>
                <i className="ri-arrow-right-line text-blue-300 hidden md:block" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1E88E5] font-black shadow-sm">
                    2
                  </div>
                  <p className="text-sm font-semibold text-blue-900">
                    Browse &amp; buy a premium template.
                  </p>
                </div>
                <i className="ri-arrow-right-line text-blue-300 hidden md:block" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1E88E5] flex items-center justify-center text-white font-black shadow-sm">
                    3
                  </div>
                  <p className="text-sm font-semibold text-blue-900">
                    Activate overlay on your stream.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-6">
                {(
                  [
                    { key: "all", label: "All Templates" },
                    { key: "pro", label: "⚡ Pro" },
                    { key: "elite", label: "💎 Elite" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setTierFilter(f.key)}
                    className={`px-4 py-2 rounded-full text-xs font-black border transition-all ${tierFilter === f.key ? "bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white border-transparent shadow-md" : "bg-white border-gray-200 text-gray-500 hover:border-blue-200 hover:text-blue-600"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAddons.map((tpl) => (
                  <AddOnShowcaseCard key={tpl.id} tpl={tpl} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom checkout bar */}
      {step === "plans" && cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-2xl">
          <div className="container mx-auto px-6 py-3.5 flex items-center justify-between max-w-6xl gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl border-2 border-white flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] shadow-md">
                <i className="ri-vip-crown-line text-white text-xs" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-gray-400">{cart[0].name}</p>
                <p className="font-black text-gray-900 text-sm">
                  {fmt(total)}{" "}
                  <span className="text-gray-400 font-normal text-xs">
                    incl. GST
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="flex items-center gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white font-black px-7 py-3.5 rounded-xl hover:shadow-xl hover:shadow-blue-200 transition-all hover:scale-105 active:scale-95"
            >
              <i className="ri-qr-code-line text-lg" />
              Pay via UPI
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
